import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { GatewayRegistry } from "./gateways/gateway.registry";
import { PayuGateway } from "./gateways/payu.gateway";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, GatewayRegistry, PayuGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}
