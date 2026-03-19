import type { ScanResult } from '../types/page.js';

export function generateAgentIndex(scanResult: ScanResult, siteName: string, siteDescription: string): object {
  const typeGroups: Record<string, number> = {};
  for (const p of scanResult.pages) {
    typeGroups[p.type] = (typeGroups[p.type] ?? 0) + 1;
  }

  const endpoints: Record<string, string> = {
    search: '/api/search?q={query}',
    pages: '/api/pages/{id}',
    faq: '/api/faq',
    products: '/api/products',
    docs: '/api/docs',
    articles: '/api/articles',
    pricing: '/api/pricing',
    changelog: '/api/changelog',
    stats: '/api/stats',
    config: '/api/config',
  };

  return {
    version: '1.0',
    site: {
      name: siteName,
      description: siteDescription,
      url: scanResult.siteUrl,
    },
    stats: {
      totalPages: scanResult.totalPages,
      scannedAt: scanResult.scannedAt,
      pageTypes: typeGroups,
    },
    endpoints,
    files: {
      'llms.txt': 'LLM-friendly site overview',
      'agent-sitemap.json': 'Machine-readable sitemap with metadata',
      'data/docs.json': 'Documentation entries',
      'data/faq.json': 'FAQ entries',
      'data/articles.json': 'Blog/article entries',
      'data/products.json': 'Product entries',
      'data/pricing.json': 'Pricing/plan entries',
      'data/changelog.json': 'Changelog/release entries',
    },
  };
}
