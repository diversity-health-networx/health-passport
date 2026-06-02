export interface AuthClientInfo {
  user?: string;
  role?: 'admin';
  key?: CryptoKey;
  nonce?: string;
}
