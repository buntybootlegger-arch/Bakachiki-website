import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { CollectionsController, AdminCollectionsController } from "./collections.controller";
import { CollectionsService } from "./collections.service";

@Module({
  imports: [CatalogModule],
  controllers: [CollectionsController, AdminCollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
