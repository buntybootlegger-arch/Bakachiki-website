import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import type { Request } from "express";
import { CouponsService } from "./coupons.service";
import { CartService } from "../cart/cart.service";
import { CART_COOKIE } from "../cart/cart.controller";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";
import { QueryCouponsDto } from "./dto/query-coupons.dto";
import { PreviewCouponDto } from "./dto/preview-coupon.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuditLog } from "../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../common/interceptors/audit-log.interceptor";

@Controller("coupons")
@UseGuards(JwtAuthGuard)
export class CouponsController {
  constructor(
    private readonly couponsService: CouponsService,
    private readonly cartService: CartService,
  ) {}

  /** Estimate only, for checkout-UI feedback — re-validated for real inside
   * OrdersService when the order is actually placed. */
  @Post("preview")
  async preview(@Req() req: Request, @CurrentUser() user: AuthenticatedUser, @Body() dto: PreviewCouponDto) {
    const cart = await this.cartService.getCheckoutCart(req.cookies?.[CART_COOKIE], user.id);
    const { items, subtotal } = await this.couponsService.lineInputsFromCart(
      cart.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
    );
    try {
      const result = await this.couponsService.validate({ code: dto.code, userId: user.id, items, subtotal });
      return { valid: true, ...result };
    } catch (err) {
      if (err instanceof BadRequestException) {
        return { valid: false, message: err.message };
      }
      throw err;
    }
  }
}

@Controller("admin/coupons")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @Permissions("coupons:read")
  list(@Query() query: QueryCouponsDto) {
    return this.couponsService.list(query);
  }

  @Get(":id")
  @Permissions("coupons:read")
  findOne(@Param("id") id: string) {
    return this.couponsService.findOne(id);
  }

  @Post()
  @Permissions("coupons:write")
  @AuditLog("Coupon")
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Patch(":id")
  @Permissions("coupons:write")
  @AuditLog("Coupon")
  update(@Param("id") id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("coupons:write")
  @AuditLog("Coupon")
  remove(@Param("id") id: string) {
    return this.couponsService.remove(id);
  }
}
