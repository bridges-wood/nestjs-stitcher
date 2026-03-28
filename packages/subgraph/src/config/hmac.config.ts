import { type ConfigType, registerAs } from '@nestjs/config';
import { ConfigTokens } from '@nestjs-stitcher/common';

const HmacConfigFactory = registerAs(ConfigTokens.HMAC, () => {
  const secret = process.env.HMAC_SECRET;
  if (!secret) {
    throw new Error('HMAC_SECRET environment variable is required');
  }
  return { secret };
});

export type HmacConfig = ConfigType<typeof HmacConfigFactory>;
export default HmacConfigFactory;
