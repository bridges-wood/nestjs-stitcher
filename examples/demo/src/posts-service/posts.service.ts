import { Injectable } from '@nestjs/common';

interface Post {
  id: string;
  title: string;
  body: string;
  authorId: string;
}

@Injectable()
export class PostsService {
  private posts: Post[] = [
    {
      id: '1',
      title: 'Getting Started with GraphQL Schema Stitching',
      body: 'Schema stitching lets you combine multiple GraphQL APIs into one unified schema...',
      authorId: '1',
    },
    {
      id: '2',
      title: 'NestJS and GraphQL: A Perfect Pair',
      body: 'NestJS provides first-class support for building GraphQL APIs...',
      authorId: '1',
    },
    {
      id: '3',
      title: 'Microservices with Federated GraphQL',
      body: 'Breaking a monolith into microservices while keeping a unified API...',
      authorId: '2',
    },
    {
      id: '4',
      title: 'JWT Authentication in Distributed Systems',
      body: 'Securing inter-service communication with JWT and HMAC signatures...',
      authorId: '3',
    },
  ];

  private nextId = 5;

  findAll(): Post[] {
    return this.posts;
  }

  findById(id: string): Post | undefined {
    return this.posts.find((p) => p.id === id);
  }

  findByAuthorId(authorId: string): Post[] {
    return this.posts.filter((p) => p.authorId === authorId);
  }

  create(title: string, body: string, authorId: string): Post {
    const post: Post = { id: String(this.nextId++), title, body, authorId };
    this.posts.push(post);
    return post;
  }
}
