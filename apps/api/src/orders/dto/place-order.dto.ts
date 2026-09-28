import { IsIn, IsOptional, IsString } from "class-validator";

export class PlaceOrderDto {
  @IsString()
  shippingAddressId!: string;

  /** Defaults to the shipping address when omitted. */
  @IsOptional()
  @IsString()
  billingAddressId?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsIn(["PAYU", "COD"])
  paymentGateway!: "PAYU" | "COD";

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
