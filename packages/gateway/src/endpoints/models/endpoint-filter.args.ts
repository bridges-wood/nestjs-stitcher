import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'Filter for endpoints loaded by the gateway.' })
export class EndpointFilter {
  @Field({ nullable: true, description: 'Filter by endpoint name' })
  name?: string;

  @Field({ nullable: true, description: 'Filter by endpoint URL' })
  url?: string;
}
