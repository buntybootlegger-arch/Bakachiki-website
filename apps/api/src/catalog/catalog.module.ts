import { Module } from "@nestjs/common";
import { CategoriesController, AdminCategoriesController } from "./categories/categories.controller";
import { CategoriesService } from "./categories/categories.service";
import { BrandsController, AdminBrandsController } from "./brands/brands.controller";
import { BrandsService } from "./brands/brands.service";
import { ProductsController, AdminProductsController } from "./products/products.controller";
import { ProductsService } from "./products/products.service";

@Module({
  controllers: [
    CategoriesController,
    AdminCategoriesController,
    BrandsController,
    AdminBrandsController,
    ProductsController,
    AdminProductsController,
  ],
  providers: [CategoriesService, BrandsService, ProductsService],
  exports: [ProductsService],
})
export class CatalogModule {}
