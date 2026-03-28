# @nestjs-stitcher/auth

## 0.1.0

### Minor Changes

- ### Security

  - Fix timing-unsafe HMAC signature comparison — now uses `crypto.timingSafeEqual()`
  - Prevent auth bypass via untrusted `extensions.trusted` — requires HMAC verification first
  - Block `bypassAuth` in production (`NODE_ENV=production` throws)
  - Default JWT algorithms to `['RS256']` when unconfigured to prevent algorithm confusion
  - Enforce minimum HMAC key length of 32 characters
  - Validate `HMAC_SECRET` environment variable is set at startup
  - Add 30s fetch timeouts and `redirect: 'error'` on all outbound subgraph requests

  ### Fixed

  - Fix RxJS subscription memory leak in `SchemaStitcher` — implements `OnModuleDestroy`, uses `switchMap`
  - Replace `as any` type casts with proper interfaces (`ServiceSDLResponse`, `ReRegisterResponse`)
  - Fix all 92 Biome lint errors and 58 warnings
  - Resolve high-severity dependency vulnerabilities (`picomatch`, `path-to-regexp`)

  ### Packaging

  - Fix `exports` field in all packages — add `types` condition, remove non-standard condition
  - Add `license`, `author`, `description`, `keywords`, `bugs` to all package.json files
  - Add per-package README.md files
  - Add `engines` field and `.nvmrc`
  - Add `reflect-metadata` to devDependencies

### Patch Changes

- Updated dependencies
  - @nestjs-stitcher/common@0.1.0
