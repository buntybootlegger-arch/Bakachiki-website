import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";

export interface AdminJwtPayload {
  sub: string;
  email: string;
  type: "admin";
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, "jwt-admin") {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("ADMIN_JWT_ACCESS_SECRET"),
    });
  }

  async validate(payload: AdminJwtPayload) {
    if (payload.type !== "admin") {
      throw new UnauthorizedException();
    }
    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException("Account is inactive");
    }
    return {
      id: admin.id,
      email: admin.email,
      roleId: admin.roleId,
      roleName: admin.role.name,
    };
  }
}
