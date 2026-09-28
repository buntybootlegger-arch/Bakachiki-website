import { IsOptional, IsString } from "class-validator";

export class QuoteShippingDto {
  @IsString()
  state!: string;

  @IsOptional()
  @IsString()
  country?: string;
}
