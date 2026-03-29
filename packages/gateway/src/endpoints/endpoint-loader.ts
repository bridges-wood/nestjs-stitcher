import { type AsyncExecutor, type ExecutionResult } from '@graphql-tools/utils';
import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { NotFoundError } from '@nestjs-stitcher/common';
import { backOff } from 'exponential-backoff';
import { OperationTypeNode, parse } from 'graphql';
import { BehaviorSubject, debounceTime, type Subscription } from 'rxjs';
import type { ExecutorFactory } from '../executors/executor-factory.js';
import type { Endpoint } from './models/endpoint.model.js';
import type { LoadedEndpoint } from './models/loaded-endpoint.model.js';

interface ServiceSDLResponse {
  _service?: {
    _sdl?: string;
  };
}

interface ReRegisterResponse {
  _reRegister?: boolean;
}

@Injectable()
export abstract class EndpointLoader implements OnModuleDestroy {
  private readonly DEBOUNCE_INTERVAL = 600;
  protected readonly logger = new Logger(EndpointLoader.name);
  private readonly endpointSubscription: Subscription;
  private autoReloadTimer?: ReturnType<typeof setInterval>;

  public loadedEndpoints$ = new BehaviorSubject<LoadedEndpoint[]>([]);
  protected endpoints$ = new BehaviorSubject<Endpoint[]>([]);

  constructor(
    protected readonly executorFactory: ExecutorFactory,
    initialEndpoints: Endpoint[] = [],
    private readonly autoReloadInterval: number = 300_000,
  ) {
    this.endpoints$.next(initialEndpoints);
    this.endpointSubscription = this.endpoints$
      .pipe(debounceTime(this.DEBOUNCE_INTERVAL))
      .subscribe((endpoints) => this.reload(endpoints));

    if (this.autoReloadInterval > 0) {
      this.autoReloadTimer = setInterval(() => {
        this.logger.log('🤖 Auto-reloading schema');
        this.reload(this.endpoints$.value);
      }, this.autoReloadInterval);
    }
  }

  onModuleDestroy() {
    this.endpointSubscription.unsubscribe();
    if (this.autoReloadTimer) {
      clearInterval(this.autoReloadTimer);
    }
  }

  getEndpoints(): LoadedEndpoint[] {
    return this.loadedEndpoints$.value;
  }

  async addEndpoint(endpoint: Endpoint): Promise<Endpoint> {
    await this.loadEndpoint(endpoint);
    this.endpoints$.next([...this.endpoints$.value, endpoint]);
    return endpoint;
  }

  async removeEndpoint(
    endpoint: Pick<Endpoint, 'name'>,
  ): Promise<Endpoint | undefined> {
    const index = this.endpoints$.value.findIndex(
      (e) => e.name === endpoint.name,
    );
    if (index === -1) {
      throw new NotFoundError(`Endpoint not found: '${endpoint.name}'`);
    }
    const endpoints = [...this.endpoints$.value];
    const removed = endpoints.splice(index, 1)[0];
    this.endpoints$.next(endpoints);
    return removed;
  }

  async unRegisterAllEndpoints(): Promise<void> {
    this.logger.log('⛓️‍💥 Unregistering all endpoints...');
    const endpoints = this.endpoints$.value;

    await Promise.all(
      endpoints.map((endpoint) => this.unRegisterEndpoint(endpoint)),
    );

    this.endpoints$.next([]);
    this.logger.log('⛓️‍💥 Unregistered all endpoints');
  }

  async reload(endpoints?: Endpoint[]): Promise<void> {
    endpoints = endpoints ?? this.endpoints$.value;
    if (endpoints.length === 0) {
      this.logger.warn('No endpoints to load, skipping');
      this.loadedEndpoints$.next([]);
      return;
    }

    const loadedEndpoints: LoadedEndpoint[] = [];
    this.logger.log(`Attempting to load ${endpoints.length} endpoint(s)`);

    await Promise.all(
      endpoints.map(async (endpoint) => {
        const sdl = await this.loadEndpoint(endpoint);
        loadedEndpoints.push({
          ...endpoint,
          sdl,
          lastReload: new Date(),
        } as LoadedEndpoint);
      }),
    );

    this.logger.log(
      `Successfully loaded ${loadedEndpoints.length} endpoint(s)`,
    );
    this.loadedEndpoints$.next(loadedEndpoints);
  }

  protected abstract loadEndpoint(endpoint: Endpoint): Promise<string>;

  protected async fetchSDL(
    fetcher: AsyncExecutor,
    endpoint: Endpoint,
  ): Promise<string> {
    try {
      const result = await backOff(
        () =>
          fetcher({
            document: parse('{ _service { _sdl } }'),
            operationType: OperationTypeNode.QUERY,
          }),
        { numOfAttempts: 10 },
      );

      if (Symbol.asyncIterator in Object(result)) {
        throw new Error('Expected executor to return a single result');
      }

      const sdl = (result as ExecutionResult<ServiceSDLResponse>)?.data
        ?._service?._sdl;
      if (!sdl) {
        this.logger.debug(`Received: ${JSON.stringify(result)}`);
        throw new Error('No SDL found in response');
      }

      return sdl;
    } catch (error) {
      this.logger.error(
        `Failed to load endpoint ${endpoint.name}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private async unRegisterEndpoint(endpoint: Endpoint): Promise<boolean> {
    const fetcher = this.executorFactory.getExecutor(endpoint.url);
    this.logger.debug(`Unregistering endpoint ${endpoint.name}`);

    try {
      const result = await fetcher({
        document: parse('mutation { _reRegister }'),
      });

      if (Symbol.asyncIterator in Object(result)) {
        throw new Error('Expected executor to return a single result');
      }

      const success = (result as ExecutionResult<ReRegisterResponse>)?.data
        ?._reRegister;
      if (!success) throw new Error('Failed to unregister');

      this.logger.debug(
        `✅ Successfully unregistered endpoint ${endpoint.name}`,
      );
      return success;
    } catch (error) {
      this.logger.error(
        `Failed to unregister endpoint ${endpoint.name}: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
