import { describe, expect, it, vi } from 'vitest';
import { findAndListenOnPort } from './find-port.js';

describe('findAndListenOnPort', () => {
  it('should find an available port', async () => {
    const mockApp = {
      listen: vi.fn().mockResolvedValue(undefined),
    } as any;

    const port = await findAndListenOnPort(mockApp, 4000, 4005);
    expect(port).toBeGreaterThanOrEqual(4000);
    expect(port).toBeLessThanOrEqual(4005);
    expect(mockApp.listen).toHaveBeenCalledWith(port);
  });

  it('should throw if no ports available', async () => {
    const mockApp = {
      listen: vi.fn().mockRejectedValue(new Error('EADDRINUSE')),
    } as any;

    await expect(findAndListenOnPort(mockApp, 4000, 4002)).rejects.toThrow(
      'No available ports in range 4000-4002',
    );
  });
});
