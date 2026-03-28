import { Injectable, Logger } from '@nestjs/common';
import { EndpointLoader } from './endpoint-loader.js';
import { ExecutorFactory } from '../executors/executor-factory.js';
import type { Endpoint } from './models/endpoint.model.js';

@Injectable()
export class LocalEndpointLoader extends EndpointLoader {
  protected override readonly logger = new Logger(LocalEndpointLoader.name);

  constructor(
    initialEndpoints: Endpoint[],
    executorFactory: ExecutorFactory,
    autoReloadInterval?: number,
  ) {
    super(executorFactory, initialEndpoints, autoReloadInterval);
  }

  override async removeEndpoint(
    endpoint: Pick<Endpoint, 'name'>,
  ): Promise<Endpoint | undefined> {
    const removed = await super.removeEndpoint(endpoint);
    if (!removed) return;
    this.executorFactory.invalidateExecutor(removed.url);
    return removed;
  }

  override async loadEndpoint(endpoint: Endpoint): Promise<string> {
    const fetcher = this.executorFactory.getExecutor(endpoint.url);
    return this.fetchSDL(fetcher, endpoint);
  }
}
