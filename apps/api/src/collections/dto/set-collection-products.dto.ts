import { ArrayMaxSize, IsArray, IsString } from "class-validator";

export class SetCollectionProductsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  productIds!: string[];
}
