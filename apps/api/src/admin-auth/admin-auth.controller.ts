import {
  Controller,
  Body,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AdminAuthService } from "./admin-auth.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { CurrentAdmin, type AuthenticatedAdmin } from "../common/decorators/current-admin.decorator";
import { PrismaService } from "../prisma/prisma.service";

const REFRESH_COOKIE = "admin_refresh_token";

@Controller("admin-auth")
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly prisma: PrismaService,
  ) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/admin-auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, roleName } = await this.adminAuthService.login(dto);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, roleName };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedException("Missing refresh token");
    }
    const { accessToken, refreshToken, roleName } = await this.adminAuthService.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, roleName };
  }

  @Post("logout")
  @UseGuards(AdminJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.adminAuthService.logout(admin.id);
    res.clearCookie(REFRESH_COOKIE, { path: "/api/admin-auth" });
    return { success: true };
  }

  @Get("me")
  @UseGuards(AdminJwtAuthGuard)
  async me(@CurrentAdmin() admin: AuthenticatedAdmin) {
    const record = await this.prisma.admin.findUnique({
      where: { id: admin.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: { select: { id: true, name: true } },
      },
    });
    return record;
  }
}
