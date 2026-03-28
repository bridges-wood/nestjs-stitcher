import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import { loadEndpointsConfig } from './config/endpoints-config.factory.js';
import {
  GATEWAY_MODULE_OPTIONS,
  type GatewayModuleOptions,
} from './config/gateway-config.interface.js';
import { EndpointLoader } from './endpoints/endpoint-loader.js';
import { EndpointsResolver } from './endpoints/endpoints.resolver.js';
import { EndpointsService } from './endpoints/endpoints.service.js';
import { LocalEndpointLoader } from './endpoints/local-endpoint-loader.js';
import type { Endpoint } from './endpoints/models/endpoint.model.js';
import { ExecutorFactory } from './executors/executor-factory.js';
import { AuthVisitor } from './extensions/auth-visitor.js';
import { SignatureVisitor } from './extensions/signature-visitor.js';
import { SchemaStitcher } from './schema/schema-stitcher.js';

@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS module pattern requires class with static forRoot
export class GatewayModule {
  static forRoot(options: GatewayModuleOptions = {}): DynamicModule {
    const optionsProvider: Provider = {
      provide: GATEWAY_MODULE_OPTIONS,
      useValue: options,
    };

    const executorFactoryProvider: Provider = {
      provide: ExecutorFactory,
      useFactory: () => {
        const visitors = options.extensionVisitors ?? [];
        return new ExecutorFactory(visitors);
      },
    };

    const endpointLoaderProvider: Provider = {
      provide: EndpointLoader,
      useFactory: (executorFactory: ExecutorFactory) => {
        let initialEndpoints = options.endpoints ?? [];
        if (options.endpointsConfigPath && initialEndpoints.length === 0) {
          const config = loadEndpointsConfig(options.endpointsConfigPath);
          initialEndpoints = config.endpoints;
        }
        return new LocalEndpointLoader(
          initialEndpoints as Endpoint[],
          executorFactory,
          options.autoReloadInterval,
        );
      },
      inject: [ExecutorFactory],
    };

    return {
      module: GatewayModule,
      global: true,
      providers: [
        optionsProvider,
        AuthVisitor,
        {
          provide: SignatureVisitor,
          useFactory: () => new SignatureVisitor(options),
        },
        executorFactoryProvider,
        endpointLoaderProvider,
        EndpointsService,
        EndpointsResolver,
        SchemaStitcher,
      ],
      exports: [
        GATEWAY_MODULE_OPTIONS,
        ExecutorFactory,
        EndpointLoader,
        EndpointsService,
        SchemaStitcher,
        AuthVisitor,
        SignatureVisitor,
      ],
    };
  }
}
