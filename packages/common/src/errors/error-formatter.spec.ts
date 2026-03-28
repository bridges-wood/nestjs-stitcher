import { describe, it, expect, beforeEach } from 'vitest';
import type { GraphQLFormattedError } from 'graphql';
import { ErrorFormatter } from './error-formatter.js';

describe('ErrorFormatter', () => {
  let formatter: ErrorFormatter;

  beforeEach(() => {
    formatter = new ErrorFormatter();
  });

  it('should format error without originalError', () => {
    const formattedError: GraphQLFormattedError = {
      message: 'Test error message',
      extensions: { code: 'TEST_CODE' },
    };
    const result = formatter.format(formattedError);
    expect(result).toEqual({ message: 'Test error message', code: 'TEST_CODE' });
  });

  it('should format error with originalError', () => {
    const originalError = new Error('Original error message');
    const formattedError: GraphQLFormattedError = {
      message: 'Test error message',
      extensions: { code: 'TEST_CODE', originalError },
    };
    const result = formatter.format(formattedError);
    expect(result).toEqual({ message: 'Original error message', code: 'TEST_CODE' });
  });

  it('should handle missing extension fields gracefully', () => {
    const formattedError: GraphQLFormattedError = {
      message: 'Test error message',
    };
    const result = formatter.format(formattedError);
    expect(result).toEqual({ message: 'Test error message' });
  });
});
