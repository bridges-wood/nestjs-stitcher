import { addResolversToSchema } from '@graphql-tools/schema';
import { stitchingDirectives } from '@graphql-tools/stitching-directives';
import {
  addTypes,
  appendObjectFields,
  printSchemaWithDirectives,
} from '@graphql-tools/utils';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

const { stitchingDirectivesValidator, allStitchingDirectives } =
  stitchingDirectives();

export type SchemaTransformer = (schema: GraphQLSchema) => GraphQLSchema;

function addStitchingDirectivesToSchema(schema: GraphQLSchema): GraphQLSchema {
  return addTypes(schema, allStitchingDirectives);
}

function addEnhancedIntrospection(): SchemaTransformer[] {
  type Service = { _sdl: string };

  const serviceObjectType = new GraphQLObjectType<Service>({
    name: '_Service',
    fields: {
      _sdl: {
        description: "A string representation of the subgraph's schema",
        type: GraphQLString,
      },
    },
  });

  return [
    (schema: GraphQLSchema) => addTypes(schema, [serviceObjectType]),
    (schema: GraphQLSchema) =>
      appendObjectFields(schema, 'Query', {
        _service: {
          type: serviceObjectType,
          description: 'The subgraph schema',
        },
      }),
    (schema: GraphQLSchema) =>
      addResolversToSchema({
        schema,
        resolvers: {
          Query: {
            _service: () => ({
              _sdl: printSchemaWithDirectives(schema),
            }),
          },
        },
      }),
  ];
}

/**
 * Prepares a GraphQL schema for federation by adding stitching directives,
 * enhanced introspection (_service { _sdl }), and validation.
 *
 * @param additionalTransformers - Optional additional schema transformers to apply
 * @returns A schema transformer function
 */
export function prepareSchemaForFederation(
  ...additionalTransformers: SchemaTransformer[]
): SchemaTransformer {
  return (schema: GraphQLSchema) => {
    const transformers: SchemaTransformer[] = [
      ...additionalTransformers,
      addStitchingDirectivesToSchema,
      ...addEnhancedIntrospection(),
      stitchingDirectivesValidator,
    ];

    return transformers.reduce((s, transform) => transform(s), schema);
  };
}
