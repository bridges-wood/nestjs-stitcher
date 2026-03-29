import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { USERS_SERVICE_PORT } from '../shared/constants';

async function main() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  await app.listen(USERS_SERVICE_PORT);
  console.log(
    `🧑 Users service running at http://localhost:${USERS_SERVICE_PORT}/graphql`,
  );
}

main();
