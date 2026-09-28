import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import type { Request } from "express";
import { ShippingService } from "./shipping.service";
import { CartService } from "../cart/cart.service";
import { CART_COOKIE } from "../cart/cart.controller";
import { QuoteShippingDto } from "./dto/quote-shipping.dto";
import { CreateShippingZoneDto } from "./dto/create-shipping-zone.dto";
import { UpdateShippingZoneDto } from "./dto/update-shipping-zone.dto";
import { CreateShippingRateDto } from "./dto/create-shipping-rate.dto";
import { UpdateShippingRateDto } from "./dto/update-shipping-rate.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuditLog } from "../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../common/interceptors/audit-log.interceptor";

@Controller("shipping")
@UseGuards(JwtAuthGuard)
export class ShippingController {
  constructor(
    private readonly shippingService: ShippingService,
    private readonly cartService: CartService,
  ) {}

  /** Estimate only — the checkout flow re-derives the real shipping amount
   * server-side when the order is actually placed. */
  @Post("quote")
  async quote(@Req() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() dto: QuoteShippingDto) {
    const cart = await this.cartService.getCheckoutCart(req.cookies?.[CART_COOKIE], user.id);
    return this.shippingService.quoteForCart(
      cart.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      { country: dto.country ?? "IN", state: dto.state },
    );
  }
}

@Controller("admin/shipping")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get("zones")
  @Permissions("shipping:read")
  listZones() {
    return this.shippingService.listZones();
  }

  @Post("zones")
  @Permissions("shipping:write")
  @AuditLog("ShippingZone")
  createZone(@Body() dto: CreateShippingZoneDto) {
    return this.shippingService.createZone(dto);
  }

  @Patch("zones/:id")
  @Permissions("shipping:write")
  @AuditLog("ShippingZone")
  updateZone(@Param("id") id: string, @Body() dto: UpdateShippingZoneDto) {
    return this.shippingService.updateZone(id, dto);
  }

  @Delete("zones/:id")
  @Permissions("shipping:write")
  @AuditLog("ShippingZone")
  removeZone(@Param("id") id: string) {
    return this.shippingService.removeZone(id);
  }

  @Post("rates")
  @Permissions("shipping:write")
  @AuditLog("ShippingRate")
  createRate(@Body() dto: CreateShippingRateDto) {
    return this.shippingService.createRate(dto);
  }

  @Patch("rates/:id")
  @Permissions("shipping:write")
  @AuditLog("ShippingRate")
  updateRate(@Param("id") id: string, @Body() dto: UpdateShippingRateDto) {
    return this.shippingService.updateRate(id, dto);
  }

  @Delete("rates/:id")
  @Permissions("shipping:write")
  @AuditLog("ShippingRate")
  removeRate(@Param("id") id: string) {
    return this.shippingService.removeRate(id);
  }
}
