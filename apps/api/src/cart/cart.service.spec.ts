import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CartService } from "./cart.service";

function makeService() {
  const prisma = {
    cart: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    cartItem: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    product: { findUnique: jest.fn() },
    productVariant: { findUnique: jest.fn() },
  };
  const service = new CartService(prisma as any);
  return { service, prisma };
}

const baseCart = { id: "cart-1", token: "tok-1", userId: null, items: [] };

describe("CartService — stock protection", () => {
  it("rejects adding more units than are in stock (no variant)", async () => {
    const { service, prisma } = makeService();
    prisma.cart.findUnique.mockResolvedValue(baseCart);
    prisma.cartItem.findFirst.mockResolvedValue(null);
    prisma.product.findUnique.mockResolvedValue({ id: "p1", isActive: true, stock: 5 });

    await expect(
      service.addItem("tok-1", null, { productId: "p1", quantity: 10 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects adding more units than a specific variant has in stock", async () => {
    const { service, prisma } = makeService();
    prisma.cart.findUnique.mockResolvedValue(baseCart);
    prisma.cartItem.findFirst.mockResolvedValue(null);
    prisma.productVariant.findUnique.mockResolvedValue({ id: "v1", productId: "p1", stock: 2 });

    await expect(
      service.addItem("tok-1", null, { productId: "p1", variantId: "v1", quantity: 3 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("accounts for quantity already in the cart when checking stock", async () => {
    const { service, prisma } = makeService();
    prisma.cart.findUnique.mockResolvedValue(baseCart);
    prisma.cartItem.findFirst.mockResolvedValue({ id: "item-1", quantity: 4 });
    prisma.product.findUnique.mockResolvedValue({ id: "p1", isActive: true, stock: 5 });

    // 4 already in cart + 2 more requested = 6, exceeds stock of 5
    await expect(
      service.addItem("tok-1", null, { productId: "p1", quantity: 2 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("throws NotFoundException for a variant that does not belong to the product", async () => {
    const { service, prisma } = makeService();
    prisma.cart.findUnique.mockResolvedValue(baseCart);
    prisma.cartItem.findFirst.mockResolvedValue(null);
    prisma.productVariant.findUnique.mockResolvedValue({ id: "v1", productId: "other-product", stock: 10 });

    await expect(
      service.addItem("tok-1", null, { productId: "p1", variantId: "v1", quantity: 1 } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it("allows adding a quantity within stock", async () => {
    const { service, prisma } = makeService();
    prisma.cart.findUnique.mockResolvedValue(baseCart);
    prisma.cartItem.findFirst.mockResolvedValue(null);
    prisma.product.findUnique.mockResolvedValue({ id: "p1", isActive: true, stock: 5 });
    prisma.cartItem.create.mockResolvedValue({});

    await expect(
      service.addItem("tok-1", null, { productId: "p1", quantity: 3 } as any),
    ).resolves.toBeDefined();
    expect(prisma.cartItem.create).toHaveBeenCalled();
  });
});
