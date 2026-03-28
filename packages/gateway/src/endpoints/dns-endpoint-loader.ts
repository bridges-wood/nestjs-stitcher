import { Injectable, Logger } from '@nestjs/common';
import { resolveSrv } from 'node:dns/promises';
import { EndpointLoader } from './endpoint-loader.js';
import { ExecutorFactory } from '../executors/executor-factory.js';
import type { Endpoint } from './models/endpoint.model.js';

@Injectable()
export class DnsEndpointLoader extends EndpointLoader {
  protected override readonly logger = new Logger(DnsEndpointLoader.name);

  constructor(executorFactory: ExecutorFactory, autoReloadInterval?: number) {
    super(executorFactory, [], autoReloadInterval);
  }

  override async loadEndpoint(endpoint: Endpoint): Promise<string> {
    const service = await this.resolveService(endpoint.name);
    const fetcher = this.executorFactory.getExecutor(`https://${service}`);
    return this.fetchSDL(fetcher, endpoint);
  }

  private async resolveService(serviceName: string): Promise<string> {
    const records = await resolveSrv(`${serviceName}.service.consul`);
    if (records.length === 0) {
      throw new Error(`No SRV records found for ${serviceName}`);
    }
    return `${records[0].name}:${records[0].port}`;
  }
}
