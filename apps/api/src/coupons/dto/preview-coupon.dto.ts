import { IsString } from "class-validator";

export class PreviewCouponDto {
  @IsString()
  code!: string;
}
