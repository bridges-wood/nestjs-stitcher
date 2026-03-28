import { Injectable } from '@nestjs/common';
import type { JWTPayload } from 'jose';

@Injectable()
export abstract class JwtVerifier {
  abstract verify(token: string): Promise<JWTPayload & { roles?: string[] }>;
}
