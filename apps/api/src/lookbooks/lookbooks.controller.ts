import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards, UseInterceptors } from "@nestjs/common";
import { LookbooksService } from "./lookbooks.service";
import { CreateLookbookDto } from "./dto/create-lookbook.dto";
import { UpdateLookbookDto } from "./dto/update-lookbook.dto";
import { SetLookbookSlidesDto } from "./dto/set-lookbook-slides.dto";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuditLog } from "../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../common/interceptors/audit-log.interceptor";

@Controller("lookbooks")
export class LookbooksController {
  constructor(private readonly lookbooksService: LookbooksService) {}

  @Get()
  listPublic() {
    return this.lookbooksService.listPublic();
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.lookbooksService.findPublicBySlug(slug);
  }
}

@Controller("admin/lookbooks")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminLookbooksController {
  constructor(private readonly lookbooksService: LookbooksService) {}

  @Get()
  @Permissions("lookbooks:read")
  list() {
    return this.lookbooksService.listAdmin();
  }

  @Get(":id")
  @Permissions("lookbooks:read")
  findOne(@Param("id") id: string) {
    return this.lookbooksService.findOne(id);
  }

  @Post()
  @Permissions("lookbooks:write")
  @AuditLog("Lookbook")
  create(@Body() dto: CreateLookbookDto) {
    return this.lookbooksService.create(dto);
  }

  @Patch(":id")
  @Permissions("lookbooks:write")
  @AuditLog("Lookbook")
  update(@Param("id") id: string, @Body() dto: UpdateLookbookDto) {
    return this.lookbooksService.update(id, dto);
  }

  @Put(":id/slides")
  @Permissions("lookbooks:write")
  @AuditLog("Lookbook")
  setSlides(@Param("id") id: string, @Body() dto: SetLookbookSlidesDto) {
    return this.lookbooksService.setSlides(id, dto);
  }

  @Delete(":id")
  @Permissions("lookbooks:write")
  @AuditLog("Lookbook")
  remove(@Param("id") id: string) {
    return this.lookbooksService.remove(id);
  }
}
