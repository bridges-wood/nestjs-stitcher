import { Logger, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { findAndListenOnPort } from './find-port.js';

export interface BootstrapOptions {
  /** Port to listen on. If undefined, auto-finds a port. */
  port?: number;
  /** Port range for auto-discovery [start, end]. Default: [4000, 5000] */
  portRange?: [number, number];
  /** Enable HTTPS with the provided key/cert options */
  httpsOptions?: { key: Buffer | string; cert: Buffer | string };
  /** NestJS logger levels. Default: ['error', 'warn', 'log', 'debug'] */
  logLevels?: ('error' | 'warn' | 'log' | 'debug' | 'verbose')[];
  /** Callback after bootstrap completes */
  onBootstrap?: (app: ReturnType<typeof NestFactory.create> extends Promise<infer T> ? T : never, port: number) => Promise<void> | void;
}

/**
 * Bootstrap a NestJS subgraph application.
 */
export async function bootstrap(
  appModule: Type,
  appName: string,
  options: BootstrapOptions = {},
): Promise<void> {
  const {
    port: configuredPort,
    portRange = [4000, 5000],
    httpsOptions,
    logLevels = ['error', 'warn', 'log', 'debug'],
    onBootstrap,
  } = options;

  const app = await NestFactory.create(appModule, {
    logger: logLevels,
    ...(httpsOptions ? { httpsOptions } : {}),
  });
  app.enableShutdownHooks();

  let port: number;
  if (configuredPort !== undefined) {
    await app.listen(configuredPort);
    port = configuredPort;
  } else {
    port = await findAndListenOnPort(app, portRange[0], portRange[1]);
  }

  const protocol = httpsOptions ? 'https' : 'http';
  Logger.log(
    `🚀 ${appName} is running on: ${protocol}://localhost:${port}/graphql`,
    'Bootstrap',
  );

  if (onBootstrap) {
    await onBootstrap(app, port);
  }
}
