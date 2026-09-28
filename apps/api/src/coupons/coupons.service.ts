import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { PrismaTx } from "../prisma/prisma.types";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";
import { QueryCouponsDto } from "./dto/query-coupons.dto";

function toNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

export interface CouponLineInput {
  productId: string;
  categoryId: string;
  /** unitPrice * quantity, before any discount. */
  lineSubtotal: number;
}

export interface CouponApplication {
  couponId: string;
  code: string;
  discountAmount: number;
  /** Same length/order as the `items` passed in — 0 for non-qualifying lines. */
  discountPerLine: number[];
  freeShipping: boolean;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Validates a coupon against the caller's cart and computes the discount.
   * Called both for the non-authoritative checkout-UI preview and, inside
   * OrdersService's transaction, as the authoritative check at order
   * placement — pass `tx` in the latter case so it reads/writes atomically
   * with the rest of the order. */
  async validate(
    params: { code: string; userId: string; items: CouponLineInput[]; subtotal: number },
    tx: PrismaTx = this.prisma,
  ): Promise<CouponApplication> {
    const code = params.code.trim().toUpperCase();
    const coupon = await tx.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) throw new BadRequestException("Invalid coupon code");

    const now = new Date();
    if (coupon.startAt && now < coupon.startAt) throw new BadRequestException("This coupon is not active yet");
    if (coupon.endAt && now > coupon.endAt) throw new BadRequestException("This coupon has expired");

    const minOrder = toNumber(coupon.minOrderAmount);
    if (minOrder !== null && params.subtotal < minOrder) {
      throw new BadRequestException(`This coupon requires a minimum order of ${minOrder}`);
    }

    if (coupon.usageLimit !== null) {
      const totalUses = await tx.couponUsage.count({ where: { couponId: coupon.id } });
      if (totalUses >= coupon.usageLimit) throw new BadRequestException("This coupon has reached its usage limit");
    }
    if (coupon.usageLimitPerCustomer !== null) {
      const userUses = await tx.couponUsage.count({ where: { couponId: coupon.id, userId: params.userId } });
      if (userUses >= coupon.usageLimitPerCustomer) {
        throw new BadRequestException("You've already used this coupon the maximum number of times");
      }
    }

    const scoped = coupon.applicableCategoryIds.length > 0 || coupon.applicableProductIds.length > 0;
    const qualifying = params.items
      .map((item, idx) => ({ item, idx }))
      .filter(
        ({ item }) =>
          !scoped ||
          coupon.applicableProductIds.includes(item.productId) ||
          coupon.applicableCategoryIds.includes(item.categoryId),
      );

    if (scoped && qualifying.length === 0) {
      throw new BadRequestException("This coupon doesn't apply to any items in your cart");
    }

    const qualifyingSubtotal = qualifying.reduce((sum, { item }) => sum + item.lineSubtotal, 0);
    const discountPerLine = new Array(params.items.length).fill(0);

    if (coupon.type === "FREE_SHIPPING") {
      return { couponId: coupon.id, code: coupon.code, discountAmount: 0, discountPerLine, freeShipping: true };
    }

    const rawDiscount =
      coupon.type === "PERCENTAGE" ? qualifyingSubtotal * (Number(coupon.value) / 100) : Number(coupon.value);
    const maxDiscount = toNumber(coupon.maxDiscountAmount);
    const discountAmount = round2(Math.min(rawDiscount, qualifyingSubtotal, maxDiscount ?? Infinity));

    let allocated = 0;
    qualifying.forEach(({ item, idx }, i) => {
      const isLast = i === qualifying.length - 1;
      const share = isLast
        ? round2(discountAmount - allocated)
        : round2((item.lineSubtotal / qualifyingSubtotal) * discountAmount);
      allocated += share;
      discountPerLine[idx] = share;
    });

    return { couponId: coupon.id, code: coupon.code, discountAmount, discountPerLine, freeShipping: false };
  }

  /** Builds validate()'s `items`/`subtotal` inputs from raw cart rows —
   * shared by the checkout-UI preview endpoint; OrdersService builds these
   * itself from the authoritative product reads it already does. */
  async lineInputsFromCart(
    items: { productId: string; variantId: string | null; quantity: number }[],
    tx: PrismaTx = this.prisma,
  ): Promise<{ items: CouponLineInput[]; subtotal: number }> {
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = productIds.length
      ? await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, categoryId: true, price: true, salePrice: true },
        })
      : [];
    const variantIds = items.filter((i) => i.variantId).map((i) => i.variantId as string);
    const variants = variantIds.length
      ? await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, price: true, salePrice: true },
        })
      : [];
    const productById = new Map(products.map((p) => [p.id, p]));
    const variantById = new Map(variants.map((v) => [v.id, v]));

    const lineInputs: CouponLineInput[] = [];
    let subtotal = 0;
    for (const item of items) {
      const product = productById.get(item.productId);
      if (!product) continue;
      const variant = item.variantId ? variantById.get(item.variantId) : undefined;
      const unitPrice = variant
        ? Number(variant.salePrice ?? variant.price)
        : Number(product.salePrice ?? product.price);
      const lineSubtotal = round2(unitPrice * item.quantity);
      subtotal += lineSubtotal;
      lineInputs.push({ productId: item.productId, categoryId: product.categoryId, lineSubtotal });
    }

    return { items: lineInputs, subtotal: round2(subtotal) };
  }

  async recordUsage(
    params: { couponId: string; userId: string; orderId: string; discountAmount: number },
    tx: PrismaTx = this.prisma,
  ) {
    await tx.couponUsage.create({ data: params });
  }

  async list(query: QueryCouponsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.CouponWhereInput = query.search
      ? { code: { contains: query.search, mode: "insensitive" } }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return { items: items.map((c) => this.mapCoupon(c)), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException("Coupon not found");
    return this.mapCoupon(coupon);
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new ConflictException("A coupon with this code already exists");

    const coupon = await this.prisma.coupon.create({
      data: {
        ...dto,
        code,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
      },
    });
    return this.mapCoupon(coupon);
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findExistingOrThrow(id);
    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      const existing = await this.prisma.coupon.findFirst({ where: { code, NOT: { id } } });
      if (existing) throw new ConflictException("A coupon with this code already exists");
    }

    const coupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        code: dto.code ? dto.code.trim().toUpperCase() : undefined,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
      },
    });
    return this.mapCoupon(coupon);
  }

  async remove(id: string) {
    await this.findExistingOrThrow(id);
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  private async findExistingOrThrow(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException("Coupon not found");
    return coupon;
  }

  private mapCoupon(coupon: {
    id: string;
    code: string;
    type: string;
    value: Prisma.Decimal;
    minOrderAmount: Prisma.Decimal | null;
    maxDiscountAmount: Prisma.Decimal | null;
    usageLimit: number | null;
    usageLimitPerCustomer: number | null;
    startAt: Date | null;
    endAt: Date | null;
    isActive: boolean;
    applicableCategoryIds: string[];
    applicableProductIds: string[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...coupon,
      value: toNumber(coupon.value),
      minOrderAmount: toNumber(coupon.minOrderAmount),
      maxDiscountAmount: toNumber(coupon.maxDiscountAmount),
    };
  }
}
