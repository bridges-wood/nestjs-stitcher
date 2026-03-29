import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { StitcherUser } from '@nestjs-stitcher/common';
import { Roles } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());
    if (!requiredRoles) return true;

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user: StitcherUser = request.user;

    return this.matchRoles(requiredRoles, user);
  }

  protected matchRoles(
    roles: string[],
    user: Pick<StitcherUser, 'roles'>,
  ): boolean {
    this.logger.debug(
      `Permitted roles: [${roles}], User roles: [${user.roles}]`,
    );
    return user.roles.some((role) => roles.includes(role));
  }
}
