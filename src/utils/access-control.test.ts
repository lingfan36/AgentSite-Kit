import { describe, it, expect } from 'vitest';
import { isPageAllowed, filterPageContent } from './access-control.js';
import type { ScannedPage } from '../types/page.js';
import type { ValidatedConfig } from '../config/schema.js';

function makePage(overrides: Partial<ScannedPage>): ScannedPage {
  return {
    url: 'https://example.com/docs/intro',
    title: 'Introduction',
    type: 'docs',
    contentHash: 'abc',
    summary: 'Intro page',
    headings: ['Introduction'],
    scannedAt: new Date().toISOString(),
    wordCount: 200,
    ...overrides,
  };
}

function makeConfig(overrides: Partial<ValidatedConfig['access']> = {}): ValidatedConfig {
  return {
    site: { url: 'https://example.com', name: 'Test', description: '' },
    scan: { maxPages: 100, concurrency: 3, delayMs: 0, include: ['**'], exclude: [], respectRobotsTxt: false },
    output: { dir: '.agentsite', formats: ['llms-txt', 'agent-sitemap', 'agent-index', 'structured'] },
    server: { port: 3141, rateLimit: { max: 60, timeWindow: '1 minute' }, accessLog: false },
    access: {
      allowedPages: ['**'],
      blockedPages: [],
      allowedTypes: ['docs', 'faq', 'blog', 'product', 'pricing', 'about', 'contact', 'changelog'],
      summaryOnly: false,
      allowSearch: true,
      ...overrides,
    },
    plugins: [],
    resolvedSites: [],
  } as unknown as ValidatedConfig;
}

describe('isPageAllowed', () => {
  it('allows pages matching allowedPages', () => {
    const config = makeConfig({ allowedPages: ['**'] });
    expect(isPageAllowed(makePage({}), config)).toBe(true);
  });

  it('blocks pages matching blockedPages', () => {
    const config = makeConfig({ blockedPages: ['**/admin/**'] });
    expect(isPageAllowed(makePage({ url: 'https://example.com/admin/settings' }), config)).toBe(false);
  });

  it('blocked patterns take priority over allowed', () => {
    const config = makeConfig({ allowedPages: ['**'], blockedPages: ['**/docs/**'] });
    expect(isPageAllowed(makePage({ url: 'https://example.com/docs/intro' }), config)).toBe(false);
  });

  it('blocks pages not in allowedTypes', () => {
    const config = makeConfig({ allowedTypes: ['blog', 'product'] });
    expect(isPageAllowed(makePage({ type: 'docs' }), config)).toBe(false);
  });

  it('allows pages in allowedTypes', () => {
    const config = makeConfig({ allowedTypes: ['docs', 'blog'] });
    expect(isPageAllowed(makePage({ type: 'blog' }), config)).toBe(true);
  });

  it('blocks pages not matching allowedPages pattern', () => {
    const config = makeConfig({ allowedPages: ['**/docs/**'] });
    expect(isPageAllowed(makePage({ url: 'https://example.com/blog/post' }), config)).toBe(false);
  });
});

describe('filterPageContent', () => {
  it('returns full page when summaryOnly is false', () => {
    const config = makeConfig({ summaryOnly: false });
    const page = makePage({});
    expect(filterPageContent(page, config)).toBe(page);
  });

  it('returns only summary fields when summaryOnly is true', () => {
    const config = makeConfig({ summaryOnly: true });
    const page = makePage({});
    const result = filterPageContent(page, config);
    expect(result.url).toBe(page.url);
    expect(result.title).toBe(page.title);
    expect(result.summary).toBe(page.summary);
    expect((result as ScannedPage).headings).toBeUndefined();
    expect((result as ScannedPage).contentHash).toBeUndefined();
  });
});
