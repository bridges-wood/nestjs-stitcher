import assert from 'node:assert';
import jsonStableStringify from 'json-stable-stringify';
import { HMAC_SIGNATURE_EXTENSION } from './constants.js';

export interface GraphQLRequestParams {
  query?: string | null;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
  extensions?: Record<string, unknown> | null;
}

export function serializeParams(params: GraphQLRequestParams): string {
  const stringified = jsonStableStringify({
    query: params.query,
    variables: params.variables,
    extensions: {
      ...params.extensions,
      [HMAC_SIGNATURE_EXTENSION]: undefined,
    },
  });
  assert(typeof stringified === 'string', 'Params could not be stringified');
  return stringified;
}
