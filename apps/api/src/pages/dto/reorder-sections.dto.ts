import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsInt, IsString, ValidateNested } from "class-validator";

class ReorderItemDto {
  @IsString()
  id!: string;

  @IsInt()
  order!: number;
}

export class ReorderSectionsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
