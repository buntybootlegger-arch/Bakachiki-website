import { Controller, Get, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { Permissions } from "../common/decorators/permissions.decorator";

@Controller()
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("roles")
  @Permissions("roles:read")
  async listRoles() {
    return this.prisma.role.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });
  }

  @Get("permissions")
  @Permissions("roles:read")
  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
  }
}
