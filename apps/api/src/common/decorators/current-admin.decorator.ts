import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedAdmin => {
    const request = ctx.switchToHttp().getRequest();
    return request.admin;
  },
);
