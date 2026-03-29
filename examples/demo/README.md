# @nestjs-stitcher Demo

A working demo of `@nestjs-stitcher` — a gateway that stitches two subgraph services into one unified GraphQL API.

## Architecture

```
         Client (with JWT)
                │
                ▼
  ┌─────────────────────────┐
  │     Gateway  :4000      │
  │  • JWT validation       │
  │  • Schema stitching     │
  │  • HMAC-signed proxying │
  └──────┬──────────┬───────┘
         │          │
         ▼          ▼
  ┌────────────┐ ┌────────────┐
  │   Users    │ │   Posts    │
  │   :4001    │ │   :4002    │
  │  id, name, │ │ id, title, │
  │  email     │ │ body,      │
  │            │ │ authorId   │
  └────────────┘ └────────────┘
```

**What this demonstrates:**

- **Schema stitching** — Two independent subgraphs combined into one API
- **Cross-service type merging** — `Post.author` resolves from the Users service; `User.posts` resolves from the Posts service
- **JWT authentication** — Gateway validates Bearer tokens
- **HMAC trust chain** — Gateway signs requests so subgraphs know they're trusted
- **Stitching directives** — `@key` and `@merge` for declarative type merging

## Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9

## Quick Start

### 1. Install dependencies

From the **repository root**:

```bash
pnpm install
```

### 2. Build the library packages

```bash
pnpm build
```

### 3. Start the services

Open **three terminals** and run (from the repo root):

```bash
# Terminal 1 — Users service
pnpm --filter @nestjs-stitcher/demo start:users

# Terminal 2 — Posts service
pnpm --filter @nestjs-stitcher/demo start:posts

# Terminal 3 — Gateway (start after subgraphs are running)
pnpm --filter @nestjs-stitcher/demo start:gateway
```

> **Note:** Start the subgraphs first. The gateway will wait for them to respond before stitching schemas.

### 4. Open the playground

Visit **http://localhost:4000/graphql** to use the GraphiQL playground.

## Example Queries

### List all users

```graphql
{
  users {
    id
    name
    email
  }
}
```

### List posts with authors (cross-service resolution)

This is the key demo — `Post.author` is resolved from the Users service:

```graphql
{
  posts {
    id
    title
    body
    author {
      id
      name
      email
    }
  }
}
```

### Get a user with their posts (reverse cross-service resolution)

`User.posts` is resolved from the Posts service:

```graphql
{
  user(id: "1") {
    name
    email
    posts {
      id
      title
    }
  }
}
```

### Create a user

```graphql
mutation {
  createUser(name: "Diana Prince", email: "diana@example.com") {
    id
    name
    email
  }
}
```

### Create a post

```graphql
mutation {
  createPost(
    title: "My New Post"
    body: "This is the body of my new post."
    authorId: "1"
  ) {
    id
    title
    author {
      name
    }
  }
}
```

## Authentication

### Generate a test token

```bash
pnpm --filter @nestjs-stitcher/demo generate-token
```

With custom claims:

```bash
pnpm --filter @nestjs-stitcher/demo generate-token -- --sub 1 --roles admin,editor
```

### Use the token

Add the `Authorization` header in GraphiQL or curl:

```bash
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"query":"{ users { id name email } }"}'
```

## How It Works

### Schema Stitching

1. Each subgraph defines its schema with stitching directives (`@key`, `@merge`)
2. `prepareSchemaForFederation()` adds introspection (`_service { _sdl }`) and validates directives
3. The gateway fetches SDL from each subgraph and stitches them into one schema
4. `@merge` annotated queries serve as entry points for cross-service type resolution

### Trust Chain (HMAC)

1. Client sends a request with a JWT to the gateway
2. Gateway validates the JWT and extracts user info (`sub`, `roles`)
3. Gateway forwards the request to subgraphs with:
   - `extensions.trusted = true` (marks this as a gateway-originated request)
   - `extensions.sub` and `extensions.roles` (forwarded user identity)
   - `extensions['hmac-signature']` (HMAC-SHA256 signature proving authenticity)
4. Subgraphs verify the HMAC signature and trust the forwarded user identity

### File Structure

```
examples/demo/
├── config.yml                     # Gateway endpoints config
├── src/
│   ├── shared/constants.ts        # Shared secrets and ports
│   ├── gateway/
│   │   ├── app.module.ts          # GatewayModule + AuthModule
│   │   └── main.ts               # Yoga server with stitched schema
│   ├── users-service/
│   │   ├── schema.graphql         # User type with @key, @merge
│   │   ├── users.service.ts       # In-memory user store
│   │   ├── users.resolver.ts      # GraphQL resolvers
│   │   ├── users.module.ts
│   │   ├── app.module.ts          # SubgraphModule + Yoga
│   │   └── main.ts
│   └── posts-service/
│       ├── schema.graphql         # Post type + User extension
│       ├── posts.service.ts       # In-memory post store
│       ├── posts.resolver.ts      # GraphQL resolvers
│       ├── posts.module.ts
│       ├── app.module.ts          # SubgraphModule + Yoga
│       └── main.ts
└── scripts/
    └── generate-token.ts          # JWT generator CLI
```
