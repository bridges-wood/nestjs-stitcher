import { describe, expect, it } from 'vitest';
import { extractBearerToken } from './extract-auth-token.js';

describe('extractBearerToken', () => {
  it('should extract Bearer token', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123');
  });

  it('should return null for missing header', () => {
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it('should return null for non-Bearer scheme', () => {
    expect(extractBearerToken('Basic abc123')).toBeNull();
  });

  it('should return null for malformed header', () => {
    expect(extractBearerToken('Bearer')).toBeNull();
  });
});
