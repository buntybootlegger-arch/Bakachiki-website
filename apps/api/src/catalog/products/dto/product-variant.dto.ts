import { IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class ProductVariantInputDto {
  @IsString()
  sku!: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
