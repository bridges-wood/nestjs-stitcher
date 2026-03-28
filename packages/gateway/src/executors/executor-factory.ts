import type { AsyncExecutor, ExecutionResult } from '@graphql-tools/utils';
import { Injectable, Logger } from '@nestjs/common';
import { OperationTypeNode, print } from 'graphql';
import { createClient, type RequestParams } from 'graphql-sse';
import type { ExtensionVisitor } from '../extensions/extension-visitor.js';

export interface GraphQLRequestBody {
  query: string;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
  extensions?: Record<string, unknown>;
}

@Injectable()
export class ExecutorFactory {
  private readonly logger = new Logger(ExecutorFactory.name);
  private executorCache = new Map<string, AsyncExecutor>();

  constructor(private readonly extensionVisitors: ExtensionVisitor[]) {}

  getExecutor(url: string): AsyncExecutor {
    const cached = this.executorCache.get(url);
    if (cached) {
      this.logger.debug(`Returning cached executor for: ${url}`);
      return cached;
    }
    return this.initializeExecutor(url);
  }

  invalidateExecutor(url: string): void {
    this.logger.debug(`Invalidating executor for: ${url}`);
    this.executorCache.delete(url);
  }

  private initializeExecutor(url: string): AsyncExecutor {
    this.logger.debug(`Creating executor for: ${url}`);

    const executor: AsyncExecutor = async ({
      document,
      variables,
      operationName,
      extensions: baseExtensions = {},
      context,
      operationType,
    }) => {
      const query = print(document);

      const extensions = this.extensionVisitors.reduce<Record<string, unknown>>(
        (exts, visitor) =>
          visitor.visit(exts, { document, variables, operationName, context, operationType }),
        baseExtensions as Record<string, unknown>,
      );

      switch (operationType) {
        case OperationTypeNode.SUBSCRIPTION:
          return this.buildSseExecutor(url, { query, variables, operationName, extensions });
        case OperationTypeNode.QUERY:
        case OperationTypeNode.MUTATION:
          return this.buildFetchExecutor(url, { query, variables, operationName, extensions });
        default:
          throw new Error(`Unsupported operation type: ${operationType} for executor at ${url}`);
      }
    };

    this.executorCache.set(url, executor);
    return executor;
  }

  private buildSseExecutor(
    url: string,
    params: RequestParams,
  ): AsyncIterable<ExecutionResult> {
    const client = createClient({
      url,
      fetchFn: fetch,
      retryAttempts: 0,
      headers: { accept: 'text/event-stream' },
    });
    return client.iterate(params);
  }

  private async buildFetchExecutor(
    url: string,
    body: GraphQLRequestBody,
  ): Promise<ExecutionResult> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response.json() as Promise<ExecutionResult>;
  }
}
