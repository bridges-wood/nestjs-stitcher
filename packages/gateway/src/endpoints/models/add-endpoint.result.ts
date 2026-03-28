import { Field, ObjectType } from '@nestjs/graphql';
import { Endpoint } from './endpoint.model.js';

@ObjectType()
export class AddEndpointResult {
  @Field({ description: 'Whether the endpoint was added successfully' })
  success!: boolean;

  @Field(() => Endpoint, {
    nullable: true,
    description: 'The endpoint that was added',
  })
  endpoint?: Endpoint;
}
