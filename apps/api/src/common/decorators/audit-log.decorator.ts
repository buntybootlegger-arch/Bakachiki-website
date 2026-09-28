import { SetMetadata } from "@nestjs/common";

export const AUDIT_LOG_ENTITY_KEY = "auditLogEntity";

/** Marks a mutating admin endpoint for automatic audit logging. */
export const AuditLog = (entity: string) => SetMetadata(AUDIT_LOG_ENTITY_KEY, entity);
