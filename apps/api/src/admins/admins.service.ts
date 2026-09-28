import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { SetPermissionsDto } from "./dto/set-permissions.dto";

const ADMIN_SAFE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} as const;

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.admin.findMany({
      select: ADMIN_SAFE_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
      select: {
        ...ADMIN_SAFE_SELECT,
        permissionOverrides: { include: { permission: true } },
      },
    });
    if (!admin) throw new NotFoundException("Admin not found");
    return admin;
  }

  async create(dto: CreateAdminDto) {
    const existing = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("An admin with this email already exists");
    }
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) {
      throw new BadRequestException("Invalid roleId");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.admin.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: dto.roleId,
      },
      select: ADMIN_SAFE_SELECT,
    });
  }

  async update(id: string, dto: UpdateAdminDto) {
    await this.findOne(id);
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      if (!role) throw new BadRequestException("Invalid roleId");
    }
    return this.prisma.admin.update({
      where: { id },
      data: dto,
      select: ADMIN_SAFE_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.admin.delete({ where: { id } });
    return { success: true };
  }

  async resetPassword(id: string, newPassword: string) {
    await this.findOne(id);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.admin.update({
      where: { id },
      data: { passwordHash, refreshTokenHash: null },
    });
    return { success: true };
  }

  async setPermissions(id: string, dto: SetPermissionsDto) {
    await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.adminPermission.deleteMany({ where: { adminId: id } }),
      ...dto.overrides.map((o) =>
        this.prisma.adminPermission.create({
          data: { adminId: id, permissionId: o.permissionId, effect: o.effect },
        }),
      ),
    ]);
    return this.findOne(id);
  }
}
