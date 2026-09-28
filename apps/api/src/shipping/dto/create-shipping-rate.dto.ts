import { IsBoolean, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateShippingRateDto {
  @IsString()
  zoneId!: string;

  @IsString()
  label!: string;

  @IsNumber()
  @Min(0)
  baseRate!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  perKgRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number;

  @IsOptional()
  @IsBoolean()
  codAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
