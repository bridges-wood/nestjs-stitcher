import { HMAC_SIGNATURE_EXTENSION } from '@nestjs-stitcher/common';
import { parse } from 'graphql';
import { describe, expect, it } from 'vitest';
import { SignatureVisitor } from './signature-visitor.js';

describe('SignatureVisitor', () => {
  it('should compute and add HMAC signature', () => {
    const visitor = new SignatureVisitor({
      hmacSecret: 'test-secret-that-is-at-least-32-chars!',
    });
    const document = parse('{ hello }');
    const extensions = {};

    const result = visitor.visit(extensions, {
      document,
      variables: {},
    } as any);

    expect(result).toHaveProperty(HMAC_SIGNATURE_EXTENSION);
    expect(typeof (result as any)[HMAC_SIGNATURE_EXTENSION]).toBe('string');
  });

  it('should not add signature when no hmacSecret', () => {
    const visitor = new SignatureVisitor({});
    const document = parse('{ hello }');
    const extensions = { existing: 'value' };

    const result = visitor.visit(extensions, {
      document,
      variables: {},
    } as any);

    expect(result).toEqual({ existing: 'value' });
  });

  it('should produce different signatures for different queries', () => {
    const visitor = new SignatureVisitor({
      hmacSecret: 'test-secret-that-is-at-least-32-chars!',
    });
    const doc1 = parse('{ hello }');
    const doc2 = parse('{ world }');

    const result1 = visitor.visit({}, { document: doc1, variables: {} } as any);
    const result2 = visitor.visit({}, { document: doc2, variables: {} } as any);

    expect((result1 as any)[HMAC_SIGNATURE_EXTENSION]).not.toBe(
      (result2 as any)[HMAC_SIGNATURE_EXTENSION],
    );
  });
});
