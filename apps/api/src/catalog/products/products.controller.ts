import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { QueryProductsDto } from "./dto/query-products.dto";
import { AdminJwtAuthGuard } from "../../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../../common/interceptors/audit-log.interceptor";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: QueryProductsDto) {
    return this.productsService.listPublic(query);
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.productsService.findBySlug(slug);
  }
}

@Controller("admin/products")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Permissions("products:read")
  list(@Query() query: QueryProductsDto) {
    return this.productsService.listAdmin(query);
  }

  @Get(":id")
  @Permissions("products:read")
  findOne(@Param("id") id: string) {
    return this.productsService.findOneAdmin(id);
  }

  @Post()
  @Permissions("products:write")
  @AuditLog("Product")
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(":id")
  @Permissions("products:write")
  @AuditLog("Product")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("products:write")
  @AuditLog("Product")
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
