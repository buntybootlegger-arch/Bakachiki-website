import { Body, Controller, Get, Patch, UseGuards, UseInterceptors } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuditLog } from "../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../common/interceptors/audit-log.interceptor";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("public")
  getPublic() {
    return this.settingsService.get();
  }
}

@Controller("admin/settings")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Permissions("settings:read")
  get() {
    return this.settingsService.get();
  }

  @Patch()
  @Permissions("settings:write")
  @AuditLog("SiteSettings")
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
