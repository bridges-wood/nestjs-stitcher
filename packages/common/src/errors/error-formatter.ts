import { Injectable } from '@nestjs/common';
import type { GraphQLFormattedError } from 'graphql';

interface OutputError {
  message: string;
  [key: string]: unknown;
}

@Injectable()
export class ErrorFormatter {
  format(formattedError: GraphQLFormattedError): OutputError {
    if (!this.hasExtensionFields(formattedError)) {
      return { message: formattedError.message };
    }

    const originalError = formattedError.extensions.originalError as Error;
    if (!originalError) {
      return {
        message: formattedError.message,
        code: formattedError.extensions.code,
      };
    }

    return {
      message: originalError.message,
      code: formattedError.extensions.code,
    };
  }

  private hasExtensionFields(
    formattedError: GraphQLFormattedError,
  ): formattedError is GraphQLFormattedError & {
    extensions: Record<string, unknown>;
  } {
    return Boolean(formattedError.extensions);
  }
}
