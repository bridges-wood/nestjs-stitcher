# @nestjs-stitcher/gateway

Schema stitching gateway module for NestJS GraphQL.

## Installation

```bash
npm install @nestjs-stitcher/gateway
```

## Usage

```typescript
import { Module } from '@nestjs/common';
import { GatewayModule, AuthVisitor, SignatureVisitor } from '@nestjs-stitcher/gateway';

@Module({
  imports: [
    GatewayModule.forRoot({
      endpointsConfigPath: './config.yml',
      hmacSecret: process.env.HMAC_SECRET,
      extensionVisitors: [
        new AuthVisitor(),
        new SignatureVisitor({ hmacSecret: process.env.HMAC_SECRET }),
      ],
      autoReloadInterval: 300_000,
    }),
  ],
})
export class AppModule {}
```

### Endpoints Config (`config.yml`)

```yaml
endpoints:
  - name: users-service
    hash: abc123
    url: https://localhost:4001/graphql
  - name: products-service
    hash: def456
    url: https://localhost:4002/graphql
```

## Documentation

For full documentation and architecture overview, see the [main README](https://github.com/bridges-wood/nestjs-stitcher#readme).

## License

MIT
