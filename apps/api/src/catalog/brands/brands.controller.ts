import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors } from "@nestjs/common";
import { BrandsService } from "./brands.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";
import { AdminJwtAuthGuard } from "../../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../../common/interceptors/audit-log.interceptor";

@Controller("brands")
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  listPublic() {
    return this.brandsService.listPublic();
  }
}

@Controller("admin/brands")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminBrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @Permissions("brands:read")
  list() {
    return this.brandsService.listAdmin();
  }

  @Get(":id")
  @Permissions("brands:read")
  findOne(@Param("id") id: string) {
    return this.brandsService.findOne(id);
  }

  @Post()
  @Permissions("brands:write")
  @AuditLog("Brand")
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Patch(":id")
  @Permissions("brands:write")
  @AuditLog("Brand")
  update(@Param("id") id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("brands:write")
  @AuditLog("Brand")
  remove(@Param("id") id: string) {
    return this.brandsService.remove(id);
  }
}
