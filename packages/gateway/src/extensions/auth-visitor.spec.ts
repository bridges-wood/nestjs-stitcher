import { describe, expect, it } from 'vitest';
import { AuthVisitor } from './auth-visitor.js';

describe('AuthVisitor', () => {
  const visitor = new AuthVisitor();

  it('should add trusted extensions when JWT is present', () => {
    const extensions = {};
    const result = visitor.visit(extensions, {
      context: {
        jwt: {
          payload: { sub: 'user-123', roles: ['admin'] },
        },
      },
    } as any);

    expect(result).toEqual({
      trusted: true,
      sub: 'user-123',
      roles: ['admin'],
    });
  });

  it('should return extensions unchanged when no JWT', () => {
    const extensions = { existing: 'value' };
    const result = visitor.visit(extensions, { context: {} } as any);
    expect(result).toEqual({ existing: 'value' });
  });

  it('should return extensions unchanged when context is undefined', () => {
    const extensions = {};
    const result = visitor.visit(extensions, {} as any);
    expect(result).toEqual({});
  });
});
