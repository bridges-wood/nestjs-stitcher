# Plan: Extract GraphQL Schema Stitching Engine into npm Packages

## Problem Statement

The poll-app monorepo contains a production-grade GraphQL schema stitching engine built on NestJS, `@graphql-tools/stitch`, and GraphQL Yoga. The core value — reactive schema stitching, subgraph federation, endpoint discovery, auth propagation, and HMAC-signed inter-service communication — is tightly coupled to the poll-app domain. We want to extract it into a set of reusable npm packages that any NestJS developer can use to build a federated GraphQL architecture.

## Proposed Approach

**Multi-package monorepo** with four packages under the `@nestjs-stitcher` npm scope:

| Package | Purpose | Primary consumers |
|---------|---------|-------------------|
| `@nestjs-stitcher/gateway` | Schema stitching gateway — discovers subgraphs, fetches SDL, stitches schemas, routes queries | Teams building the API gateway |
| `@nestjs-stitcher/subgraph` | Helpers for individual NestJS services to expose themselves as stitchable subgraphs | Teams building microservices |
| `@nestjs-stitcher/auth` | Auth module — JWT issuing, validation, guards, decorators; works standalone or embedded in gateway | Both gateway and subgraph consumers |
| `@nestjs-stitcher/common` | Shared types, HMAC utilities, error formatting, config tokens | All consumers |

**Key decisions:**
- **DB-agnostic** — Firebase/Firestore code stays in poll-app; the packages have no database opinions
- **NestJS-native** — Uses NestJS modules, DI, guards, decorators — not framework-agnostic
- **GraphQL server agnostic** — Produces standard `GraphQLSchema`; works with any NestJS driver (Yoga, Apollo, Mercurius)
- **Pagination excluded** — The Relay cursor pagination is Firestore-coupled; consumers bring their own
- **New project at `~/projects/nestjs-stitcher/`** — Completely separate from poll-app; its own Nx workspace, git repo, and npm publishing setup
- **Modern tooling** — Upgraded from poll-app's stack (see Tooling section below)

## Tooling (upgraded from poll-app)

| Concern | poll-app (current) | nestjs-stitcher (new) | Why |
|---------|-------------------|----------------------|-----|
| **Build** | tsc + webpack | **SWC** via `@nx/js:swc` | ~20-70x faster than tsc; Rust-based compiler; first-class Nx integration via `@swc/core`; generates CJS or ESM + `.d.ts` |
| **Test** | Jest | **Vitest** | Jest-compatible API (near drop-in); native ESM; instant watch mode; built-in coverage; significantly faster |
| **Lint + Format** | ESLint + Prettier | **Biome** | Single Rust-based tool replacing both; ~100x faster; one config file; growing rule ecosystem |
| **Package manager** | Yarn Berry 4.5 | **pnpm** | Faster installs; strict dependency resolution (catches phantom deps); excellent workspace support |
| **Monorepo** | Nx | **Nx** | No change — still the best for task orchestration, caching, and affected commands |

### SWC build config (per package via Nx)
```json
// packages/gateway/project.json
{
  "targets": {
    "build": {
      "executor": "@nx/js:swc",
      "options": {
        "outputPath": "dist/packages/gateway",
        "main": "packages/gateway/src/index.ts",
        "tsConfig": "packages/gateway/tsconfig.lib.json",
        "assets": []
      }
    }
  }
}
```

### Vitest config
```typescript
// vitest.config.ts (workspace root)
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: { provider: 'v8' },
  },
});
```

### Biome config
```json
// biome.json (workspace root)
{
  "formatter": { "indentStyle": "space", "indentWidth": 2 },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "javascript": { "formatter": { "quoteStyle": "single" } }
}
```

## Architecture

```
~/projects/nestjs-stitcher/              (new Nx monorepo — separate from poll-app)
├── packages/
│   ├── gateway/                    @nestjs-stitcher/gateway
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── gateway.module.ts              NestJS module (.forRoot() setup)
│   │   │   ├── schema/
│   │   │   │   ├── schema-stitcher.ts         Reactive schema stitching (RxJS)
│   │   │   │   └── schema.module.ts
│   │   │   ├── endpoints/
│   │   │   │   ├── endpoint-loader.ts         Abstract base class
│   │   │   │   ├── local-endpoint-loader.ts   File/config-based discovery
│   │   │   │   ├── dns-endpoint-loader.ts     DNS SRV (Consul) discovery
│   │   │   │   ├── endpoints.service.ts       CRUD for endpoints
│   │   │   │   ├── endpoints.resolver.ts      GraphQL API for endpoint mgmt
│   │   │   │   └── models/                    Endpoint, LoadedEndpoint, args
│   │   │   ├── executors/
│   │   │   │   ├── executor-factory.ts        HTTP/SSE executor creation + caching
│   │   │   │   └── executors.module.ts
│   │   │   ├── extensions/
│   │   │   │   ├── extension-visitor.ts       Base interface
│   │   │   │   ├── auth.visitor.ts            JWT context forwarding
│   │   │   │   └── signature.visitor.ts       HMAC request signing
│   │   │   └── config/
│   │   │       └── gateway-config.factory.ts  Endpoints + default queries config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── auth/                       @nestjs-stitcher/auth
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── auth.module.ts                 NestJS module (.forRoot() with strategy option)
│   │   │   ├── strategies/
│   │   │   │   ├── auth-strategy.interface.ts Abstract auth strategy interface
│   │   │   │   ├── remote-auth.strategy.ts    Validates JWTs via remote JWKS (for subgraphs)
│   │   │   │   └── local-auth.strategy.ts     Validates JWTs with local keys (gateway-embedded)
│   │   │   ├── guards/
│   │   │   │   ├── distributed-auth.guard.ts  JWT verification guard (NestJS guard, server-agnostic)
│   │   │   │   └── roles.guard.ts             Role-based access (NestJS guard)
│   │   │   ├── decorators/
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── roles.decorator.ts
│   │   │   │   └── public.decorator.ts
│   │   │   ├── signing/
│   │   │   │   ├── signing-key.provider.ts    Interface for key resolution
│   │   │   │   ├── remote-signing-key.provider.ts  Fetches JWKS from auth service
│   │   │   │   └── local-signing-key.provider.ts   Uses local key material (gateway-embedded)
│   │   │   └── config/
│   │   │       └── auth.config.ts             JWT issuer, audience, algorithms config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── subgraph/                   @nestjs-stitcher/subgraph
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── subgraph.module.ts             NestJS module (.forRoot() setup)
│   │   │   ├── federation/
│   │   │   │   └── prepare-schema.ts          prepareSchemaForFederation()
│   │   │   ├── interceptors/
│   │   │   │   └── hmac-validation.interceptor.ts  Validate HMAC from gateway (NestJS interceptor)
│   │   │   ├── bootstrap/
│   │   │   │   ├── bootstrap.ts               Service startup helper
│   │   │   │   └── find-port.ts               Auto port discovery
│   │   │   └── config/
│   │   │       ├── environment.config.ts
│   │   │       ├── schema.config.ts
│   │   │       └── hmac.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── common/                     @nestjs-stitcher/common
│       ├── src/
│       │   ├── index.ts
│       │   ├── hmac/
│       │   │   ├── compute-signature.ts       HMAC-SHA256 computation
│       │   │   ├── serialize-params.ts        Deterministic param serialization
│       │   │   └── constants.ts               HMAC_SIGNATURE_EXTENSION key
│       │   ├── config/
│       │   │   └── tokens.ts                  ConfigTokens enum
│       │   ├── errors/
│       │   │   └── error-formatter.ts         GraphQL error formatting
│       │   └── types/
│       │       └── index.ts                   Shared interfaces
│       ├── package.json
│       └── tsconfig.json
│
├── nx.json
├── tsconfig.base.json
├── package.json
├── jest.config.ts
├── eslint.config.js
└── README.md
```

### Auth Deployment Models

The `@nestjs-stitcher/auth` package supports two deployment patterns:

**Model A: Separate Auth Service** (current poll-app architecture)
```
┌──────────────┐    JWT     ┌──────────────┐    JWKS    ┌──────────────┐
│   Client     │──────────→ │   Gateway    │──────────→ │ Auth Service │
│              │            │ (validates)  │            │ (issues JWTs)│
└──────────────┘            └──────────────┘            └──────────────┘
                                   │                          ↑
                                   │ auth context             │ JWKS
                                   ↓                          │
                            ┌──────────────┐                  │
                            │  Subgraph    │──────────────────┘
                            │ (validates   │
                            │  via remote  │
                            │  JWKS)       │
                            └──────────────┘

Configuration:
  AuthModule.forRoot({ strategy: 'remote', jwksEndpoints: [...] })
```

**Model B: Gateway-Embedded Auth** (auth lives in the gateway)
```
┌──────────────┐  login/JWT ┌──────────────────────┐
│   Client     │──────────→ │   Gateway            │
│              │            │ (issues + validates   │
└──────────────┘            │  JWTs locally)        │
                            └──────────────────────┘
                                   │
                                   │ auth context (trusted, via HMAC)
                                   ↓
                            ┌──────────────┐
                            │  Subgraph    │
                            │ (trusts      │
                            │  gateway via │
                            │  HMAC sig)   │
                            └──────────────┘

Configuration:
  AuthModule.forRoot({ strategy: 'local', signingKey: process.env.JWT_PRIVATE_KEY })
```

## Source Mapping (poll-app → package)

### `@nestjs-stitcher/gateway` ← from:
| Poll-app source | Package destination | Changes needed |
|-----------------|--------------------|-|
| `apps/api-gateway/src/app/schema/schema-stitcher.ts` | `gateway/src/schema/schema-stitcher.ts` | Remove poll-app imports; generalize |
| `apps/api-gateway/src/app/schema/schema.module.ts` | `gateway/src/schema/schema.module.ts` | — |
| `apps/api-gateway/src/app/endpoints/` (all files) | `gateway/src/endpoints/` | Remove `@org/*` → use `@nestjs-stitcher/common` |
| `apps/api-gateway/src/app/executors/` | `gateway/src/executors/` | — |
| `apps/api-gateway/src/app/extensions/` | `gateway/src/extensions/` | — |
| `apps/api-gateway/src/app/config/` | `gateway/src/config/` | Generalize config keys |
| `apps/api-gateway/src/app/app.module.ts` | `gateway/src/gateway.module.ts` | Extract as configurable module (`.forRoot()`); move crypto to auth package |

### `@nestjs-stitcher/auth` ← from:
| Poll-app source | Package destination | Changes needed |
|-----------------|--------------------|-|
| `libs/auth/src/lib/guards/` | `auth/src/guards/` | Remove poll-app-specific roles |
| `libs/auth/src/lib/decorators/` | `auth/src/decorators/` | — |
| `libs/auth/src/lib/strategies/distributed.strategy.ts` | `auth/src/strategies/remote-auth.strategy.ts` | Rename; make configurable |
| `libs/auth/src/lib/signing/signing-key.provider.ts` | `auth/src/signing/signing-key.provider.ts` | — |
| `libs/auth/src/lib/signing/remote.signing-key.provider.ts` | `auth/src/signing/remote-signing-key.provider.ts` | — |
| `apps/api-gateway/src/app/crypto/local-signing-key-provider.ts` | `auth/src/signing/local-signing-key.provider.ts` | Generalize for gateway-embedded auth |
| `libs/auth/src/lib/config/` | `auth/src/config/auth.config.ts` | Generalize; add strategy option |
| (new) | `auth/src/strategies/local-auth.strategy.ts` | New: local JWT issuing + validation for gateway-embedded auth |
| (new) | `auth/src/auth.module.ts` | New: `AuthModule.forRoot({ strategy: 'remote' | 'local', ... })` |

### `@nestjs-stitcher/subgraph` ← from:
| Poll-app source | Package destination | Changes needed |
|-----------------|--------------------|-|
| `libs/graphql/src/lib/transformers/` | `subgraph/src/federation/prepare-schema.ts` | — |
| `libs/graphql/src/lib/plugins/hmac-upstream.ts` | `subgraph/src/plugins/hmac-validation.plugin.ts` | — |
| `libs/bootstrap/src/` | `subgraph/src/bootstrap/` | Remove registration service dep |
| `libs/config/src/lib/factories/` | `subgraph/src/config/` | Generalize tokens |

### `@nestjs-stitcher/common` ← from:
| Poll-app source | Package destination | Changes needed |
|-----------------|--------------------|-|
| `libs/graphql/src/lib/plugins/` (HMAC compute/serialize) | `common/src/hmac/` | — |
| `libs/config/src/lib/tokens.ts` | `common/src/config/tokens.ts` | — |
| `libs/errors/src/` | `common/src/errors/` | — |

## Implementation Todos

### Phase 1: Scaffold the new workspace
1. **scaffold-workspace** — Create new Nx workspace at `~/projects/nestjs-stitcher/` with pnpm, TypeScript, Biome (lint+format), Vitest; initialize git repo
2. **create-packages** — Scaffold the four packages (`gateway`, `auth`, `subgraph`, `common`) as publishable Nx libraries with SWC builds
3. **setup-build** — Configure `@nx/js:swc` builds, regular `dependencies` in each `package.json`, Vitest per-package

### Phase 2: Extract `@nestjs-stitcher/common`
4. **extract-hmac** — Port HMAC utilities (`computeHmacSignature`, `serializeParams`, constants)
5. **extract-config-tokens** — Port `ConfigTokens` enum and shared interfaces
6. **extract-errors** — Port error formatter (make GraphQL error formatting reusable)
7. **test-common** — Port and adapt unit tests for common

### Phase 3: Extract `@nestjs-stitcher/auth`
8. **extract-auth-strategy-interface** — Create abstract `AuthStrategy` interface supporting both remote JWKS and local key validation
9. **extract-auth-guards** — Port `DistributedAuthGuard`, `RolesGuard`, and decorators (`@CurrentUser`, `@Roles`, `@Public`)
10. **extract-remote-signing-key** — Port `SigningKeyProvider` interface + `RemoteSigningKeyProvider` (for separate auth-service model)
11. **extract-local-signing-key** — Port `LocalSigningKeyProvider` from gateway crypto; adapt for gateway-embedded auth model
12. **create-local-auth-strategy** — New: create local JWT issuing + validation strategy for gateway-embedded auth
13. **extract-jwt-interceptor** — Create NestJS interceptor for JWT validation (server-agnostic, replaces Yoga-specific `useJWT` plugin)
14. **extract-auth-config** — Port auth config (issuer, audience, algorithms) with strategy selection (`remote` | `local`)
15. **create-auth-module** — Create `AuthModule.forRoot({ strategy, ... })` supporting both deployment models
16. **test-auth** — Test both strategies: remote JWKS validation + local key validation + guards + decorators

### Phase 4: Extract `@nestjs-stitcher/subgraph`
17. **extract-federation-transformer** — Port `prepareSchemaForFederation()` and stitching directives setup
18. **extract-hmac-interceptor** — Port HMAC validation as NestJS interceptor (server-agnostic)
19. **extract-bootstrap** — Port bootstrap helper (remove Firebase/registration coupling)
20. **extract-subgraph-config** — Port environment, schema, HMAC config factories
21. **create-subgraph-module** — Create `SubgraphModule.forRoot(options)` as single entry point (imports `AuthModule` with `remote` strategy by default)
22. **test-subgraph** — Port and adapt unit tests

### Phase 5: Extract `@nestjs-stitcher/gateway`
23. **extract-schema-stitcher** — Port `SchemaStitcher` with reactive RxJS pipeline
24. **extract-endpoint-loader** — Port abstract `EndpointLoader` + `LocalEndpointLoader` + `DnsEndpointLoader`
25. **extract-executor-factory** — Port `ExecutorFactory` with HTTP/SSE execution + extension visitors
26. **extract-extension-visitors** — Port `AuthVisitor`, `SignatureVisitor`, and `ExtensionVisitor` interface
27. **extract-endpoints-api** — Port endpoints resolver, service, and models
28. **extract-gateway-config** — Port endpoints config factory and default queries config
29. **create-gateway-module** — Create `GatewayModule.forRoot(options)` with options for auth strategy (`remote` or `local`), endpoint loader, extension visitors, config path
30. **test-gateway** — Port and adapt unit tests (schema-stitcher, endpoint-loader, executor-factory, visitors)

### Phase 6: Documentation & DX
31. **write-readme** — Write comprehensive README with:
    - Quick start (gateway setup in 5 minutes)
    - Subgraph setup guide
    - Auth deployment models (separate auth-service vs gateway-embedded)
    - Configuration reference
    - Architecture diagram
    - Migration guide from Apollo Federation
32. **create-example-app** — Create minimal examples: (a) gateway + auth-service + subgraph, (b) gateway-with-embedded-auth + subgraph
33. **api-docs** — Add TSDoc comments to all public APIs

### Phase 7: Publish & integrate
34. **setup-publishing** — Configure npm publishing (scope, access, CI pipeline)
35. **update-poll-app** — Update poll-app to consume `@nestjs-stitcher/*` packages instead of local code
36. **integration-test** — Verify poll-app works with the extracted packages

## Key Design Decisions

### Module Configuration API

Each package exposes a NestJS module with `.forRoot()` / `.forRootAsync()`:

```typescript
// === Model A: Separate auth service ===

// Auth service (standalone)
@Module({
  imports: [
    AuthModule.forRoot({
      strategy: 'local',              // Issues + validates JWTs locally
      signingKey: process.env.JWT_PRIVATE_KEY,
      jwt: { issuer: 'my-app:auth', audience: 'my-app:api', algorithms: ['PS256'] },
    }),
  ],
})
export class AuthServiceModule {}

// Gateway (validates via remote JWKS)
@Module({
  imports: [
    StitchingGatewayModule.forRoot({
      endpointsConfigPath: './config.yml',
      hmacSecret: process.env.HMAC_SECRET,
      extensionVisitors: [AuthVisitor, SignatureVisitor],
      autoReloadInterval: 300_000,
    }),
    AuthModule.forRoot({
      strategy: 'remote',             // Validates JWTs via JWKS from auth-service
      jwksEndpoints: ['https://auth-service/graphql'],
      jwt: { issuer: 'my-app:auth', audience: 'my-app:api', algorithms: ['PS256'] },
    }),
  ],
})
export class GatewayModule {}

// === Model B: Gateway-embedded auth ===

// Gateway (issues + validates JWTs itself)
@Module({
  imports: [
    StitchingGatewayModule.forRoot({
      endpointsConfigPath: './config.yml',
      hmacSecret: process.env.HMAC_SECRET,
      extensionVisitors: [AuthVisitor, SignatureVisitor],
    }),
    AuthModule.forRoot({
      strategy: 'local',              // Issues + validates JWTs in the gateway
      signingKey: process.env.JWT_PRIVATE_KEY,
      jwt: { issuer: 'my-app:gateway', audience: 'my-app:api', algorithms: ['PS256'] },
    }),
  ],
})
export class GatewayModule {}

// Subgraph (trusts gateway via HMAC, no JWT validation needed)
@Module({
  imports: [
    StitchingSubgraphModule.forRoot({
      schemaTransformers: [addOneOfDirective],
      hmacSecret: process.env.HMAC_SECRET,
      bootstrap: { portRange: [4000, 5000], https: true },
    }),
    // AuthModule optional — subgraph trusts gateway's HMAC-signed extensions
  ],
})
export class MyServiceModule {}
```

### Dependencies Strategy

All dependencies are regular `dependencies` (bundled), not peer dependencies. This simplifies the consumer DX — they install the package and it just works.

**RxJS** — NestJS itself depends on RxJS, so every NestJS consumer already has it in their `node_modules`. Including it as a regular dependency adds zero effective size — npm/yarn will deduplicate it. RxJS is the right tool for the reactive schema stitching pipeline.

**GraphQL server agnostic** — The packages produce a standard `GraphQLSchema` object. Consumers wire it into whatever NestJS GraphQL driver they prefer (Yoga, Apollo, Mercurius). Auth and HMAC are implemented as NestJS guards, interceptors, and middleware — not tied to any specific GraphQL server plugin system.

```
┌────────────────────────────────────┐
│  @nestjs-stitcher/gateway          │
│  Produces: GraphQLSchema           │
└────────────┬───────────────────────┘
             │
             │ Standard GraphQLSchema
             ↓
┌──────────────────────────────────────────────────────┐
│  Consumer's NestJS app                                │
│  Uses any driver:                                     │
│  • GraphQLModule.forRoot<YogaDriverConfig>(...)       │
│  • GraphQLModule.forRoot<ApolloDriverConfig>(...)     │
│  • GraphQLModule.forRoot<MercuriusDriverConfig>(...) │
└──────────────────────────────────────────────────────┘
```

**What gets bundled as regular deps:**
- `@graphql-tools/stitch`, `@graphql-tools/stitching-directives`, `@graphql-tools/utils`, `@graphql-tools/wrap`
- `graphql` (core library)
- `rxjs` (already in NestJS apps)
- `@nestjs/common`, `@nestjs/core` (already in NestJS apps)
- `exponential-backoff`, `json-stable-stringify`, `jose`, `jwks-rsa`, `zod`

npm/yarn automatically deduplicates packages that the consumer already has, so there's no real bloat.

### What's Excluded (stays in poll-app)

- Firebase/Firestore services, repositories, model mappers
- Relay cursor pagination (Firestore-coupled)
- Cross-app URQL client (too opinionated; users can build their own)
- Service registration with Consul (replaced by generic EndpointLoader interface)
- PubSub module (subscription transport is app-specific)
- GraphQL codegen pipeline (users have their own codegen setup)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking poll-app when extracting | Phase 7 integration test; extract copies first, swap imports later |
| NestJS version lock-in | Use loose version ranges; avoid internal NestJS APIs |
| Users need different auth strategies | `AuthModule.forRoot({ strategy })` — pluggable remote/local |
| Endpoint discovery too rigid | Abstract `EndpointLoader` base class + provide Local/DNS; users implement custom |
| GraphQL server compatibility | Produce standard `GraphQLSchema`; auth/HMAC use NestJS guards/interceptors, not server-specific plugins |

## Notes

- The `@graphql-tools/stitch` library is the foundation — we're building NestJS-native DX around it
- RxJS reactive stitching is the key differentiator vs. static federation approaches
- Extension visitor pattern is powerful — should be first-class in the API
- Consider adding a CLI tool later for scaffolding subgraph services
