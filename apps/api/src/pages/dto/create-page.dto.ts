import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreatePageDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  ogImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
