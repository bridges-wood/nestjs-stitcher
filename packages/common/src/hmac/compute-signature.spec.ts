import { describe, expect, it } from 'vitest';
import {
  computeHmacSignature,
  type GraphQLRequestParams,
  HMAC_SIGNATURE_EXTENSION,
  serializeParams,
} from '../index.js';

describe('HMAC Utilities', () => {
  const params: GraphQLRequestParams = {
    query: '{ testQuery }',
    variables: { testVar: 'testValue' },
    extensions: { [HMAC_SIGNATURE_EXTENSION]: 'testExtension' },
  };
  const key = 'testKey-that-is-at-least-32-chars!';

  describe('serializeParams', () => {
    it('should serialize GraphQLParams correctly', () => {
      const serialized = serializeParams(params);
      expect(serialized).toBe(
        '{"extensions":{},"query":"{ testQuery }","variables":{"testVar":"testValue"}}',
      );
    });
  });

  describe('computeHmacSignature', () => {
    it('should compute HMAC signature correctly', () => {
      const signature = computeHmacSignature(params, key);
      expect(signature).toBe('8NwSYO26E67bBoQl/9XSDJsbyOjr+dy7hDaHqmZFi+M=');
    });

    it('should return different signatures for different keys', () => {
      const signature1 = computeHmacSignature(params, key);
      const signature2 = computeHmacSignature(
        params,
        'differentKey-that-is-at-least-32!!',
      );
      expect(signature1).not.toBe(signature2);
    });

    it('should return different signatures for different params', () => {
      const differentParams = { ...params, query: '{ differentQuery }' };
      const signature1 = computeHmacSignature(params, key);
      const signature2 = computeHmacSignature(differentParams, key);
      expect(signature1).not.toBe(signature2);
    });
  });
});
