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
