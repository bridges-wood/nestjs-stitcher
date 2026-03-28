import { Inject, Injectable, Logger } from '@nestjs/common';
import { createRemoteJWKSet, type JWTPayload, jwtVerify } from 'jose';
import {
  AUTH_MODULE_OPTIONS,
  type AuthModuleOptions,
} from '../config/auth-config.interface.js';
import { JwtVerifier } from './jwt-verifier.js';

@Injectable()
export class RemoteJwtVerifier extends JwtVerifier {
  private readonly logger = new Logger(RemoteJwtVerifier.name);
  private readonly jwksSets: ReturnType<typeof createRemoteJWKSet>[];

  constructor(
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly options: AuthModuleOptions,
  ) {
    super();
    const endpoints = options.jwksEndpoints ?? [];
    this.jwksSets = endpoints.map((url) => createRemoteJWKSet(new URL(url)));
    this.logger.log(
      `Configured ${this.jwksSets.length} remote JWKS endpoint(s)`,
    );

    if (!this.options.jwt?.issuer) {
      this.logger.warn(
        'JWT issuer validation is disabled — configure jwt.issuer for production use',
      );
    }
    if (!this.options.jwt?.audience) {
      this.logger.warn(
        'JWT audience validation is disabled — configure jwt.audience for production use',
      );
    }
  }

  async verify(token: string): Promise<JWTPayload & { roles?: string[] }> {
    const errors: Error[] = [];

    for (const jwks of this.jwksSets) {
      try {
        const algorithms = this.options.jwt?.algorithms?.length
          ? this.options.jwt.algorithms
          : ['RS256'];
        const { payload } = await jwtVerify(token, jwks, {
          issuer: this.options.jwt?.issuer,
          audience: this.options.jwt?.audience,
          algorithms,
        });
        return payload as JWTPayload & { roles?: string[] };
      } catch (error) {
        errors.push(error as Error);
      }
    }

    throw new AggregateError(
      errors,
      'JWT verification failed against all JWKS endpoints',
    );
  }
}
