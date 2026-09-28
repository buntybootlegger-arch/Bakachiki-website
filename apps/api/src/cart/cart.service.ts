import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { PrismaTx } from "../prisma/prisma.types";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";

const CART_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salePrice: true,
          images: { orderBy: { position: "asc" as const }, take: 1 },
        },
      },
      variant: true,
    },
  },
};

function toNumber(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCart(cart: any) {
    const items = cart.items.map((item: any) => {
      const unitPrice = item.variant
        ? toNumber(item.variant.salePrice) || toNumber(item.variant.price)
        : toNumber(item.product.salePrice) || toNumber(item.product.price);
      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSlug: item.product.slug,
        thumbnailUrl: item.product.images?.[0]?.url ?? null,
        variantId: item.variantId,
        variantLabel: item.variant
          ? [item.variant.size, item.variant.color].filter(Boolean).join(" / ")
          : null,
        quantity: item.quantity,
        unitPrice,
        lineTotal: Number((unitPrice * item.quantity).toFixed(2)),
      };
    });
    const subtotal = Number(items.reduce((sum: number, i: any) => sum + i.lineTotal, 0).toFixed(2));
    return { id: cart.id, token: cart.token, items, subtotal, itemCount: items.reduce((s: number, i: any) => s + i.quantity, 0) };
  }

  async getOrCreateCart(token: string | undefined, userId: string | null) {
    let cart = token
      ? await this.prisma.cart.findUnique({ where: { token }, include: CART_INCLUDE })
      : null;

    if (!cart && userId) {
      cart = await this.prisma.cart.findFirst({ where: { userId }, include: CART_INCLUDE });
    }

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { token: crypto.randomUUID(), userId: userId ?? undefined },
        include: CART_INCLUDE,
      });
    } else if (userId && !cart.userId) {
      cart = await this.prisma.cart.update({
        where: { id: cart.id },
        data: { userId },
        include: CART_INCLUDE,
      });
    }

    return this.mapCart(cart);
  }

  private async assertStockAvailable(productId: string, variantId: string | undefined, requestedQty: number) {
    if (variantId) {
      const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant || variant.productId !== productId) throw new NotFoundException("Variant not found");
      if (variant.stock < requestedQty) {
        throw new BadRequestException(`Only ${variant.stock} unit(s) left in stock`);
      }
    } else {
      const product = await this.prisma.product.findUnique({ where: { id: productId } });
      if (!product || !product.isActive) throw new NotFoundException("Product not found");
      if (product.stock < requestedQty) {
        throw new BadRequestException(`Only ${product.stock} unit(s) left in stock`);
      }
    }
  }

  async addItem(token: string | undefined, userId: string | null, dto: AddCartItemDto) {
    const cart = await this.getOrCreateCartEntity(token, userId);
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
      },
    });

    const newQuantity = (existing?.quantity ?? 0) + dto.quantity;
    await this.assertStockAvailable(dto.productId, dto.variantId, newQuantity);

    if (existing) {
      await this.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQuantity } });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getOrCreateCart(cart.token, userId);
  }

  async updateItem(token: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
    if (!item || item.cart.token !== token) throw new NotFoundException("Cart item not found");

    await this.assertStockAvailable(item.productId, item.variantId ?? undefined, dto.quantity);
    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
    return this.getOrCreateCart(token, item.cart.userId);
  }

  async removeItem(token: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
    if (!item || item.cart.token !== token) throw new NotFoundException("Cart item not found");

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getOrCreateCart(token, item.cart.userId);
  }

  /** Merges a guest cart's items into the authenticated user's cart on login. */
  async mergeGuestIntoUser(guestToken: string | undefined, userId: string) {
    const userCart = await this.getOrCreateCartEntity(undefined, userId);
    if (!guestToken || guestToken === userCart.token) {
      return this.getOrCreateCart(userCart.token, userId);
    }

    const guestCart = await this.prisma.cart.findUnique({
      where: { token: guestToken },
      include: { items: true },
    });
    if (guestCart && guestCart.id !== userCart.id) {
      for (const item of guestCart.items) {
        const existing = await this.prisma.cartItem.findFirst({
          where: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
          },
        });
        if (existing) {
          await this.prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          await this.prisma.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            },
          });
        }
      }
      await this.prisma.cart.delete({ where: { id: guestCart.id } });
    }

    return this.getOrCreateCart(userCart.token, userId);
  }

  /** Raw cart + items for checkout (unlike getOrCreateCart, not re-priced
   * from current product prices — OrdersService re-derives pricing itself
   * from Product/ProductVariant inside its own transaction). */
  async getCheckoutCart(token: string | undefined, userId: string) {
    const cart = await this.getOrCreateCartEntity(token, userId);
    const items = await this.prisma.cartItem.findMany({ where: { cartId: cart.id } });
    return { cartId: cart.id, token: cart.token, items };
  }

  async clearCart(cartId: string, tx: PrismaTx = this.prisma) {
    await tx.cartItem.deleteMany({ where: { cartId } });
  }

  private async getOrCreateCartEntity(token: string | undefined, userId: string | null) {
    let cart = token ? await this.prisma.cart.findUnique({ where: { token } }) : null;
    if (!cart && userId) {
      cart = await this.prisma.cart.findFirst({ where: { userId } });
    }
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { token: crypto.randomUUID(), userId: userId ?? undefined },
      });
    } else if (userId && !cart.userId) {
      cart = await this.prisma.cart.update({ where: { id: cart.id }, data: { userId } });
    }
    return cart;
  }
}
