import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsInt, IsString, ValidateNested } from "class-validator";

class ReorderItemDto {
  @IsString()
  id!: string;

  @IsInt()
  position!: number;
}

export class ReorderCategoriesDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
