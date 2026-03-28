import { Injectable } from '@nestjs/common';
import type { ExecutionRequest } from '@graphql-tools/utils';
import type { TrustedRequestExtensions } from '@nestjs-stitcher/common';
import type { ExtensionVisitor } from './extension-visitor.js';

@Injectable()
export class AuthVisitor implements ExtensionVisitor {
  visit(
    extensions: Record<string, unknown>,
    { context }: Omit<ExecutionRequest, 'extensions'>,
  ): Record<string, unknown> {
    const jwt = context?.jwt;

    if (jwt) {
      return {
        ...extensions,
        trusted: true,
        sub: jwt.payload.sub,
        roles: jwt.payload.roles,
      } as TrustedRequestExtensions;
    }

    return extensions;
  }
}
