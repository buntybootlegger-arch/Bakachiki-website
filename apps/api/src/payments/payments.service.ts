import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { OrderStatus, PaymentGatewayType, PaymentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { PrismaTx } from "../prisma/prisma.types";
import { GatewayRegistry } from "./gateways/gateway.registry";
import type { GatewayInitResult } from "./gateways/payment-gateway.interface";

export interface InitiatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  gateway: PaymentGatewayType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: GatewayRegistry,
  ) {}

  /** Creates the pending Payment row — called inside OrdersService's
   * checkout transaction, atomic with the Order itself. */
  async createPending(
    params: { orderId: string; gateway: PaymentGatewayType; amount: number },
    tx: PrismaTx = this.prisma,
  ) {
    return tx.payment.create({
      data: {
        orderId: params.orderId,
        gateway: params.gateway,
        amount: params.amount,
        status: params.gateway === PaymentGatewayType.COD ? PaymentStatus.PENDING : PaymentStatus.PENDING,
      },
    });
  }

  /** Kicks off the redirect-based flow — called AFTER the checkout
   * transaction commits (it's a hash computation, not a DB write, and PayU
   * doesn't need to be involved for it to fail the whole order atomically).
   * Returns null for COD, which needs no redirect. */
  initiate(params: InitiatePaymentParams): GatewayInitResult | null {
    if (params.gateway === PaymentGatewayType.COD) return null;
    const gateway = this.registry.get(params.gateway);
    return gateway.initiate({
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      amount: params.amount,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
    });
  }

  /** Handles a PayU success/failure postback. Verifies the callback hash,
   * then re-confirms authoritatively via PayU's server-to-server
   * verify_payment API before trusting anything — the browser postback
   * alone is never sufficient. Idempotent: a repeated callback for an
   * already-resolved payment is a no-op. */
  async handlePayuCallback(payload: Record<string, string>): Promise<{ orderId: string; status: PaymentStatus }> {
    const gateway = this.registry.get(PaymentGatewayType.PAYU);
    if (!gateway.verifyCallbackHash(payload)) {
      throw new BadRequestException("Invalid payment signature");
    }

    const orderId = payload.udf1;
    if (!orderId) throw new BadRequestException("Missing order reference");

    const payment = await this.prisma.payment.findFirst({
      where: { orderId, gateway: PaymentGatewayType.PAYU },
      orderBy: { createdAt: "desc" },
    });
    if (!payment) throw new NotFoundException("Payment not found");

    if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED) {
      return { orderId, status: payment.status };
    }

    const verified = await gateway.verifyServerSide(orderId).catch((err) => {
      this.logger.error("PayU verify_payment call failed", err);
      return { success: false, gatewayTxnId: orderId, amount: 0, rawResponse: { error: String(err) } };
    });
    const status = verified.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status, gatewayTxnId: verified.gatewayTxnId, rawResponse: verified.rawResponse as Prisma.InputJsonValue },
      });
      if (verified.success) {
        await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.CONFIRMED } });
        await tx.orderStatusHistory.create({
          data: { orderId, status: OrderStatus.CONFIRMED, note: "Payment confirmed via PayU" },
        });
      }
    });

    return { orderId, status };
  }
}
