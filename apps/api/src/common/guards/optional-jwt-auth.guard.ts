import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** Attaches request.user when a valid customer JWT is present; never rejects the request. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt-user") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest<TUser = any>(_err: unknown, user: unknown): TUser {
    return (user ?? null) as TUser;
  }
}
