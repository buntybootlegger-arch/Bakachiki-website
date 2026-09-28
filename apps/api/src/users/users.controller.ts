import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpsertAddressDto } from "./dto/upsert-address.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";

@Controller("users/me")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("addresses")
  listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listAddresses(user.id);
  }

  @Post("addresses")
  createAddress(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertAddressDto) {
    return this.usersService.createAddress(user.id, dto);
  }

  @Put("addresses/:id")
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpsertAddressDto,
  ) {
    return this.usersService.updateAddress(user.id, id, dto);
  }

  @Delete("addresses/:id")
  removeAddress(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.usersService.removeAddress(user.id, id);
  }
}
