import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import { PrismaService } from "../../prisma/prisma.service";
import { AUDIT_LOG_ENTITY_KEY } from "../decorators/audit-log.decorator";
import type { AuthenticatedAdmin } from "../decorators/current-admin.decorator";

/**
 * Records admin mutations for later review. Phase 1: captures the resulting
 * response as `newValue` only — before/after diffing (`oldValue`) and an
 * admin UI to browse these logs are later-phase additions (see ROADMAP.md).
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const entity = this.reflector.getAllAndOverride<string | undefined>(AUDIT_LOG_ENTITY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!entity) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const admin: AuthenticatedAdmin | undefined = request.admin;
    const action = request.method as string;
    const paramId: string | undefined = request.params?.id;
    const ipAddress: string | undefined = request.ip;

    return next.handle().pipe(
      tap((responseBody) => {
        const entityId = paramId ?? (responseBody as { id?: string })?.id ?? null;
        this.prisma.auditLog
          .create({
            data: {
              adminId: admin?.id,
              action,
              entity,
              entityId,
              newValue: action === "DELETE" ? undefined : (responseBody as object) ?? undefined,
              ipAddress,
            },
          })
          .catch((err) => this.logger.error("Failed to write audit log", err));
      }),
    );
  }
}
