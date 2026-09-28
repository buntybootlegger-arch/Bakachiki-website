import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard("jwt-admin") {
  handleRequest<TUser = any>(
    err: unknown,
    admin: unknown,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !admin) {
      throw err instanceof Error ? err : new UnauthorizedException();
    }
    const request = context.switchToHttp().getRequest();
    request.admin = admin;
    return admin as TUser;
  }
}
