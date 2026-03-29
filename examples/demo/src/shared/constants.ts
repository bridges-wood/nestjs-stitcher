/**
 * Shared constants for the demo. In production, use environment variables.
 */

// Symmetric secret for JWT signing/verification (local strategy)
export const JWT_SECRET = 'demo-jwt-secret-not-for-production-use!';

// Shared HMAC secret for gateway ↔ subgraph trust (must be ≥32 chars)
export const HMAC_SECRET =
  'demo-hmac-secret-must-be-at-least-32-chars!!';

export const GATEWAY_PORT = 4000;
export const USERS_SERVICE_PORT = 4001;
export const POSTS_SERVICE_PORT = 4002;

export const JWT_ISSUER = 'nestjs-stitcher-demo';
export const JWT_AUDIENCE = 'demo-api';
