import type { ExecutionRequest } from '@graphql-tools/utils';

export interface ExtensionVisitor {
  visit(
    extensions: Record<string, unknown>,
    request: Omit<ExecutionRequest, 'extensions'>,
  ): Record<string, unknown>;
}
