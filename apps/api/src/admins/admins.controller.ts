import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards, UseInterceptors } from "@nestjs/common";
import { AdminsService } from "./admins.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { ResetAdminPasswordDto } from "./dto/reset-password.dto";
import { SetPermissionsDto } from "./dto/set-permissions.dto";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuditLog } from "../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../common/interceptors/audit-log.interceptor";

@Controller("admins")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  @Permissions("admins:read")
  list() {
    return this.adminsService.list();
  }

  @Get(":id")
  @Permissions("admins:read")
  findOne(@Param("id") id: string) {
    return this.adminsService.findOne(id);
  }

  @Post()
  @Permissions("admins:write")
  @AuditLog("Admin")
  create(@Body() dto: CreateAdminDto) {
    return this.adminsService.create(dto);
  }

  @Patch(":id")
  @Permissions("admins:write")
  @AuditLog("Admin")
  update(@Param("id") id: string, @Body() dto: UpdateAdminDto) {
    return this.adminsService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("admins:write")
  @AuditLog("Admin")
  remove(@Param("id") id: string) {
    return this.adminsService.remove(id);
  }

  @Post(":id/reset-password")
  @Permissions("admins:write")
  @AuditLog("Admin")
  resetPassword(@Param("id") id: string, @Body() dto: ResetAdminPasswordDto) {
    return this.adminsService.resetPassword(id, dto.newPassword);
  }

  @Put(":id/permissions")
  @Permissions("admins:write")
  @AuditLog("Admin")
  setPermissions(@Param("id") id: string, @Body() dto: SetPermissionsDto) {
    return this.adminsService.setPermissions(id, dto);
  }
}
