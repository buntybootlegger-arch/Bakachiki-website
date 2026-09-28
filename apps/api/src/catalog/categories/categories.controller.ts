import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards, UseInterceptors } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { ReorderCategoriesDto } from "./dto/reorder-categories.dto";
import { AdminJwtAuthGuard } from "../../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../../common/interceptors/audit-log.interceptor";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  listPublic() {
    return this.categoriesService.listPublic();
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
}

@Controller("admin/categories")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Permissions("categories:read")
  list() {
    return this.categoriesService.listAdmin();
  }

  @Get(":id")
  @Permissions("categories:read")
  findOne(@Param("id") id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Permissions("categories:write")
  @AuditLog("Category")
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(":id")
  @Permissions("categories:write")
  @AuditLog("Category")
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Put("reorder")
  @Permissions("categories:write")
  @AuditLog("Category")
  reorder(@Body() dto: ReorderCategoriesDto) {
    return this.categoriesService.reorder(dto.items);
  }

  @Delete(":id")
  @Permissions("categories:write")
  @AuditLog("Category")
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
