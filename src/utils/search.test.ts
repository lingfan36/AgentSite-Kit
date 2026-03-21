import { describe, it, expect } from 'vitest';
import { buildSearchIndex, queryIndex } from './search.js';
import type { ScannedPage } from '../types/page.js';

function makePage(overrides: Partial<ScannedPage>): ScannedPage {
  return {
    url: 'https://example.com',
    title: '',
    type: 'docs',
    contentHash: 'abc',
    summary: '',
    headings: [],
    scannedAt: new Date().toISOString(),
    wordCount: 100,
    ...overrides,
  };
}

const pages: ScannedPage[] = [
  makePage({ url: 'https://example.com/docs', title: 'Getting Started', summary: 'How to install the SDK', type: 'docs' }),
  makePage({ url: 'https://example.com/pricing', title: 'Pricing Plans', summary: 'Free and Pro tiers', type: 'pricing' }),
  makePage({ url: 'https://example.com/blog', title: 'Release Notes', summary: 'Latest updates and changelog', type: 'blog' }),
];

describe('buildSearchIndex', () => {
  it('builds an index from pages', () => {
    const index = buildSearchIndex(pages);
    expect(index.size).toBeGreaterThan(0);
  });

  it('indexes title words', () => {
    const index = buildSearchIndex(pages);
    expect(index.has('getting')).toBe(true);
    expect(index.has('pricing')).toBe(true);
  });

  it('indexes summary words', () => {
    const index = buildSearchIndex(pages);
    expect(index.has('install')).toBe(true);
  });

  it('indexes page type', () => {
    const index = buildSearchIndex(pages);
    expect(index.has('docs')).toBe(true);
  });

  it('returns empty index for empty pages', () => {
    const index = buildSearchIndex([]);
    expect(index.size).toBe(0);
  });
});

describe('queryIndex', () => {
  const index = buildSearchIndex(pages);

  it('returns matching page indices', () => {
    const results = queryIndex(index, 'pricing', 10);
    expect(results).toContain(1); // pricing page is index 1
  });

  it('returns empty array for no match', () => {
    const results = queryIndex(index, 'zzznomatch', 10);
    expect(results).toHaveLength(0);
  });

  it('respects limit', () => {
    const results = queryIndex(index, 'the', 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('returns empty array for empty query', () => {
    const results = queryIndex(index, '', 10);
    expect(results).toHaveLength(0);
  });

  it('ranks more relevant pages higher', () => {
    // 'install' only in docs page summary
    const results = queryIndex(index, 'install sdk', 10);
    expect(results[0]).toBe(0); // docs page
  });
});
