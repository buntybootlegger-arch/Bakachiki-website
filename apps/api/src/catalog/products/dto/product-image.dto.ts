import { IsInt, IsOptional, IsString } from "class-validator";

export class ProductImageInputDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  position?: number;
}
