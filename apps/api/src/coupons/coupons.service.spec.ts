import { BadRequestException } from "@nestjs/common";
import { CouponsService } from "./coupons.service";

function makeService() {
  const prisma = {
    coupon: { findUnique: jest.fn() },
    couponUsage: { count: jest.fn() },
  };
  const service = new CouponsService(prisma as any);
  return { service, prisma };
}

const baseCoupon = {
  id: "coupon-1",
  code: "SAVE10",
  type: "PERCENTAGE",
  value: 10,
  minOrderAmount: null,
  maxDiscountAmount: null,
  usageLimit: null,
  usageLimitPerCustomer: null,
  startAt: null,
  endAt: null,
  isActive: true,
  applicableCategoryIds: [],
  applicableProductIds: [],
};

const items = [
  { productId: "p1", categoryId: "cat-1", lineSubtotal: 600 },
  { productId: "p2", categoryId: "cat-2", lineSubtotal: 400 },
];

describe("CouponsService — validate()", () => {
  it("rejects an unknown or inactive code", async () => {
    const { service, prisma } = makeService();
    prisma.coupon.findUnique.mockResolvedValue(null);

    await expect(
      service.validate({ code: "NOPE", userId: "u1", items, subtotal: 1000 }),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects a coupon outside its active date window", async () => {
    const { service, prisma } = makeService();
    prisma.coupon.findUnique.mockResolvedValue({
      ...baseCoupon,
      endAt: new Date("2020-01-01"),
    });

    await expect(
      service.validate({ code: "SAVE10", userId: "u1", items, subtotal: 1000 }),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects when the cart subtotal is below minOrderAmount", async () => {
    const { service, prisma } = makeService();
    prisma.coupon.findUnique.mockResolvedValue({ ...baseCoupon, minOrderAmount: 2000 });

    await expect(
      service.validate({ code: "SAVE10", userId: "u1", items, subtotal: 1000 }),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects once the customer has already used a per-customer-limited coupon", async () => {
    const { service, prisma } = makeService();
    prisma.coupon.findUnique.mockResolvedValue({ ...baseCoupon, usageLimitPerCustomer: 1 });
    prisma.couponUsage.count.mockResolvedValue(1);

    await expect(
      service.validate({ code: "SAVE10", userId: "u1", items, subtotal: 1000 }),
    ).rejects.toThrow(BadRequestException);
  });

  it("computes a flat percentage discount across the whole cart when unscoped", async () => {
    const { service, prisma } = makeService();
    prisma.coupon.findUnique.mockResolvedValue(baseCoupon);

    const result = await service.validate({ code: "SAVE10", userId: "u1", items, subtotal: 1000 });

    expect(result.discountAmount).toBe(100);
    expect(result.discountPerLine).toEqual([60, 40]);
  });

  it("only discounts qualifying lines when scoped to a category", async () => {
    const { service, prisma } = makeService();
    prisma.coupon.findUnique.mockResolvedValue({ ...baseCoupon, applicableCategoryIds: ["cat-1"] });

    const result = await service.validate({ code: "SAVE10", userId: "u1", items, subtotal: 1000 });

    // Only p1 (cat-1, subtotal 600) qualifies: 10% of 600 = 60
    expect(result.discountAmount).toBe(60);
    expect(result.discountPerLine).toEqual([60, 0]);
  });

  it("rejects a scoped coupon when nothing in the cart qualifies", async () => {
    const { service, prisma } = makeService();
    prisma.coupon.findUnique.mockResolvedValue({ ...baseCoupon, applicableCategoryIds: ["cat-99"] });

    await expect(
      service.validate({ code: "SAVE10", userId: "u1", items, subtotal: 1000 }),
    ).rejects.toThrow(BadRequestException);
  });

  it("caps a percentage discount at maxDiscountAmount", async () => {
    const { service, prisma } = makeService();
    prisma.coupon.findUnique.mockResolvedValue({ ...baseCoupon, value: 50, maxDiscountAmount: 75 });

    const result = await service.validate({ code: "SAVE10", userId: "u1", items, subtotal: 1000 });

    // 50% of 1000 = 500, capped to 75
    expect(result.discountAmount).toBe(75);
  });

  it("marks freeShipping for a FREE_SHIPPING coupon without discounting line items", async () => {
    const { service, prisma } = makeService();
    prisma.coupon.findUnique.mockResolvedValue({ ...baseCoupon, type: "FREE_SHIPPING", value: 0 });

    const result = await service.validate({ code: "SAVE10", userId: "u1", items, subtotal: 1000 });

    expect(result.freeShipping).toBe(true);
    expect(result.discountAmount).toBe(0);
  });
});
