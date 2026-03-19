import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export type HashStore = Record<string, string>;

export function loadHashes(path: string): HashStore {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function saveHashes(path: string, hashes: HashStore): void {
  writeFileSync(path, JSON.stringify(hashes, null, 2), 'utf-8');
}

export function findChangedUrls(oldHashes: HashStore, newHashes: HashStore): string[] {
  const changed: string[] = [];
  for (const [url, hash] of Object.entries(newHashes)) {
    if (oldHashes[url] !== hash) changed.push(url);
  }
  return changed;
}
