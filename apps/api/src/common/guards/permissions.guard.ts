import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Permission } from "@bakachiki/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import type { AuthenticatedAdmin } from "../decorators/current-admin.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const admin: AuthenticatedAdmin | undefined = request.admin;
    if (!admin) {
      throw new ForbiddenException("Admin authentication required");
    }

    const effective = await this.getEffectivePermissions(admin.id, admin.roleId);
    const missing = required.filter((perm) => !effective.has(perm));
    if (missing.length > 0) {
      throw new ForbiddenException(`Missing permission(s): ${missing.join(", ")}`);
    }
    return true;
  }

  private async getEffectivePermissions(adminId: string, roleId: string): Promise<Set<string>> {
    const [rolePermissions, overrides] = await Promise.all([
      this.prisma.rolePermission.findMany({
        where: { roleId },
        include: { permission: true },
      }),
      this.prisma.adminPermission.findMany({
        where: { adminId },
        include: { permission: true },
      }),
    ]);

    const effective = new Set<string>(
      rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`),
    );

    for (const override of overrides) {
      const key = `${override.permission.resource}:${override.permission.action}`;
      if (override.effect === "GRANT") {
        effective.add(key);
      } else {
        effective.delete(key);
      }
    }

    return effective;
  }
}
