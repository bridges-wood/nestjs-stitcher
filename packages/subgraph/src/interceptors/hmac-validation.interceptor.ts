import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  computeHmacSignature,
  HMAC_SIGNATURE_EXTENSION,
  UnauthorizedError,
} from '@nestjs-stitcher/common';
import { Observable } from 'rxjs';
import { SUBGRAPH_MODULE_OPTIONS, type SubgraphModuleOptions } from '../config/subgraph-config.interface.js';

@Injectable()
export class HmacValidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HmacValidationInterceptor.name);

  constructor(
    @Inject(SUBGRAPH_MODULE_OPTIONS)
    private readonly options: SubgraphModuleOptions,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!this.options.hmacSecret) {
      return next.handle();
    }

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    const body = req.body;

    if (!body?.extensions) {
      return next.handle();
    }

    const receivedSignature = body.extensions[HMAC_SIGNATURE_EXTENSION];
    if (!receivedSignature) {
      return next.handle();
    }

    const expectedSignature = computeHmacSignature(
      {
        query: body.query,
        variables: body.variables,
        extensions: body.extensions,
      },
      this.options.hmacSecret,
    );

    if (receivedSignature !== expectedSignature) {
      this.logger.warn('HMAC signature mismatch — rejecting request');
      throw new UnauthorizedError('Invalid HMAC signature');
    }

    this.logger.debug('HMAC signature validated successfully');
    return next.handle();
  }
}
