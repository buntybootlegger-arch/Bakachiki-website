import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors } from "@nestjs/common";
import { CampaignsService } from "./campaigns.service";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { UpdateCampaignDto } from "./dto/update-campaign.dto";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuditLog } from "../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../common/interceptors/audit-log.interceptor";

@Controller("campaigns")
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.campaignsService.findPublicBySlug(slug);
  }
}

@Controller("admin/campaigns")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminCampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @Permissions("campaigns:read")
  list() {
    return this.campaignsService.listAdmin();
  }

  @Get(":id")
  @Permissions("campaigns:read")
  findOne(@Param("id") id: string) {
    return this.campaignsService.findOne(id);
  }

  @Post()
  @Permissions("campaigns:write")
  @AuditLog("Campaign")
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Patch(":id")
  @Permissions("campaigns:write")
  @AuditLog("Campaign")
  update(@Param("id") id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("campaigns:write")
  @AuditLog("Campaign")
  remove(@Param("id") id: string) {
    return this.campaignsService.remove(id);
  }
}
