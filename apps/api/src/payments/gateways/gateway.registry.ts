import { Injectable } from "@nestjs/common";
import { PaymentGatewayType } from "@prisma/client";
import { PayuGateway } from "./payu.gateway";
import type { PaymentGateway } from "./payment-gateway.interface";

/** One entry per online gateway (COD needs none — it never calls out).
 * Adding a second gateway (e.g. Razorpay) later = one new *.gateway.ts file
 * + one line here; OrdersService/PaymentsService never change. */
@Injectable()
export class GatewayRegistry {
  private readonly gateways: Map<PaymentGatewayType, PaymentGateway>;

  constructor(payuGateway: PayuGateway) {
    this.gateways = new Map([[PaymentGatewayType.PAYU, payuGateway]]);
  }

  get(type: PaymentGatewayType): PaymentGateway {
    const gateway = this.gateways.get(type);
    if (!gateway) throw new Error(`No payment gateway registered for ${type}`);
    return gateway;
  }
}
