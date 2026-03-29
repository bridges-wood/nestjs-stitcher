import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';

@Resolver('User')
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query()
  users() {
    return this.usersService.findAll();
  }

  @Query()
  user(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @Mutation()
  createUser(@Args('name') name: string, @Args('email') email: string) {
    return this.usersService.create(name, email);
  }
}
