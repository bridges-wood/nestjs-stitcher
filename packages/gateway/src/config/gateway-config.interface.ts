import type { ExtensionVisitor } from '../extensions/extension-visitor.js';

export interface GatewayModuleOptions {
  /** Path to YAML endpoints config file */
  endpointsConfigPath?: string;
  /** HMAC secret for signing requests to subgraphs */
  hmacSecret?: string;
  /** Extension visitors for enriching outgoing requests */
  extensionVisitors?: ExtensionVisitor[];
  /** Auto-reload interval in ms. Default: 300000 (5 min). Set to 0 to disable. */
  autoReloadInterval?: number;
  /** Initial endpoints (alternative to config file) */
  endpoints?: Array<{
    name: string;
    hash: string;
    url: string;
    jwksUri?: string;
  }>;
}

export const GATEWAY_MODULE_OPTIONS = Symbol('GATEWAY_MODULE_OPTIONS');
