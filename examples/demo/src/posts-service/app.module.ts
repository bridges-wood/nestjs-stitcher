import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { SubgraphModule, prepareSchemaForFederation } from '@nestjs-stitcher/subgraph';
import { join } from 'path';
import { HMAC_SECRET } from '../shared/constants';
import { PostsModule } from './posts.module';

@Module({
  imports: [
    SubgraphModule.forRoot({
      hmacSecret: HMAC_SECRET,
    }),
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      typePaths: [join(__dirname, '*.graphql')],
      transformSchema: prepareSchemaForFederation(),
    }),
    PostsModule,
  ],
})
export class AppModule {}
