import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsEnum, IsString, ValidateNested } from "class-validator";
import { AdminPermissionEffect } from "@prisma/client";

class PermissionOverrideDto {
  @IsString()
  permissionId!: string;

  @IsEnum(AdminPermissionEffect)
  effect!: AdminPermissionEffect;
}

export class SetPermissionsDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PermissionOverrideDto)
  overrides!: PermissionOverrideDto[];
}
