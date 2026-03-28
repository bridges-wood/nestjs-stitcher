import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RemoveEndpointResult {
  @Field({ description: 'Whether the endpoint was removed successfully' })
  success!: boolean;
}
