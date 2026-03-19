import { sha256 } from '../utils/hash.js';

export function computeHash(content: string): string {
  return sha256(content);
}
