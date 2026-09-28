import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

const LOOKBOOK_MEDIA_TYPES = ["IMAGE", "VIDEO"] as const;

class LookbookSlideInputDto {
  @IsString()
  mediaUrl!: string;

  @IsIn(LOOKBOOK_MEDIA_TYPES)
  mediaType!: (typeof LOOKBOOK_MEDIA_TYPES)[number];

  @IsOptional()
  @IsString()
  caption?: string;

  @IsInt()
  position!: number;

  @IsArray()
  @IsString({ each: true })
  productIds!: string[];
}

export class SetLookbookSlidesDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => LookbookSlideInputDto)
  slides!: LookbookSlideInputDto[];
}
