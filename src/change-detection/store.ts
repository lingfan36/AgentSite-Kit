import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export type HashStore = Record<string, string>;

export function loadHashes(path: string): HashStore {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function saveHashes(path: string, hashes: HashStore): void {
  writeFileSync(path, JSON.stringify(hashes, null, 2), 'utf-8');
}

export interface ChangeReport {
  changed: string[];
  deleted: string[];
}

export function findChangedUrls(oldHashes: HashStore, newHashes: HashStore): ChangeReport {
  const changed: string[] = [];
  for (const [url, hash] of Object.entries(newHashes)) {
    if (oldHashes[url] !== hash) changed.push(url);
  }
  const deleted = Object.keys(oldHashes).filter((url) => !(url in newHashes));
  return { changed, deleted };
}
