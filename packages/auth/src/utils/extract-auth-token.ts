/**
 * Extracts the Bearer token from an Authorization header value.
 */
export function extractBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader) return null;
  const [type, token] = authorizationHeader.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}
