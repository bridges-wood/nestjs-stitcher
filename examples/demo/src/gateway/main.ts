import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { jwtVerify } from 'jose';
import { filter, firstValueFrom } from 'rxjs';
import { SchemaStitcher, EndpointLoader } from '@nestjs-stitcher/gateway';
import { AppModule } from './app.module';
import { GATEWAY_PORT, JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } from '../shared/constants';

async function main() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const endpointLoader = app.get(EndpointLoader);
  const stitcher = app.get(SchemaStitcher);

  // Wait for subgraph endpoints to load their SDL
  console.log('⏳ Waiting for subgraph endpoints to load...');
  await firstValueFrom(
    endpointLoader.loadedEndpoints$.pipe(
      filter((endpoints) => endpoints.length > 0),
    ),
  );
  console.log('✅ Endpoints loaded');

  // Provide a local gateway schema and stitch with remote subgraphs
  const localSchema = makeExecutableSchema({
    typeDefs: 'type Query { gatewayHealth: Boolean! }',
    resolvers: { Query: { gatewayHealth: () => true } },
  });
  await stitcher.stitchWithRemotes(localSchema);
  console.log('✅ Schemas stitched');

  // Create Yoga server with the stitched schema
  const secret = new TextEncoder().encode(JWT_SECRET);
  const yoga = createYoga({
    // Always use the latest stitched schema (supports reactive updates)
    schema: () => stitcher.stitchedSchema$.getValue(),
    graphiql: true,
    context: async ({ request }) => {
      // Extract and verify JWT from Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const result = await jwtVerify(authHeader.slice(7), secret, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
          });
          return { jwt: result };
        } catch {
          // Invalid token — proceed without auth context
        }
      }
      return {};
    },
  });

  // Mount Yoga on the NestJS HTTP server
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.use('/graphql', yoga);

  await app.listen(GATEWAY_PORT);
  console.log(
    `🚀 Gateway running at http://localhost:${GATEWAY_PORT}/graphql`,
  );
}

main();
