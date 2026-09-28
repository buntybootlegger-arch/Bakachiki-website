import { Module } from "@nestjs/common";
import { CouponsController, AdminCouponsController } from "./coupons.controller";
import { CouponsService } from "./coupons.service";
import { CartModule } from "../cart/cart.module";

@Module({
  imports: [CartModule],
  controllers: [CouponsController, AdminCouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
