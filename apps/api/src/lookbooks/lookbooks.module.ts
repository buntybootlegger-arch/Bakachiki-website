import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { LookbooksController, AdminLookbooksController } from "./lookbooks.controller";
import { LookbooksService } from "./lookbooks.service";

@Module({
  imports: [CatalogModule],
  controllers: [LookbooksController, AdminLookbooksController],
  providers: [LookbooksService],
})
export class LookbooksModule {}
