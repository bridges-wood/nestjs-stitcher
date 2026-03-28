export interface StitcherUser {
  id: string;
  roles: string[];
}

export interface TrustedRequestExtensions extends Record<string, unknown> {
  trusted: true;
  sub: string;
  roles: string[];
  'hmac-signature'?: string;
}
