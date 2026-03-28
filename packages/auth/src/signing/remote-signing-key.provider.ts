import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwksClient } from 'jwks-rsa';
import { AUTH_MODULE_OPTIONS, type AuthModuleOptions } from '../config/auth-config.interface.js';
import { type GetSigningKeyFunction, SigningKeyProvider } from './signing-key.provider.js';

@Injectable()
export class RemoteSigningKeyProvider extends SigningKeyProvider {
  private readonly logger = new Logger(RemoteSigningKeyProvider.name);

  constructor(
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly options: AuthModuleOptions,
  ) {
    super();
  }

  build(): GetSigningKeyFunction {
    return async (kid?: string) => {
      const endpoints = this.options.jwksEndpoints ?? [];
      const jwksClients = endpoints.map(
        (uri) => new JwksClient({ jwksUri: uri }),
      );

      this.logger.debug(`Built ${jwksClients.length} JwksClients`);

      try {
        const signingKey = await Promise.any(
          jwksClients.map((client) => client.getSigningKey(kid)),
        );
        return signingKey.getPublicKey();
      } catch (e) {
        this.logger.error(`Error getting signing key for kid: ${kid}`, e);
        throw new Error(`Signing key not found for kid: ${kid}`);
      }
    };
  }
}
