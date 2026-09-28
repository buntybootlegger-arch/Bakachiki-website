import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateShippingZoneDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  countries?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  states?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
