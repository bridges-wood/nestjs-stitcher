import { createHmac } from 'node:crypto';
import type { GraphQLRequestParams } from './serialize-params.js';
import { serializeParams } from './serialize-params.js';

export function computeHmacSignature(
  params: GraphQLRequestParams,
  key: string,
): string {
  if (!key || key.length < 32) {
    throw new Error('HMAC key must be at least 32 characters');
  }
  return createHmac('sha256', key)
    .update(serializeParams(params))
    .digest('base64');
}
