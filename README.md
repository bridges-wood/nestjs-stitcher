# @nestjs-stitcher

A set of NestJS modules for building federated GraphQL architectures using schema stitching.

## Overview

- **4 packages**: `@nestjs-stitcher/gateway`, `@nestjs-stitcher/auth`, `@nestjs-stitcher/subgraph`, `@nestjs-stitcher/common`
- **Built on `@graphql-tools/stitch`** with reactive RxJS schema composition
- **NestJS-native**: modules, dependency injection, guards, decorators, interceptors
- **GraphQL server agnostic**: produces a standard `GraphQLSchema` (works with Yoga, Apollo, Mercurius)
- **DB-agnostic**: no database opinions

## Packages

| Package | Purpose |
| --- | --- |
| `@nestjs-stitcher/gateway` | Schema stitching gateway — discovers subgraphs, fetches SDL, stitches schemas |
| `@nestjs-stitcher/subgraph` | Helpers for NestJS services to expose as stitchable subgraphs |
| `@nestjs-stitcher/auth` | JWT auth with support for remote JWKS and local key validation |
| `@nestjs-stitcher/common` | Shared types, HMAC utilities, error classes, config tokens |

## Quick Start

### Gateway Setup

```typescript
import { Module } from '@nestjs/common';
import { GatewayModule, AuthVisitor, SignatureVisitor } from '@nestjs-stitcher/gateway';
import { AuthModule } from '@nestjs-stitcher/auth';

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
    AuthModule.forRoot({
      strategy: 'remote',
      jwksEndpoints: ['https://auth-service/.well-known/jwks.json'],
      jwt: { issuer: 'my-app', audience: 'my-app:api' },
    }),
  ],
})
export class AppModule {}
```

### Subgraph Setup

```typescript
import { Module } from '@nestjs/common';
import { SubgraphModule, prepareSchemaForFederation } from '@nestjs-stitcher/subgraph';
import { AuthModule } from '@nestjs-stitcher/auth';

@Module({
  imports: [
    SubgraphModule.forRoot({
      hmacSecret: process.env.HMAC_SECRET,
    }),
    AuthModule.forRoot({
      strategy: 'remote',
      jwksEndpoints: ['https://auth-service/.well-known/jwks.json'],
      jwt: { issuer: 'my-app', audience: 'my-app:api' },
    }),
  ],
})
export class UsersServiceModule {}

// In your GraphQL module config, use prepareSchemaForFederation() as a schema transformer
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
    jwksUri: https://localhost:4002/.well-known/jwks.json
```

## Architecture

```
                        ┌──────────────────────┐
                        │       Clients        │
                        └──────────┬───────────┘
                                   │ JWT
                                   ▼
                        ┌──────────────────────┐
                        │       Gateway        │
                        │  (stitches schemas)  │
                        └──┬───────┬───────┬───┘
                  HMAC +   │       │       │   + HMAC
                  JWT ext  │       │       │     JWT ext
                           ▼       ▼       ▼
                     ┌────────┐┌────────┐┌────────┐
                     │ Sub  A ││ Sub  B ││ Sub  C │
                     └────────┘└────────┘└────────┘

  Auth: JWT validation at gateway + HMAC-signed extensions to subgraphs
```

## Auth Deployment Models

### Model A: Separate Auth Service

1. A dedicated auth service issues JWTs:
   `AuthModule.forRoot({ strategy: 'local', signingKey: ... })`
2. The gateway validates tokens via remote JWKS:
   `AuthModule.forRoot({ strategy: 'remote', jwksEndpoints: [...] })`
3. Subgraphs trust the gateway via HMAC-signed extensions.

### Model B: Gateway-Embedded Auth

1. The gateway issues **and** validates JWTs locally:
   `AuthModule.forRoot({ strategy: 'local', signingKey: ... })`
2. Subgraphs trust the gateway via HMAC-signed extensions.

## Configuration Reference

### `GatewayModule.forRoot(options)`

| Option | Type | Description |
| --- | --- | --- |
| `endpointsConfigPath` | `string` | Path to YAML config file |
| `hmacSecret` | `string` | Secret for HMAC request signing |
| `extensionVisitors` | `ExtensionVisitor[]` | Array of `ExtensionVisitor` implementations |
| `autoReloadInterval` | `number` | Auto-reload interval in ms (default: `300000`; `0` to disable) |
| `endpoints` | `Endpoint[]` | Initial endpoints array (alternative to config file) |

### `AuthModule.forRoot(options)`

| Option | Type | Description |
| --- | --- | --- |
| `strategy` | `'remote' \| 'local'` | Auth strategy |
| `jwksEndpoints` | `string[]` | JWKS endpoint URLs (remote strategy) |
| `signingKey` | `string` | Local signing key PEM / secret (local strategy) |
| `jwt.issuer` | `string` | Expected JWT issuer |
| `jwt.audience` | `string` | Expected JWT audience |
| `jwt.algorithms` | `string[]` | Allowed algorithms |
| `bypassAuth` | `boolean` | Bypass auth (development only) |

### `SubgraphModule.forRoot(options)`

| Option | Type | Description |
| --- | --- | --- |
| `hmacSecret` | `string` | Secret for HMAC validation |
| `schemaTransformers` | `SchemaTransformer[]` | Additional schema transformers |
| `bootstrap` | `object` | Port / HTTPS configuration |

## Key Concepts

### Schema Stitching

The `SchemaStitcher` uses RxJS to reactively compose schemas. When endpoints change (config reload, DNS discovery, etc.), the gateway automatically re-stitches the combined schema — no restart required.

### Extension Visitors

The visitor pattern enriches outgoing requests from the gateway to subgraphs:

- **`AuthVisitor`** — forwards JWT claims (`sub`, `roles`) as trusted extensions
- **`SignatureVisitor`** — computes HMAC-SHA256 signatures for request integrity

### HMAC Security

Requests from the gateway to subgraphs are signed with HMAC-SHA256. Subgraphs validate the signature via the `HmacValidationInterceptor`, ensuring only the trusted gateway can invoke them.

### Endpoint Loaders

| Loader | Description |
| --- | --- |
| `LocalEndpointLoader` | Loads endpoints from a config file or static list |
| `DnsEndpointLoader` | Discovers endpoints via DNS SRV records (e.g. Consul) |
| Custom | Extend `EndpointLoader` for custom discovery mechanisms |

## Guards & Decorators

```typescript
import { CurrentUser, Public, Roles, StitcherAuthGuard, RolesGuard } from '@nestjs-stitcher/auth';
import { StitcherUser } from '@nestjs-stitcher/common';

@Resolver()
export class UsersResolver {
  @Public()
  @Query(() => String)
  health() {
    return 'ok';
  }

  @Roles(['admin'])
  @Query(() => [User])
  users(@CurrentUser() user: StitcherUser) {
    // user.id, user.roles available
  }
}
```

## Development

```bash
pnpm install       # Install dependencies
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
pnpm lint          # Lint with Biome
pnpm lint:fix      # Auto-fix lint issues
```

## License

MIT
