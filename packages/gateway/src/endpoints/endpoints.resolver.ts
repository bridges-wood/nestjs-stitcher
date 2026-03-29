import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EndpointsService } from './endpoints.service.js';
import type { AddEndpointArgs } from './models/add-endpoint.args.js';
import { AddEndpointResult } from './models/add-endpoint.result.js';
import type { EndpointFilter } from './models/endpoint-filter.args.js';
import { LoadedEndpoint } from './models/loaded-endpoint.model.js';
import { ReloadAllEndpointsResult } from './models/reload-all-endpoints.result.js';
import { RemoveEndpointResult } from './models/remove-endpoint.result.js';

@Resolver()
export class EndpointsResolver {
  private readonly logger = new Logger(EndpointsResolver.name);

  constructor(private readonly endpointsService: EndpointsService) {}

  @Query(() => [LoadedEndpoint], {
    description: 'Get all endpoints currently loaded by the gateway',
  })
  endpoints(
    @Args('filter', { nullable: true }) filter: EndpointFilter,
  ): LoadedEndpoint[] {
    return this.endpointsService.getEndpoints(filter);
  }

  @Mutation(() => AddEndpointResult, {
    description: 'Add a new endpoint to the gateway',
  })
  addEndpoint(@Args('args') args: AddEndpointArgs): Promise<AddEndpointResult> {
    this.logger.debug(`Adding endpoint ${args.url}`);
    return this.endpointsService.addEndpoint(args);
  }

  @Mutation(() => RemoveEndpointResult, {
    description: 'Remove an endpoint from the gateway',
  })
  removeEndpoint(
    @Args('name', { description: 'The name of the endpoint to remove' })
    name: string,
  ): Promise<RemoveEndpointResult> {
    this.logger.debug(`Removing endpoint '${name}'`);
    return this.endpointsService.removeEndpoint(name);
  }

  @Mutation(() => ReloadAllEndpointsResult, {
    description: 'Reload the schema of all endpoints',
  })
  reloadAllEndpoints(): Promise<ReloadAllEndpointsResult> {
    this.logger.debug('Reloading all endpoints');
    return this.endpointsService.reloadAllEndpoints();
  }
}
