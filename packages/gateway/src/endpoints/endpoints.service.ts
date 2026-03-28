import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { EndpointLoader } from './endpoint-loader.js';
import type { AddEndpointArgs } from './models/add-endpoint.args.js';
import type { AddEndpointResult } from './models/add-endpoint.result.js';
import type { EndpointFilter } from './models/endpoint-filter.args.js';
import type { LoadedEndpoint } from './models/loaded-endpoint.model.js';
import type { ReloadAllEndpointsResult } from './models/reload-all-endpoints.result.js';
import type { RemoveEndpointResult } from './models/remove-endpoint.result.js';

@Injectable()
export class EndpointsService implements OnApplicationShutdown {
  private readonly logger = new Logger(EndpointsService.name);

  constructor(private readonly endpointLoader: EndpointLoader) {}

  getEndpoints(filter?: EndpointFilter): LoadedEndpoint[] {
    const endpoints = this.endpointLoader.getEndpoints();
    if (!filter) return endpoints;

    return endpoints.filter((e) => {
      if (filter.name && !e.name.includes(filter.name)) return false;
      if (filter.url && !e.url.includes(filter.url)) return false;
      return true;
    });
  }

  async addEndpoint(args: AddEndpointArgs): Promise<AddEndpointResult> {
    const existing = this.endpointLoader
      .getEndpoints()
      .find((e) => e.name === args.name);
    if (existing) {
      await this.endpointLoader.removeEndpoint({ name: args.name });
    }

    const addedEndpoint = await this.endpointLoader.addEndpoint(args as any);
    return { endpoint: addedEndpoint, success: true };
  }

  async removeEndpoint(name: string): Promise<RemoveEndpointResult> {
    await this.endpointLoader.removeEndpoint({ name });
    return { success: true };
  }

  async reloadAllEndpoints(): Promise<ReloadAllEndpointsResult> {
    try {
      await this.endpointLoader.reload();
      return {
        success: true,
        loadedEndpoints: this.endpointLoader.getEndpoints(),
      };
    } catch (error) {
      this.logger.error(error);
      return {
        success: false,
        loadedEndpoints: this.endpointLoader.getEndpoints(),
      };
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Received shutdown signal: ${signal}`);
    await this.endpointLoader.unRegisterAllEndpoints();
  }
}
