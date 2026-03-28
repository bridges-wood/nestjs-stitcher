import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { StitcherUser } from '@nestjs-stitcher/common';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { AUTH_MODULE_OPTIONS, type AuthModuleOptions } from '../config/auth-config.interface.js';
import { JwtVerifier } from '../strategies/jwt-verifier.js';

@Injectable()
export class StitcherAuthGuard implements CanActivate {
  private readonly logger = new Logger(StitcherAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly options: AuthModuleOptions,
    private readonly jwtVerifier: JwtVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (this.options.bypassAuth) {
      this.logger.warn('⚠️ Bypassing authentication');
      const ctx = GqlExecutionContext.create(context);
      ctx.getContext().req.user = {
        id: '00000000-0000-0000-0000-000000000000',
        roles: ['admin'],
      } satisfies StitcherUser;
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    // Check for trusted request from gateway (HMAC-signed)
    const body = req.body;
    if (body?.extensions?.trusted === true) {
      req.user = {
        id: body.extensions.sub,
        roles: body.extensions.roles,
      } satisfies StitcherUser;
      return true;
    }

    // Extract and validate JWT
    const authHeader = req.headers?.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    try {
      const payload = await this.jwtVerifier.verify(token);
      req.user = {
        id: payload.sub ?? '',
        roles: (payload.roles as string[]) ?? [],
      } satisfies StitcherUser;
      return true;
    } catch (error) {
      this.logger.error(`JWT verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
