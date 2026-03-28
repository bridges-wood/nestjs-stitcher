import { type INestApplication, Logger } from '@nestjs/common';

/**
 * Finds an available port in the given range by random sampling and binds the app.
 */
export async function findAndListenOnPort(
  app: INestApplication,
  start: number,
  end: number,
): Promise<number> {
  const candidatePorts = new Set<number>();
  for (let i = start; i <= end; i++) {
    candidatePorts.add(i);
  }

  while (candidatePorts.size > 0) {
    const ports = Array.from(candidatePorts);
    const port = ports[Math.floor(Math.random() * ports.length)];
    try {
      await app.listen(port);
      return port;
    } catch {
      Logger.debug(
        `Port ${port} is in use, trying next port...`,
        'findAndListenOnPort',
      );
      candidatePorts.delete(port);
    }
  }

  throw new Error(`No available ports in range ${start}-${end}`);
}
