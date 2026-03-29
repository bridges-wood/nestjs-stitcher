/**
 * Generate a test JWT for the demo.
 *
 * Usage:
 *   pnpm run generate-token
 *   pnpm run generate-token -- --sub user-1 --roles admin,editor
 */
import { SignJWT } from 'jose';
import { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } from '../src/shared/constants';

async function main() {
  const args = process.argv.slice(2);
  const sub = getArg(args, '--sub') ?? '1';
  const roles = (getArg(args, '--roles') ?? 'user').split(',');

  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new SignJWT({ sub, roles })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  console.log('\n🔑 Generated JWT (valid for 1 hour):\n');
  console.log(token);
  console.log('\n📋 Payload:');
  console.log(JSON.stringify({ sub, roles }, null, 2));
  console.log('\n💡 Usage:');
  console.log(
    `  curl http://localhost:4000/graphql \\`,
  );
  console.log(
    `    -H "Content-Type: application/json" \\`,
  );
  console.log(
    `    -H "Authorization: Bearer ${token}" \\`,
  );
  console.log(
    `    -d '{"query":"{ users { id name } }"}'`,
  );
}

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

main();
