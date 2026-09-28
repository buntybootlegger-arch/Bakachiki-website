import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards, UseInterceptors } from "@nestjs/common";
import { PagesService } from "./pages.service";
import { CreatePageDto } from "./dto/create-page.dto";
import { UpdatePageDto } from "./dto/update-page.dto";
import { CreatePageSectionDto } from "./dto/create-section.dto";
import { UpdatePageSectionDto } from "./dto/update-section.dto";
import { ReorderSectionsDto } from "./dto/reorder-sections.dto";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuditLog } from "../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../common/interceptors/audit-log.interceptor";

@Controller("pages")
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get(":slug")
  getBySlug(@Param("slug") slug: string) {
    return this.pagesService.getPublicBySlug(slug);
  }
}

@Controller("admin/pages")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminPagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  @Permissions("pages:read")
  list() {
    return this.pagesService.listAdminPages();
  }

  @Get(":id")
  @Permissions("pages:read")
  findOne(@Param("id") id: string) {
    return this.pagesService.findPage(id);
  }

  @Post()
  @Permissions("pages:write")
  @AuditLog("Page")
  create(@Body() dto: CreatePageDto) {
    return this.pagesService.createPage(dto);
  }

  @Patch(":id")
  @Permissions("pages:write")
  @AuditLog("Page")
  update(@Param("id") id: string, @Body() dto: UpdatePageDto) {
    return this.pagesService.updatePage(id, dto);
  }

  @Delete(":id")
  @Permissions("pages:write")
  @AuditLog("Page")
  remove(@Param("id") id: string) {
    return this.pagesService.removePage(id);
  }

  @Get(":pageId/sections")
  @Permissions("pages:read")
  listSections(@Param("pageId") pageId: string) {
    return this.pagesService.listSectionsAdmin(pageId);
  }

  @Post(":pageId/sections")
  @Permissions("pages:write")
  @AuditLog("PageSection")
  createSection(@Param("pageId") pageId: string, @Body() dto: CreatePageSectionDto) {
    return this.pagesService.createSection(pageId, dto);
  }

  @Patch(":pageId/sections/:id")
  @Permissions("pages:write")
  @AuditLog("PageSection")
  updateSection(
    @Param("pageId") pageId: string,
    @Param("id") id: string,
    @Body() dto: UpdatePageSectionDto,
  ) {
    return this.pagesService.updateSection(pageId, id, dto);
  }

  @Put(":pageId/sections/reorder")
  @Permissions("pages:write")
  @AuditLog("PageSection")
  reorderSections(@Param("pageId") pageId: string, @Body() dto: ReorderSectionsDto) {
    return this.pagesService.reorderSections(pageId, dto.items);
  }

  @Delete(":pageId/sections/:id")
  @Permissions("pages:write")
  @AuditLog("PageSection")
  removeSection(@Param("pageId") pageId: string, @Param("id") id: string) {
    return this.pagesService.removeSection(pageId, id);
  }
}
