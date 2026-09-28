import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";

export const CART_COOKIE = "cart_token";

@Controller("cart")
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private setCartCookie(res: Response, token: string) {
    res.cookie(CART_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60 * 1000,
    });
  }

  @Get()
  async getCart(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as AuthenticatedUser | null;
    const cart = await this.cartService.getOrCreateCart(req.cookies?.[CART_COOKIE], user?.id ?? null);
    this.setCartCookie(res, cart.token);
    return cart;
  }

  @Post("items")
  async addItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: AddCartItemDto,
  ) {
    const user = req.user as AuthenticatedUser | null;
    const cart = await this.cartService.addItem(req.cookies?.[CART_COOKIE], user?.id ?? null, dto);
    this.setCartCookie(res, cart.token);
    return cart;
  }

  @Patch("items/:itemId")
  async updateItem(
    @Req() req: Request,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const token = req.cookies?.[CART_COOKIE];
    return this.cartService.updateItem(token, itemId, dto);
  }

  @Delete("items/:itemId")
  async removeItem(@Req() req: Request, @Param("itemId") itemId: string) {
    const token = req.cookies?.[CART_COOKIE];
    return this.cartService.removeItem(token, itemId);
  }

  @Post("merge")
  @UseGuards(JwtAuthGuard)
  async merge(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const cart = await this.cartService.mergeGuestIntoUser(req.cookies?.[CART_COOKIE], user.id);
    this.setCartCookie(res, cart.token);
    return cart;
  }
}
