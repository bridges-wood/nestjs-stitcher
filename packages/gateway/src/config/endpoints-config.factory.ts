import { existsSync, readFileSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import * as yaml from 'js-yaml';
import { z } from 'zod';

export const EndpointsConfigValidator = z
  .object({
    endpoints: z
      .array(
        z.object({
          name: z.string(),
          hash: z.string(),
          url: z.string(),
          description: z.string().optional(),
          jwksUri: z.string().optional(),
        }),
      )
      .default([]),
  })
  .optional();

export interface EndpointsConfig {
  endpoints: Array<{
    name: string;
    hash: string;
    url: string;
    description?: string;
    jwksUri?: string;
  }>;
}

export function loadEndpointsConfig(configPath: string): EndpointsConfig {
  const logger = new Logger('EndpointsConfigFactory');

  if (!existsSync(configPath)) {
    logger.warn(`Config file not found: ${configPath}`);
    return { endpoints: [] };
  }

  const configFile = readFileSync(configPath, 'utf8');
  const loadedConfig = EndpointsConfigValidator.parse(yaml.load(configFile));

  logger.debug(
    `Loaded ${loadedConfig?.endpoints?.length || 0} endpoints from ${configPath}`,
  );
  return { endpoints: loadedConfig?.endpoints || [] };
}
