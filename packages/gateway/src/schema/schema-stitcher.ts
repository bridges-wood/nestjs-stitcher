import type { SubschemaConfig, Transform } from '@graphql-tools/delegate';
import { stitchSchemas } from '@graphql-tools/stitch';
import { stitchingDirectives } from '@graphql-tools/stitching-directives';
import { FilterRootFields } from '@graphql-tools/wrap';
import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { buildSchema, type GraphQLSchema } from 'graphql';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  firstValueFrom,
  from,
  Subject,
  type Subscription,
  skip,
  switchMap,
} from 'rxjs';
import { EndpointLoader } from '../endpoints/endpoint-loader.js';
import type { LoadedEndpoint } from '../endpoints/models/loaded-endpoint.model.js';
import { ExecutorFactory } from '../executors/executor-factory.js';

@Injectable()
export class SchemaStitcher implements OnModuleDestroy {
  private readonly logger = new Logger(SchemaStitcher.name);
  private readonly subscription: Subscription;
  private localSchema$ = new Subject<GraphQLSchema>();
  public stitchedSchema$ = new BehaviorSubject<GraphQLSchema>(
    null as unknown as GraphQLSchema,
  );

  constructor(
    private readonly endpointLoader: EndpointLoader,
    private readonly executorFactory: ExecutorFactory,
  ) {
    this.subscription = combineLatest([
      this.endpointLoader.loadedEndpoints$,
      this.localSchema$,
    ])
      .pipe(
        filter(([_endpoints, localSchema]) => localSchema != null),
        switchMap(([endpoints, localSchema]) =>
          from(this.stitch(endpoints, localSchema)),
        ),
      )
      .subscribe((newSchema) => {
        this.stitchedSchema$.next(newSchema);
      });
  }

  onModuleDestroy() {
    this.subscription.unsubscribe();
  }

  async stitchWithRemotes(localSchema: GraphQLSchema): Promise<GraphQLSchema> {
    this.localSchema$.next(localSchema);
    return firstValueFrom(this.stitchedSchema$.pipe(skip(1)));
  }

  private async stitch(
    endpoints: LoadedEndpoint[],
    localSchema: GraphQLSchema,
  ): Promise<GraphQLSchema> {
    if (endpoints.length === 0) {
      this.logger.warn('No endpoints to stitch, skipping');
      return localSchema;
    }

    const { stitchingDirectivesTransformer } = stitchingDirectives();
    const subschemas: SubschemaConfig[] = [
      ...endpoints.map((endpoint) =>
        this.convertRemoteSchemaToSubschemaConfig(endpoint),
      ),
      { schema: localSchema },
    ];

    this.logger.log(`🪡  Stitching ${subschemas.length} subschema(s)`);
    const stitchedSchema = stitchSchemas({
      subschemaConfigTransforms: [stitchingDirectivesTransformer],
      subschemas,
    });
    this.logger.log(
      `🪡  Successfully stitched ${subschemas.length} subschema(s)`,
    );

    return stitchedSchema;
  }

  private convertRemoteSchemaToSubschemaConfig(
    endpoint: LoadedEndpoint,
  ): SubschemaConfig {
    return {
      schema: buildSchema(endpoint.sdl),
      executor: this.executorFactory.getExecutor(endpoint.url),
      batch: true,
      transforms: [
        new FilterRootFields(
          (_operation, rootFieldName) => !rootFieldName.startsWith('_'),
        ) as Transform,
      ],
    };
  }
}
