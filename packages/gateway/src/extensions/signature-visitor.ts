import { Injectable } from '@nestjs/common';
import type { ExecutionRequest } from '@graphql-tools/utils';
import {
  computeHmacSignature,
  HMAC_SIGNATURE_EXTENSION,
} from '@nestjs-stitcher/common';
import { print } from 'graphql';
import type { ExtensionVisitor } from './extension-visitor.js';
import type { GatewayModuleOptions } from '../config/gateway-config.interface.js';

@Injectable()
export class SignatureVisitor implements ExtensionVisitor {
  constructor(private readonly options: GatewayModuleOptions) {}

  visit(
    extensions: Record<string, unknown>,
    { document, variables }: Omit<ExecutionRequest, 'extensions'>,
  ): Record<string, unknown> {
    if (!this.options.hmacSecret) return extensions;

    const query = print(document);
    return {
      ...extensions,
      [HMAC_SIGNATURE_EXTENSION]: computeHmacSignature(
        { query, variables, extensions },
        this.options.hmacSecret,
      ),
    };
  }
}
