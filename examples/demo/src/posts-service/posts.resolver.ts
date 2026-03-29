import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { PostsService } from './posts.service';

@Resolver('Post')
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query()
  posts() {
    return this.postsService.findAll();
  }

  @Query()
  post(@Args('id') id: string) {
    return this.postsService.findById(id);
  }

  @Mutation()
  createPost(
    @Args('title') title: string,
    @Args('body') body: string,
    @Args('authorId') authorId: string,
  ) {
    return this.postsService.create(title, body, authorId);
  }

  /**
   * Returns a partial User with just the ID. The gateway resolves
   * the full User (name, email) from the Users service via type merging.
   */
  @ResolveField('author')
  getAuthor(@Parent() post: { authorId: string }) {
    return { id: post.authorId };
  }
}

/**
 * Resolver for the Posts service's partial User type.
 * Provides the User.posts field that the gateway merges with the
 * Users service's User type.
 */
@Resolver('User')
export class UserPostsResolver {
  constructor(private readonly postsService: PostsService) {}

  /**
   * Merge entry point: the gateway calls _postServiceUser(id) to get
   * a User with their posts from this service.
   */
  @Query()
  _postServiceUser(@Args('id') id: string) {
    return { id, posts: this.postsService.findByAuthorId(id) };
  }

  @ResolveField('posts')
  getPosts(@Parent() user: { id: string }) {
    return this.postsService.findByAuthorId(user.id);
  }
}
