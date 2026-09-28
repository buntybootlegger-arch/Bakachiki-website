import { Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";

@Controller("wishlist")
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.wishlistService.list(user.id);
  }

  @Post(":productId")
  add(@CurrentUser() user: AuthenticatedUser, @Param("productId") productId: string) {
    return this.wishlistService.add(user.id, productId);
  }

  @Delete(":productId")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("productId") productId: string) {
    return this.wishlistService.remove(user.id, productId);
  }
}
