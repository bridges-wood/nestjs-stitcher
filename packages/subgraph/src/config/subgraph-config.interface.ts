import type { SchemaTransformer } from '../federation/prepare-schema.js';

export interface SubgraphModuleOptions {
  /** HMAC secret for validating gateway requests */
  hmacSecret?: string;
  /** Additional schema transformers to apply during federation preparation */
  schemaTransformers?: SchemaTransformer[];
  /** Bootstrap options */
  bootstrap?: {
    port?: number;
    portRange?: [number, number];
    https?: boolean;
  };
}

export const SUBGRAPH_MODULE_OPTIONS = Symbol('SUBGRAPH_MODULE_OPTIONS');
