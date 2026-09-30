import * as crypto from 'crypto';

export function generateTempPassword(length = 12): string {
  return crypto
    .randomBytes(length)
    .toString('base64')
    .slice(0, length)
    .replace(/\+/g, 'A')
    .replace(/\//g, 'b');
}
