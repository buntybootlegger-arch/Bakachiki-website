import { Module } from "@nestjs/common";
import { ShippingController, AdminShippingController } from "./shipping.controller";
import { ShippingService } from "./shipping.service";
import { CartModule } from "../cart/cart.module";

@Module({
  imports: [CartModule],
  controllers: [ShippingController, AdminShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
