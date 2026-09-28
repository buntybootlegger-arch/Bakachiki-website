import { SetMetadata } from "@nestjs/common";
import type { Permission } from "@bakachiki/shared";

export const PERMISSIONS_KEY = "permissions";

/** Require the authenticated admin to hold ALL listed permissions. */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
