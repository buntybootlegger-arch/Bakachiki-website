import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards, UseInterceptors } from "@nestjs/common";
import { CollectionsService } from "./collections.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";
import { SetCollectionProductsDto } from "./dto/set-collection-products.dto";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuditLog } from "../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../common/interceptors/audit-log.interceptor";

@Controller("collections")
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  listPublic() {
    return this.collectionsService.listPublic();
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.collectionsService.findPublicBySlug(slug);
  }
}

@Controller("admin/collections")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminCollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @Permissions("collections:read")
  list() {
    return this.collectionsService.listAdmin();
  }

  @Get(":id")
  @Permissions("collections:read")
  findOne(@Param("id") id: string) {
    return this.collectionsService.findOne(id);
  }

  @Post()
  @Permissions("collections:write")
  @AuditLog("Collection")
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto);
  }

  @Patch(":id")
  @Permissions("collections:write")
  @AuditLog("Collection")
  update(@Param("id") id: string, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.update(id, dto);
  }

  @Put(":id/products")
  @Permissions("collections:write")
  @AuditLog("Collection")
  setProducts(@Param("id") id: string, @Body() dto: SetCollectionProductsDto) {
    return this.collectionsService.setProducts(id, dto.productIds);
  }

  @Delete(":id")
  @Permissions("collections:write")
  @AuditLog("Collection")
  remove(@Param("id") id: string) {
    return this.collectionsService.remove(id);
  }
}
