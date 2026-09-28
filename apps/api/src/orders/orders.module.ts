import { Module } from "@nestjs/common";
import { CheckoutController } from "./checkout.controller";
import { OrdersController, AdminOrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { InvoiceService } from "./invoice.service";
import { CartModule } from "../cart/cart.module";
import { CouponsModule } from "../coupons/coupons.module";
import { ShippingModule } from "../shipping/shipping.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [CartModule, CouponsModule, ShippingModule, PaymentsModule],
  controllers: [CheckoutController, OrdersController, AdminOrdersController],
  providers: [OrdersService, InvoiceService],
})
export class OrdersModule {}
