# @nestjs-stitcher/common

Shared types, HMAC utilities, and error classes for @nestjs-stitcher.

## Installation

```bash
npm install @nestjs-stitcher/common
```

## Overview

This package provides the foundational building blocks used across the `@nestjs-stitcher` ecosystem:

- **Types** — `StitcherUser`, config tokens, and shared interfaces
- **HMAC utilities** — HMAC-SHA256 signing and verification helpers
- **Error classes** — Standardised GraphQL error types

## Usage

```typescript
import { StitcherUser } from '@nestjs-stitcher/common';

// StitcherUser is the standard user type passed through
// gateway extensions to subgraphs
const user: StitcherUser = {
  id: 'user-123',
  roles: ['admin'],
};
```

## Documentation

For full documentation and architecture overview, see the [main README](https://github.com/bridges-wood/nestjs-stitcher#readme).

## License

MIT
