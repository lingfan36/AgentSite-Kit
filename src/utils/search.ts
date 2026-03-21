import type { ScannedPage } from '../types/page.js';

export function buildSearchIndex(pages: ScannedPage[]): Map<string, Set<number>> {
  const index = new Map<string, Set<number>>();
  pages.forEach((page, i) => {
    const text = `${page.title} ${page.summary} ${page.type}`.toLowerCase();
    const words = text.split(/\W+/).filter((w) => w.length > 2);
    for (const word of words) {
      if (!index.has(word)) index.set(word, new Set());
      index.get(word)!.add(i);
    }
  });
  return index;
}

export function queryIndex(
  searchIndex: Map<string, Set<number>>,
  query: string,
  limit: number,
): number[] {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const scoreMap = new Map<number, number>();
  for (const word of words) {
    const matches = searchIndex.get(word);
    if (matches) {
      for (const idx of matches) {
        scoreMap.set(idx, (scoreMap.get(idx) ?? 0) + 1);
      }
    }
  }
  return [...scoreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([idx]) => idx);
}
