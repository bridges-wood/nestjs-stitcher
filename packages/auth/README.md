# @nestjs-stitcher/auth

JWT authentication module with JWKS support for @nestjs-stitcher.

## Installation

```bash
npm install @nestjs-stitcher/auth
```

## Usage

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@nestjs-stitcher/auth';

@Module({
  imports: [
    AuthModule.forRoot({
      strategy: 'remote',
      jwksEndpoints: ['https://auth-service/.well-known/jwks.json'],
      jwt: { issuer: 'my-app', audience: 'my-app:api' },
    }),
  ],
})
export class AppModule {}
```

### Guards & Decorators

```typescript
import { CurrentUser, Public, Roles } from '@nestjs-stitcher/auth';

@Resolver()
export class UsersResolver {
  @Public()
  @Query(() => String)
  health() {
    return 'ok';
  }

  @Roles(['admin'])
  @Query(() => [User])
  users(@CurrentUser() user: StitcherUser) {
    // user.id, user.roles available
  }
}
```

## Documentation

For full documentation and architecture overview, see the [main README](https://github.com/bridges-wood/nestjs-stitcher#readme).

## License

MIT
