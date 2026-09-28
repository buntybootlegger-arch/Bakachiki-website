import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, PaymentGatewayType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CartService } from "../cart/cart.service";
import { CouponsService } from "../coupons/coupons.service";
import { ShippingService } from "../shipping/shipping.service";
import { PaymentsService } from "../payments/payments.service";
import { PlaceOrderDto } from "./dto/place-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { QueryOrdersDto } from "./dto/query-orders.dto";

function toNumber(value: Prisma.Decimal | null | undefined): number {
  return value === null || value === undefined ? 0 : Number(value);
}

/** Which statuses an order can move to next, enforced by updateStatus().
 * Return/refund *processing* (approve/reject, restocking inspected items)
 * is Phase 4 scope — these are just the terminal-state names reserved now
 * so the enum never needs a breaking migration later. */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.OUT_FOR_DELIVERY],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [OrderStatus.RETURN_REQUESTED],
  CANCELLED: [],
  RETURN_REQUESTED: [OrderStatus.RETURNED],
  RETURNED: [OrderStatus.REFUNDED],
  REFUNDED: [],
};

const ORDER_DETAIL_INCLUDE = {
  items: true,
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  payments: { orderBy: { createdAt: "desc" as const } },
  coupon: { select: { code: true } },
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly couponsService: CouponsService,
    private readonly shippingService: ShippingService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async placeOrder(userId: string, cartToken: string | undefined, dto: PlaceOrderDto) {
    const [shipAddr, billAddr, user] = await Promise.all([
      this.prisma.address.findUnique({ where: { id: dto.shippingAddressId } }),
      dto.billingAddressId ? this.prisma.address.findUnique({ where: { id: dto.billingAddressId } }) : null,
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!shipAddr || shipAddr.userId !== userId) throw new NotFoundException("Shipping address not found");
    if (dto.billingAddressId && (!billAddr || billAddr.userId !== userId)) {
      throw new NotFoundException("Billing address not found");
    }
    const billingAddr = billAddr ?? shipAddr;
    if (!user) throw new NotFoundException("User not found");

    const cart = await this.cartService.getCheckoutCart(cartToken, userId);
    if (cart.items.length === 0) throw new BadRequestException("Your cart is empty");

    const order = await this.prisma.$transaction(async (tx) => {
      const productIds = [...new Set(cart.items.map((i) => i.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true, price: true, salePrice: true, gstRate: true, categoryId: true, isActive: true, weightGrams: true },
      });
      const variantIds = cart.items.filter((i) => i.variantId).map((i) => i.variantId as string);
      const variants = variantIds.length ? await tx.productVariant.findMany({ where: { id: { in: variantIds } } }) : [];
      const productById = new Map(products.map((p) => [p.id, p]));
      const variantById = new Map(variants.map((v) => [v.id, v]));

      interface Line {
        productId: string;
        variantId: string | null;
        productName: string;
        variantLabel: string | null;
        sku: string;
        unitPrice: number;
        quantity: number;
        gstRate: number;
        categoryId: string;
        weightGrams: number;
        lineSubtotal: number;
      }

      const lines: Line[] = [];
      for (const item of cart.items) {
        const product = productById.get(item.productId);
        if (!product || !product.isActive) {
          throw new BadRequestException("A product in your cart is no longer available");
        }
        const variant = item.variantId ? variantById.get(item.variantId) : undefined;
        if (item.variantId && !variant) throw new BadRequestException("A selected variant is no longer available");

        const unitPrice = variant
          ? Number(variant.salePrice ?? variant.price)
          : Number(product.salePrice ?? product.price);
        lines.push({
          productId: product.id,
          variantId: item.variantId,
          productName: product.name,
          variantLabel: variant ? [variant.size, variant.color].filter(Boolean).join(" / ") || null : null,
          sku: variant ? variant.sku : product.sku,
          unitPrice,
          quantity: item.quantity,
          gstRate: Number(product.gstRate),
          categoryId: product.categoryId,
          weightGrams: product.weightGrams ?? 0,
          lineSubtotal: Number((unitPrice * item.quantity).toFixed(2)),
        });
      }

      // Atomic, race-safe stock guard: the WHERE clause only matches if
      // enough stock is still there at write time, so a concurrent checkout
      // for the last unit can't oversell — whichever transaction commits
      // first wins, the other's updateMany affects 0 rows and rolls back.
      for (const line of lines) {
        const updated = line.variantId
          ? await tx.productVariant.updateMany({
              where: { id: line.variantId, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity } },
            })
          : await tx.product.updateMany({
              where: { id: line.productId, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity } },
            });
        if (updated.count === 0) {
          throw new BadRequestException(`"${line.productName}" no longer has enough stock`);
        }
      }

      const subtotal = Number(lines.reduce((sum, l) => sum + l.lineSubtotal, 0).toFixed(2));

      let couponApp: Awaited<ReturnType<CouponsService["validate"]>> | null = null;
      if (dto.couponCode) {
        couponApp = await this.couponsService.validate(
          {
            code: dto.couponCode,
            userId,
            items: lines.map((l) => ({ productId: l.productId, categoryId: l.categoryId, lineSubtotal: l.lineSubtotal })),
            subtotal,
          },
          tx,
        );
      }
      const discountAmount = couponApp?.discountAmount ?? 0;

      const totalWeightGrams = lines.reduce((sum, l) => sum + l.weightGrams * l.quantity, 0);
      const shippingQuote = await this.shippingService.calculate(
        { country: shipAddr.country, state: shipAddr.state, weightGrams: totalWeightGrams, subtotal },
        tx,
      );
      if (dto.paymentGateway === "COD" && !shippingQuote.codAvailable) {
        throw new BadRequestException("Cash on Delivery is not available for this address");
      }
      const shippingAmount = couponApp?.freeShipping ? 0 : shippingQuote.amount;

      let taxAmount = 0;
      const itemsData = lines.map((line, idx) => {
        const discountShare = couponApp?.discountPerLine[idx] ?? 0;
        const discountedLine = Number((line.lineSubtotal - discountShare).toFixed(2));
        const lineTax = Number((discountedLine * (line.gstRate / 100)).toFixed(2));
        taxAmount += lineTax;
        const lineTotal = Number((discountedLine + lineTax).toFixed(2));
        return {
          productId: line.productId,
          variantId: line.variantId,
          productName: line.productName,
          variantLabel: line.variantLabel,
          sku: line.sku,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          gstRate: line.gstRate,
          discountShare,
          taxAmount: lineTax,
          lineTotal,
        };
      });
      taxAmount = Number(taxAmount.toFixed(2));
      const totalAmount = Number((subtotal - discountAmount + taxAmount + shippingAmount).toFixed(2));

      const [{ nextval }] = await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('order_number_seq')`;
      const orderNumber = `BK-${nextval}`;

      const initialStatus = dto.paymentGateway === "COD" ? OrderStatus.CONFIRMED : OrderStatus.PENDING;

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: initialStatus,
          subtotal,
          discountAmount,
          shippingAmount,
          taxAmount,
          totalAmount,
          couponId: couponApp?.couponId,
          gstNumber: dto.gstNumber,
          shipToName: shipAddr.fullName,
          shipToPhone: shipAddr.phone,
          shipToLine1: shipAddr.line1,
          shipToLine2: shipAddr.line2,
          shipToCity: shipAddr.city,
          shipToState: shipAddr.state,
          shipToPostalCode: shipAddr.postalCode,
          shipToCountry: shipAddr.country,
          billToName: billingAddr.fullName,
          billToPhone: billingAddr.phone,
          billToLine1: billingAddr.line1,
          billToLine2: billingAddr.line2,
          billToCity: billingAddr.city,
          billToState: billingAddr.state,
          billToPostalCode: billingAddr.postalCode,
          billToCountry: billingAddr.country,
          notes: dto.notes,
          items: { create: itemsData },
          statusHistory: { create: { status: initialStatus, note: "Order placed" } },
        },
      });

      if (couponApp) {
        await this.couponsService.recordUsage(
          { couponId: couponApp.couponId, userId, orderId: created.id, discountAmount: couponApp.discountAmount },
          tx,
        );
      }

      const gatewayType = dto.paymentGateway === "COD" ? PaymentGatewayType.COD : PaymentGatewayType.PAYU;
      await this.paymentsService.createPending({ orderId: created.id, gateway: gatewayType, amount: totalAmount }, tx);

      await this.cartService.clearCart(cart.cartId, tx);

      return created;
    });

    if (dto.paymentGateway === "PAYU") {
      const payment = this.paymentsService.initiate({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount),
        gateway: PaymentGatewayType.PAYU,
        customerName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
        customerEmail: user.email,
        customerPhone: shipAddr.phone,
      });
      return { orderId: order.id, orderNumber: order.orderNumber, payment };
    }

    return { orderId: order.id, orderNumber: order.orderNumber, status: order.status };
  }

  async findOwn(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: ORDER_DETAIL_INCLUDE });
    if (!order || order.userId !== userId) throw new NotFoundException("Order not found");
    return this.mapOrder(order);
  }

  async listOwn(userId: string, page = 1, pageSize = 20) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { items: true },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { items: items.map((o) => this.mapOrder(o)), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findAdminOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { ...ORDER_DETAIL_INCLUDE, user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    if (!order) throw new NotFoundException("Order not found");
    return this.mapOrder(order);
  }

  async listAdmin(query: QueryOrdersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.status = query.status as OrderStatus;
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: "insensitive" } },
        { user: { email: { contains: query.search, mode: "insensitive" } } },
      ];
    }
    if (query.dateFrom || query.dateTo) {
      where.placedAt = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { items: true, user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items: items.map((o) => this.mapOrder(o)), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, adminId: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException("Order not found");

    const nextStatus = dto.status as OrderStatus;
    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(`Cannot move an order from ${order.status} to ${nextStatus}`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Cancelling before fulfillment returns the reserved stock. Returns
      // (RETURN_REQUESTED → RETURNED) are Phase 4's job — they involve an
      // actual inspected-goods-received step, not an automatic restock here.
      if (nextStatus === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
          } else {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          }
        }
      }

      await tx.order.update({
        where: { id },
        data: {
          status: nextStatus,
          deliveredAt: nextStatus === OrderStatus.DELIVERED ? new Date() : undefined,
          cancelledAt: nextStatus === OrderStatus.CANCELLED ? new Date() : undefined,
        },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: id, status: nextStatus, note: dto.note, changedByAdminId: adminId },
      });
    });

    return this.findAdminOne(id);
  }

  async adminSummary() {
    const [orderCount, revenue] = await Promise.all([
      this.prisma.order.count({ where: { status: { not: OrderStatus.CANCELLED } } }),
      this.prisma.order.aggregate({
        where: { status: { not: OrderStatus.CANCELLED } },
        _sum: { totalAmount: true },
      }),
    ]);
    return { totalOrders: orderCount, totalRevenue: toNumber(revenue._sum.totalAmount) };
  }

  private mapOrder(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    subtotal: Prisma.Decimal;
    discountAmount: Prisma.Decimal;
    shippingAmount: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    [key: string]: unknown;
  }) {
    return {
      ...order,
      subtotal: toNumber(order.subtotal),
      discountAmount: toNumber(order.discountAmount),
      shippingAmount: toNumber(order.shippingAmount),
      taxAmount: toNumber(order.taxAmount),
      totalAmount: toNumber(order.totalAmount),
      items: Array.isArray(order.items)
        ? (order.items as Array<Record<string, unknown>>).map((item) => ({
            ...item,
            unitPrice: toNumber(item.unitPrice as Prisma.Decimal),
            gstRate: toNumber(item.gstRate as Prisma.Decimal),
            discountShare: toNumber(item.discountShare as Prisma.Decimal),
            taxAmount: toNumber(item.taxAmount as Prisma.Decimal),
            lineTotal: toNumber(item.lineTotal as Prisma.Decimal),
          }))
        : undefined,
      payments: Array.isArray(order.payments)
        ? (order.payments as Array<Record<string, unknown>>).map((p) => ({ ...p, amount: toNumber(p.amount as Prisma.Decimal) }))
        : undefined,
    };
  }
}
