import { join } from 'node:path';
import { type ConfigType, registerAs } from '@nestjs/config';
import { ConfigTokens } from '@nestjs-stitcher/common';

const SchemaConfigFactory = registerAs(ConfigTokens.SCHEMA, () => ({
  schemaFile: join(
    process.cwd(),
    `generated/${process.env.SCHEMA_FILE || 'schema.graphql'}`,
  ),
}));

export type SchemaConfig = ConfigType<typeof SchemaConfigFactory>;
export default SchemaConfigFactory;
