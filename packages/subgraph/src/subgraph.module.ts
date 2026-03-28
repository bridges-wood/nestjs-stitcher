import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {
  SUBGRAPH_MODULE_OPTIONS,
  type SubgraphModuleOptions,
} from './config/subgraph-config.interface.js';
import { HmacValidationInterceptor } from './interceptors/hmac-validation.interceptor.js';

@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS module pattern requires class with static forRoot
export class SubgraphModule {
  static forRoot(options: SubgraphModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      { provide: SUBGRAPH_MODULE_OPTIONS, useValue: options },
    ];

    if (options.hmacSecret) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: HmacValidationInterceptor,
      });
    }

    return {
      module: SubgraphModule,
      global: true,
      providers,
      exports: [SUBGRAPH_MODULE_OPTIONS],
    };
  }
}
