import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql, printSchema } from 'graphql';
import { describe, expect, it } from 'vitest';
import { prepareSchemaForFederation } from './prepare-schema.js';

function createBaseSchema() {
  return makeExecutableSchema({
    typeDefs: `type Query { hello: String }`,
    resolvers: { Query: { hello: () => 'world' } },
  });
}

describe('prepareSchemaForFederation', () => {
  it('should add _service query to schema', () => {
    const baseSchema = createBaseSchema();

    const transformer = prepareSchemaForFederation();
    const federatedSchema = transformer(baseSchema);
    const printed = printSchema(federatedSchema);

    expect(printed).toContain('_service');
    expect(printed).toContain('_Service');
    expect(printed).toContain('_sdl');
  });

  it('should apply additional transformers', () => {
    const baseSchema = createBaseSchema();

    let transformerCalled = false;
    const customTransformer = (schema: any) => {
      transformerCalled = true;
      return schema;
    };

    const transformer = prepareSchemaForFederation(customTransformer);
    transformer(baseSchema);

    expect(transformerCalled).toBe(true);
  });

  it('should resolve _service._sdl', async () => {
    const baseSchema = createBaseSchema();

    const transformer = prepareSchemaForFederation();
    const federatedSchema = transformer(baseSchema);

    const result = await graphql({
      schema: federatedSchema,
      source: '{ _service { _sdl } }',
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?._service?._sdl).toContain('hello');
  });
});
