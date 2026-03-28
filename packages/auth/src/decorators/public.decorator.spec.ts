import { describe, it, expect } from 'vitest';
import { IS_PUBLIC_KEY, Public } from './public.decorator.js';

describe('Public Decorator', () => {
  it('should define IS_PUBLIC_KEY', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('should create a decorator function', () => {
    expect(typeof Public).toBe('function');
    const decorator = Public();
    expect(typeof decorator).toBe('function');
  });
});
