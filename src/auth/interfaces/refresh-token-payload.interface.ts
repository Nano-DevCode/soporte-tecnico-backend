export interface RefreshTokenPayload {
  sub: string; // User ID
  jti: string; // Unique Token ID for rotation tracking & revocation
}
