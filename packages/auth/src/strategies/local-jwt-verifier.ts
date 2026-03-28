import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  type CryptoKey,
  importPKCS8,
  importSPKI,
  type JWTPayload,
  jwtVerify,
} from 'jose';
import {
  AUTH_MODULE_OPTIONS,
  type AuthModuleOptions,
} from '../config/auth-config.interface.js';
import { JwtVerifier } from './jwt-verifier.js';

@Injectable()
export class LocalJwtVerifier extends JwtVerifier {
  private readonly logger = new Logger(LocalJwtVerifier.name);
  private keyPromise: Promise<CryptoKey | Uint8Array>;

  constructor(
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly options: AuthModuleOptions,
  ) {
    super();
    this.keyPromise = this.resolveKey();
    this.logger.log('Configured local JWT verification');

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
    const key = await this.keyPromise;
    const algorithms = this.options.jwt?.algorithms?.length
      ? this.options.jwt.algorithms
      : ['RS256'];
    const { payload } = await jwtVerify(token, key, {
      issuer: this.options.jwt?.issuer,
      audience: this.options.jwt?.audience,
      algorithms,
    });
    return payload as JWTPayload & { roles?: string[] };
  }

  private async resolveKey(): Promise<CryptoKey | Uint8Array> {
    const signingKey = this.options.signingKey;
    if (!signingKey) {
      throw new Error('signingKey is required for local auth strategy');
    }

    const algorithm = this.options.jwt?.algorithms?.[0] ?? 'RS256';

    if (signingKey.includes('-----BEGIN PUBLIC KEY-----')) {
      return importSPKI(signingKey, algorithm);
    }
    if (signingKey.includes('-----BEGIN PRIVATE KEY-----')) {
      return importPKCS8(signingKey, algorithm);
    }
    // Treat as symmetric secret
    return new TextEncoder().encode(signingKey);
  }
}
