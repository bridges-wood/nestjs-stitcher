import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { POSTS_SERVICE_PORT } from '../shared/constants';

async function main() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  await app.listen(POSTS_SERVICE_PORT);
  console.log(
    `📝 Posts service running at http://localhost:${POSTS_SERVICE_PORT}/graphql`,
  );
}

main();
