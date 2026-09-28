import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionsGuard } from "./permissions.guard";
import { PrismaService } from "../../prisma/prisma.service";

function makeContext(admin: unknown) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ admin }) }),
  } as unknown as ExecutionContext;
}

describe("PermissionsGuard", () => {
  let reflector: Reflector;
  let prisma: Pick<PrismaService, "rolePermission" | "adminPermission">;
  let guard: PermissionsGuard;

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      rolePermission: { findMany: jest.fn() } as any,
      adminPermission: { findMany: jest.fn() } as any,
    };
    guard = new PermissionsGuard(reflector, prisma as PrismaService);
  });

  it("allows the request when the route requires no permissions", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    await expect(guard.canActivate(makeContext(null))).resolves.toBe(true);
  });

  it("throws ForbiddenException when no admin is attached to the request", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["products:write"]);
    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(ForbiddenException);
  });

  it("allows a role permission the admin holds", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["products:write"]);
    (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue([
      { permission: { resource: "products", action: "write" } },
    ]);
    (prisma.adminPermission.findMany as jest.Mock).mockResolvedValue([]);

    const admin = { id: "admin-1", roleId: "role-1" };
    await expect(guard.canActivate(makeContext(admin))).resolves.toBe(true);
  });

  it("rejects when the role lacks the permission and there is no override", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["products:write"]);
    (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.adminPermission.findMany as jest.Mock).mockResolvedValue([]);

    const admin = { id: "admin-1", roleId: "role-seo" };
    await expect(guard.canActivate(makeContext(admin))).rejects.toThrow(ForbiddenException);
  });

  it("a per-admin GRANT override adds a permission missing from the role", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["products:write"]);
    (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.adminPermission.findMany as jest.Mock).mockResolvedValue([
      { effect: "GRANT", permission: { resource: "products", action: "write" } },
    ]);

    const admin = { id: "admin-1", roleId: "role-seo" };
    await expect(guard.canActivate(makeContext(admin))).resolves.toBe(true);
  });

  it("a per-admin REVOKE override removes a permission the role would otherwise grant", async () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["products:write"]);
    (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue([
      { permission: { resource: "products", action: "write" } },
    ]);
    (prisma.adminPermission.findMany as jest.Mock).mockResolvedValue([
      { effect: "REVOKE", permission: { resource: "products", action: "write" } },
    ]);

    const admin = { id: "admin-1", roleId: "role-product" };
    await expect(guard.canActivate(makeContext(admin))).rejects.toThrow(ForbiddenException);
  });
});
