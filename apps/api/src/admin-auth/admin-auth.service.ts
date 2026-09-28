import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AdminLoginDto } from "./dto/admin-login.dto";

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issueTokens(admin.id, admin.email, admin.role.name);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; type: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.getOrThrow<string>("ADMIN_JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (payload.type !== "admin") {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!admin || !admin.isActive || !admin.refreshTokenHash) {
      throw new UnauthorizedException("Session expired");
    }
    const matches = await bcrypt.compare(refreshToken, admin.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException("Session expired");
    }

    return this.issueTokens(admin.id, admin.email, admin.role.name);
  }

  async logout(adminId: string) {
    await this.prisma.admin.update({
      where: { id: adminId },
      data: { refreshTokenHash: null },
    });
  }

  private async issueTokens(adminId: string, email: string, roleName: string) {
    const accessToken = this.jwt.sign(
      { sub: adminId, email, type: "admin" },
      {
        secret: this.config.getOrThrow<string>("ADMIN_JWT_ACCESS_SECRET"),
        expiresIn: this.config.get<string>("ADMIN_JWT_ACCESS_EXPIRES_IN") ?? "15m",
      },
    );
    const refreshToken = this.jwt.sign(
      { sub: adminId, email, type: "admin" },
      {
        secret: this.config.getOrThrow<string>("ADMIN_JWT_REFRESH_SECRET"),
        expiresIn: this.config.get<string>("ADMIN_JWT_REFRESH_EXPIRES_IN") ?? "7d",
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.admin.update({
      where: { id: adminId },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken, roleName };
  }
}
