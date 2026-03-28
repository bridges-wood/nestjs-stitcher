import { ConfigType, registerAs } from '@nestjs/config';
import { z } from 'zod';
import { ConfigTokens } from '@nestjs-stitcher/common';

export const EnvironmentConfigValidator = z
  .object({
    NODE_ENV: z.union([
      z.literal('development'),
      z.literal('production'),
      z.literal('test'),
    ]),
    PORT: z.string().optional(),
    NAME: z.string().optional(),
  })
  .refine((input) => input.NODE_ENV !== 'production' || !!input.PORT, {
    message: 'PORT must be set in production',
  });

const EnvironmentConfigFactory = registerAs(ConfigTokens.ENVIRONMENT, () => {
  const env = EnvironmentConfigValidator.parse(process.env);
  return {
    environment: env.NODE_ENV,
    isDev: () => env.NODE_ENV === 'development',
    port: env.PORT ? parseInt(env.PORT, 10) : undefined,
    name: env.NAME,
  };
});

export type EnvironmentConfig = ConfigType<typeof EnvironmentConfigFactory>;
export default EnvironmentConfigFactory;
