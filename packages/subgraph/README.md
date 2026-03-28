# @nestjs-stitcher/subgraph

Subgraph helpers for NestJS services in a stitched GraphQL architecture.

## Installation

```bash
npm install @nestjs-stitcher/subgraph
```

## Usage

```typescript
import { Module } from '@nestjs/common';
import { SubgraphModule } from '@nestjs-stitcher/subgraph';

@Module({
  imports: [
    SubgraphModule.forRoot({
      hmacSecret: process.env.HMAC_SECRET,
    }),
  ],
})
export class UsersServiceModule {}
```

Use `prepareSchemaForFederation()` as a schema transformer in your GraphQL module config to make the schema stitchable:

```typescript
import { prepareSchemaForFederation } from '@nestjs-stitcher/subgraph';

// In your GraphQL module configuration
transformSchema: prepareSchemaForFederation(),
```

## Documentation

For full documentation and architecture overview, see the [main README](https://github.com/bridges-wood/nestjs-stitcher#readme).

## License

MIT
