import { Field, ObjectType } from '@nestjs/graphql';
import { Endpoint } from './endpoint.model.js';

@ObjectType({ description: 'An endpoint loaded into the API Gateway' })
export class LoadedEndpoint extends Endpoint {
  @Field({ description: 'The GraphQL SDL of the endpoint' })
  sdl!: string;

  @Field({ description: 'Date and time the endpoint was last loaded' })
  lastReload!: Date;
}
