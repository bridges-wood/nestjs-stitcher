import { ConfigType, registerAs } from '@nestjs/config';
import { ConfigTokens } from '@nestjs-stitcher/common';

const HmacConfigFactory = registerAs(ConfigTokens.HMAC, () => ({
  secret: process.env['HMAC_SECRET'] as string,
}));

export type HmacConfig = ConfigType<typeof HmacConfigFactory>;
export default HmacConfigFactory;
