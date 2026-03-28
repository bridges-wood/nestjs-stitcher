import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AUTH_MODULE_OPTIONS, type AuthModuleOptions } from './config/auth-config.interface.js';
import { StitcherAuthGuard } from './guards/auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { JwtVerifier } from './strategies/jwt-verifier.js';
import { RemoteJwtVerifier } from './strategies/remote-jwt-verifier.js';
import { LocalJwtVerifier } from './strategies/local-jwt-verifier.js';
import { RemoteSigningKeyProvider } from './signing/remote-signing-key.provider.js';
import { SigningKeyProvider } from './signing/signing-key.provider.js';

@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    const verifierProvider: Provider = {
      provide: JwtVerifier,
      useClass:
        options.strategy === 'local' ? LocalJwtVerifier : RemoteJwtVerifier,
    };

    const signingKeyProvider: Provider = {
      provide: SigningKeyProvider,
      useClass: RemoteSigningKeyProvider,
    };

    return {
      module: AuthModule,
      global: true,
      providers: [
        { provide: AUTH_MODULE_OPTIONS, useValue: options },
        verifierProvider,
        signingKeyProvider,
        StitcherAuthGuard,
        RolesGuard,
      ],
      exports: [
        AUTH_MODULE_OPTIONS,
        JwtVerifier,
        SigningKeyProvider,
        StitcherAuthGuard,
        RolesGuard,
      ],
    };
  }
}
