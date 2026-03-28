import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { StitcherUser } from '@nestjs-stitcher/common';

export const currentUserFactory = (
  _data: unknown,
  context: ExecutionContext,
): StitcherUser => {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext().req.user;
};

/**
 * Extracts the current user from the GraphQL context request.
 */
export const CurrentUser = createParamDecorator(currentUserFactory);
