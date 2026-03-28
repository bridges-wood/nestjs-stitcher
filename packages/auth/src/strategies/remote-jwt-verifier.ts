import { Inject, Injectable, Logger } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { AUTH_MODULE_OPTIONS, type AuthModuleOptions } from '../config/auth-config.interface.js';
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
    this.jwksSets = endpoints.map((url) =>
      createRemoteJWKSet(new URL(url)),
    );
    this.logger.log(`Configured ${this.jwksSets.length} remote JWKS endpoint(s)`);
  }

  async verify(token: string): Promise<JWTPayload & { roles?: string[] }> {
    const errors: Error[] = [];

    for (const jwks of this.jwksSets) {
      try {
        const { payload } = await jwtVerify(token, jwks, {
          issuer: this.options.jwt?.issuer,
          audience: this.options.jwt?.audience,
          algorithms: this.options.jwt?.algorithms,
        });
        return payload as JWTPayload & { roles?: string[] };
      } catch (error) {
        errors.push(error as Error);
      }
    }

    throw new AggregateError(errors, 'JWT verification failed against all JWKS endpoints');
  }
}
