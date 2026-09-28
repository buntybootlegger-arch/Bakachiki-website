import { BadRequestException } from "@nestjs/common";
import { OrdersService } from "./orders.service";

function makeService() {
  const tx = {
    product: { findMany: jest.fn(), updateMany: jest.fn() },
    productVariant: { findMany: jest.fn(), updateMany: jest.fn() },
    order: { create: jest.fn() },
    $queryRaw: jest.fn(),
  };
  const prisma = {
    address: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(tx)),
  };
  const cartService = { getCheckoutCart: jest.fn(), clearCart: jest.fn() };
  const couponsService = { validate: jest.fn(), recordUsage: jest.fn() };
  const shippingService = { calculate: jest.fn() };
  const paymentsService = { createPending: jest.fn(), initiate: jest.fn() };

  const service = new OrdersService(
    prisma as any,
    cartService as any,
    couponsService as any,
    shippingService as any,
    paymentsService as any,
  );
  return { service, prisma, tx, cartService, couponsService, shippingService, paymentsService };
}

const address = {
  id: "addr-1",
  userId: "u1",
  fullName: "Jane Doe",
  phone: "9999999999",
  line1: "1 MG Road",
  line2: null,
  city: "Pune",
  state: "Maharashtra",
  postalCode: "411001",
  country: "IN",
};

const user = { id: "u1", email: "jane@example.com", firstName: "Jane", lastName: "Doe" };

describe("OrdersService.placeOrder", () => {
  it("rolls back and throws when a concurrent checkout already took the last unit", async () => {
    const { service, prisma, tx, cartService } = makeService();
    prisma.address.findUnique.mockResolvedValue(address);
    prisma.user.findUnique.mockResolvedValue(user);
    cartService.getCheckoutCart.mockResolvedValue({
      cartId: "cart-1",
      token: "tok-1",
      items: [{ productId: "p1", variantId: null, quantity: 10 }],
    });
    tx.product.findMany.mockResolvedValue([
      { id: "p1", name: "Shirt", sku: "SKU1", price: 100, salePrice: null, gstRate: 0, categoryId: "cat1", isActive: true, weightGrams: 200 },
    ]);
    tx.productVariant.findMany.mockResolvedValue([]);
    // Guarded update affects 0 rows: someone else bought the remaining stock first.
    tx.product.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.placeOrder("u1", "tok-1", { shippingAddressId: "addr-1", paymentGateway: "COD" } as any),
    ).rejects.toThrow(BadRequestException);

    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("computes subtotal/tax/shipping/total correctly with no coupon", async () => {
    const { service, prisma, tx, cartService, shippingService, paymentsService } = makeService();
    prisma.address.findUnique.mockResolvedValue(address);
    prisma.user.findUnique.mockResolvedValue(user);
    cartService.getCheckoutCart.mockResolvedValue({
      cartId: "cart-1",
      token: "tok-1",
      items: [{ productId: "p1", variantId: null, quantity: 2 }],
    });
    tx.product.findMany.mockResolvedValue([
      { id: "p1", name: "Shirt", sku: "SKU1", price: 100, salePrice: null, gstRate: 18, categoryId: "cat1", isActive: true, weightGrams: 200 },
    ]);
    tx.productVariant.findMany.mockResolvedValue([]);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    shippingService.calculate.mockResolvedValue({ zoneId: "z1", rateId: "r1", label: "Standard", amount: 50, codAvailable: true });
    tx.$queryRaw.mockResolvedValue([{ nextval: 1000n }]);
    tx.order.create.mockResolvedValue({ id: "order-1", orderNumber: "BK-1000", status: "CONFIRMED", totalAmount: 286 });
    paymentsService.createPending.mockResolvedValue(undefined);

    const result = await service.placeOrder("u1", "tok-1", {
      shippingAddressId: "addr-1",
      paymentGateway: "COD",
    } as any);

    expect(result).toEqual({ orderId: "order-1", orderNumber: "BK-1000", status: "CONFIRMED" });

    const createArgs = tx.order.create.mock.calls[0][0];
    // subtotal = 100*2 = 200; tax = 200*18% = 36; shipping = 50; total = 200-0+36+50 = 286
    expect(createArgs.data.subtotal).toBe(200);
    expect(createArgs.data.discountAmount).toBe(0);
    expect(createArgs.data.shippingAmount).toBe(50);
    expect(createArgs.data.taxAmount).toBe(36);
    expect(createArgs.data.totalAmount).toBe(286);
    expect(createArgs.data.items.create[0]).toMatchObject({
      unitPrice: 100,
      quantity: 2,
      gstRate: 18,
      discountShare: 0,
      taxAmount: 36,
      lineTotal: 236,
    });

    expect(cartService.clearCart).toHaveBeenCalledWith("cart-1", tx);
  });

  it("applies a coupon's discount before computing tax, and records usage", async () => {
    const { service, prisma, tx, cartService, couponsService, shippingService, paymentsService } = makeService();
    prisma.address.findUnique.mockResolvedValue(address);
    prisma.user.findUnique.mockResolvedValue(user);
    cartService.getCheckoutCart.mockResolvedValue({
      cartId: "cart-1",
      token: "tok-1",
      items: [{ productId: "p1", variantId: null, quantity: 2 }],
    });
    tx.product.findMany.mockResolvedValue([
      { id: "p1", name: "Shirt", sku: "SKU1", price: 100, salePrice: null, gstRate: 18, categoryId: "cat1", isActive: true, weightGrams: 200 },
    ]);
    tx.productVariant.findMany.mockResolvedValue([]);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    couponsService.validate.mockResolvedValue({
      couponId: "coupon-1",
      code: "SAVE10",
      discountAmount: 20,
      discountPerLine: [20],
      freeShipping: false,
    });
    shippingService.calculate.mockResolvedValue({ zoneId: "z1", rateId: "r1", label: "Standard", amount: 50, codAvailable: true });
    tx.$queryRaw.mockResolvedValue([{ nextval: 1001n }]);
    tx.order.create.mockResolvedValue({ id: "order-2", orderNumber: "BK-1001", status: "CONFIRMED", totalAmount: 262.4 });
    paymentsService.createPending.mockResolvedValue(undefined);

    await service.placeOrder("u1", "tok-1", {
      shippingAddressId: "addr-1",
      couponCode: "SAVE10",
      paymentGateway: "COD",
    } as any);

    const createArgs = tx.order.create.mock.calls[0][0];
    // subtotal 200, discount 20 -> discounted line 180, tax = 180*18% = 32.4, total = 200-20+32.4+50 = 262.4
    expect(createArgs.data.discountAmount).toBe(20);
    expect(createArgs.data.taxAmount).toBe(32.4);
    expect(createArgs.data.totalAmount).toBe(262.4);
    expect(createArgs.data.couponId).toBe("coupon-1");

    expect(couponsService.recordUsage).toHaveBeenCalledWith(
      { couponId: "coupon-1", userId: "u1", orderId: "order-2", discountAmount: 20 },
      tx,
    );
  });

  it("rejects Cash on Delivery when the resolved shipping rate doesn't support it", async () => {
    const { service, prisma, tx, cartService, shippingService } = makeService();
    prisma.address.findUnique.mockResolvedValue(address);
    prisma.user.findUnique.mockResolvedValue(user);
    cartService.getCheckoutCart.mockResolvedValue({
      cartId: "cart-1",
      token: "tok-1",
      items: [{ productId: "p1", variantId: null, quantity: 1 }],
    });
    tx.product.findMany.mockResolvedValue([
      { id: "p1", name: "Shirt", sku: "SKU1", price: 100, salePrice: null, gstRate: 0, categoryId: "cat1", isActive: true, weightGrams: 200 },
    ]);
    tx.productVariant.findMany.mockResolvedValue([]);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    shippingService.calculate.mockResolvedValue({ zoneId: "z1", rateId: "r1", label: "Express", amount: 150, codAvailable: false });

    await expect(
      service.placeOrder("u1", "tok-1", { shippingAddressId: "addr-1", paymentGateway: "COD" } as any),
    ).rejects.toThrow(BadRequestException);
  });
});
