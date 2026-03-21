import type { ScanResult } from '../types/page.js';

interface AgentSitemapEntry {
  url: string;
  title: string;
  type: string;
  summary: string;
  lastModified?: string;
  wordCount: number;
}

export function generateLlmsTxt(scanResult: ScanResult, siteName: string, siteDescription: string): string {
  const lines: string[] = [];
  lines.push(`# ${siteName}`);
  lines.push(`> ${siteDescription}`);
  lines.push('');

  const grouped = new Map<string, typeof scanResult.pages>();
  for (const page of scanResult.pages) {
    const group = grouped.get(page.type) ?? [];
    group.push(page);
    grouped.set(page.type, group);
  }

  const sectionOrder = ['docs', 'faq', 'product', 'blog', 'pricing', 'about', 'contact', 'homepage', 'unknown'];
  const sectionLabels: Record<string, string> = {
    docs: 'Docs',
    faq: 'FAQ',
    product: 'Products',
    blog: 'Articles',
    pricing: 'Pricing',
    about: 'About',
    contact: 'Contact',
    homepage: 'Home',
    unknown: 'Other',
  };

  for (const type of sectionOrder) {
    const pages = grouped.get(type);
    if (!pages?.length) continue;

    lines.push(`## ${sectionLabels[type] ?? type}`);
    for (const page of pages) {
      const summary = page.summary ? `: ${page.summary}` : '';
      lines.push(`- [${page.title || page.url}](${page.url})${summary}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function generateAgentSitemap(scanResult: ScanResult): object {
  const entries: AgentSitemapEntry[] = scanResult.pages.map((p) => ({
    url: p.url,
    title: p.title,
    type: p.type,
    summary: p.summary,
    lastModified: p.lastModified,
    wordCount: p.wordCount,
  }));

  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    siteUrl: scanResult.siteUrl,
    totalPages: entries.length,
    pages: entries,
  };
}

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
