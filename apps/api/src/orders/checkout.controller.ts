import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { OrdersService } from "./orders.service";
import { PlaceOrderDto } from "./dto/place-order.dto";
import { CART_COOKIE } from "../cart/cart.controller";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";

@Controller("checkout")
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post("place-order")
  placeOrder(@Req() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() dto: PlaceOrderDto) {
    return this.ordersService.placeOrder(user.id, req.cookies?.[CART_COOKIE], dto);
  }
}
