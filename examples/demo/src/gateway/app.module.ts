import { Module } from '@nestjs/common';
import { GatewayModule as StitcherGatewayModule, AuthVisitor, SignatureVisitor } from '@nestjs-stitcher/gateway';
import { resolve } from 'path';
import { HMAC_SECRET } from '../shared/constants';

@Module({
  imports: [
    StitcherGatewayModule.forRoot({
      endpointsConfigPath: resolve(__dirname, '../../config.yml'),
      hmacSecret: HMAC_SECRET,
      extensionVisitors: [
        new AuthVisitor(),
        new SignatureVisitor({ hmacSecret: HMAC_SECRET }),
      ],
    }),
  ],
})
export class AppModule {}
