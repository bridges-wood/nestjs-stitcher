import { ConfigType, registerAs } from '@nestjs/config';
import { join } from 'node:path';
import { ConfigTokens } from '@nestjs-stitcher/common';

const SchemaConfigFactory = registerAs(ConfigTokens.SCHEMA, () => ({
  schemaFile: join(
    process.cwd(),
    `generated/${process.env['SCHEMA_FILE'] || 'schema.graphql'}`,
  ),
}));

export type SchemaConfig = ConfigType<typeof SchemaConfigFactory>;
export default SchemaConfigFactory;
