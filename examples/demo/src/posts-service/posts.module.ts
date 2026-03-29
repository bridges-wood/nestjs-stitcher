import { Module } from '@nestjs/common';
import { PostsResolver, UserPostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';

@Module({
  providers: [PostsService, PostsResolver, UserPostsResolver],
})
export class PostsModule {}
