import { InputType, OmitType } from '@nestjs/graphql';
import { Endpoint } from './endpoint.model.js';

@InputType({
  description: 'Arguments to add a new endpoint to the gateway.',
})
export class AddEndpointArgs extends OmitType(
  Endpoint,
  [] as const,
  InputType,
) {}
