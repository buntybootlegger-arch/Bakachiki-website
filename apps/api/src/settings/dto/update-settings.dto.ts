import { IsObject, IsOptional, IsString } from "class-validator";

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsString()
  colorInk?: string;

  @IsOptional()
  @IsString()
  colorPaper?: string;

  @IsOptional()
  @IsString()
  colorAccentPrimary?: string;

  @IsOptional()
  @IsString()
  colorAccentSecondary?: string;

  @IsOptional()
  @IsString()
  defaultSeoTitle?: string;

  @IsOptional()
  @IsString()
  defaultSeoDescription?: string;

  @IsOptional()
  @IsString()
  defaultOgImageUrl?: string;

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;
}
