import { describe, it, expect } from 'vitest';
import {
  computeHmacSignature,
  serializeParams,
  HMAC_SIGNATURE_EXTENSION,
  type GraphQLRequestParams,
} from '../index.js';

describe('HMAC Utilities', () => {
  const params: GraphQLRequestParams = {
    query: '{ testQuery }',
    variables: { testVar: 'testValue' },
    extensions: { [HMAC_SIGNATURE_EXTENSION]: 'testExtension' },
  };
  const key = 'testKey';

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
      expect(signature).toBe('BQzTVZfjGR/nbzqRFRqy/oOFKbYshmCQfoxXPiHkDG0=');
    });

    it('should return different signatures for different keys', () => {
      const signature1 = computeHmacSignature(params, key);
      const signature2 = computeHmacSignature(params, 'differentKey');
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
