import { IsBoolean, IsIn, IsInt, IsObject, IsOptional } from "class-validator";
import { PAGE_SECTION_TYPES, type PageSectionType } from "@bakachiki/shared";

export class CreatePageSectionDto {
  @IsIn(PAGE_SECTION_TYPES)
  type!: PageSectionType;

  @IsObject()
  config!: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
