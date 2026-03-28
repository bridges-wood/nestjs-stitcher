export type GetSigningKeyFunction = (kid?: string) => Promise<string>;

export abstract class SigningKeyProvider {
  abstract build(): GetSigningKeyFunction;
}
