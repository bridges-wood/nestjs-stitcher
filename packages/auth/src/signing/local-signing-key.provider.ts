import { Injectable, Logger } from '@nestjs/common';
import { JwksClient } from 'jwks-rsa';
import { type GetSigningKeyFunction, SigningKeyProvider } from './signing-key.provider.js';

export interface JwksEndpointSource {
  getEndpoints(): Array<{ jwksUri?: string | null }>;
}

export const JWKS_ENDPOINT_SOURCE = Symbol('JWKS_ENDPOINT_SOURCE');

@Injectable()
export class LocalSigningKeyProvider extends SigningKeyProvider {
  private readonly logger = new Logger(LocalSigningKeyProvider.name);

  constructor(private readonly endpointSource: JwksEndpointSource) {
    super();
  }

  build(): GetSigningKeyFunction {
    return async (kid?: string) => {
      const jwksClients = this.endpointSource
        .getEndpoints()
        .filter(this.hasJwksUri)
        .map((e) => new JwksClient({ jwksUri: e.jwksUri }));

      this.logger.debug(`Built ${jwksClients.length} JwksClients`);

      const signingKey = await Promise.any(
        jwksClients.map((client) => client.getSigningKey(kid)),
      );
      return signingKey.getPublicKey();
    };
  }

  private hasJwksUri<T extends { jwksUri?: string | null }>(
    endpoint: T,
  ): endpoint is T & { jwksUri: string } {
    return !!endpoint.jwksUri;
  }
}
