import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  it('should be instantiable', () => {
    const guard = new RolesGuard(new Reflector());
    expect(guard).toBeDefined();
  });

  it('should match roles correctly', () => {
    const guard = new RolesGuard(new Reflector());
    // Access protected method for testing
    const matchRoles = (guard as any).matchRoles.bind(guard);

    expect(matchRoles(['admin'], { roles: ['admin', 'user'] })).toBe(true);
    expect(matchRoles(['admin'], { roles: ['user'] })).toBe(false);
    expect(matchRoles(['admin', 'moderator'], { roles: ['moderator'] })).toBe(
      true,
    );
  });
});
