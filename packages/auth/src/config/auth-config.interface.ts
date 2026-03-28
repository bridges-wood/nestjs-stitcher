export interface AuthModuleOptions {
  strategy: 'remote' | 'local';
  /** JWKS endpoints for remote strategy */
  jwksEndpoints?: string[];
  /** Local signing key (PEM or secret) for local strategy */
  signingKey?: string;
  /** JWT validation options */
  jwt?: {
    issuer?: string;
    audience?: string;
    algorithms?: string[];
  };
  /** Bypass auth in development (NO_AUTH=true) */
  bypassAuth?: boolean;
}

export const AUTH_MODULE_OPTIONS = Symbol('AUTH_MODULE_OPTIONS');
