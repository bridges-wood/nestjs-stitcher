import { defineConfig } from 'vitest/config';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const graphqlEntry = require.resolve('graphql');

export default defineConfig({
  resolve: {
    dedupe: ['graphql'],
    alias: {
      graphql: graphqlEntry,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: { provider: 'v8' },
    projects: [
      {
        resolve: {
          dedupe: ['graphql'],
          alias: { graphql: graphqlEntry },
        },
        test: {
          name: 'common',
          root: 'packages/common',
          include: ['src/**/*.spec.ts'],
        },
      },
      {
        resolve: {
          dedupe: ['graphql'],
          alias: { graphql: graphqlEntry },
        },
        test: {
          name: 'auth',
          root: 'packages/auth',
          include: ['src/**/*.spec.ts'],
        },
      },
      {
        resolve: {
          dedupe: ['graphql'],
          alias: { graphql: graphqlEntry },
        },
        test: {
          name: 'subgraph',
          root: 'packages/subgraph',
          include: ['src/**/*.spec.ts'],
        },
      },
      {
        resolve: {
          dedupe: ['graphql'],
          alias: { graphql: graphqlEntry },
        },
        test: {
          name: 'gateway',
          root: 'packages/gateway',
          include: ['src/**/*.spec.ts'],
        },
      },
    ],
  },
});
