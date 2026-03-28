import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'A service accessible by the API Gateway' })
export class Endpoint {
  @Field({ description: 'Logical name of the service' })
  name!: string;

  @Field({ description: 'Version hash of the service (SHA256)' })
  hash!: string;

  @Field({ description: 'Root URL of the service' })
  url!: string;

  @Field({ description: 'JWKS endpoint URL for the service', nullable: true })
  jwksUri?: string;
}
