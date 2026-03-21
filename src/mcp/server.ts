import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync, existsSync } from 'node:fs';
import type { ScanResult } from '../types/page.js';
import type { DocEntry, FaqEntry, ProductEntry, ArticleEntry, PricingEntry, ChangelogEntry } from '../types/content.js';
import { buildSearchIndex } from '../utils/search.js';

interface McpData {
  scanResult: ScanResult;
  docs: DocEntry[];
  faq: FaqEntry[];
  products: ProductEntry[];
  articles: ArticleEntry[];
  pricing: PricingEntry[];
  changelog: ChangelogEntry[];
}

function loadData(outDir: string): McpData {
  const loadJson = <T>(path: string): T[] => {
    if (!existsSync(path)) return [];
    return JSON.parse(readFileSync(path, 'utf-8'));
  };

  const scanResult: ScanResult = JSON.parse(readFileSync(`${outDir}/scan-result.json`, 'utf-8'));

  return {
    scanResult,
    docs: loadJson<DocEntry>(`${outDir}/data/docs.json`),
    faq: loadJson<FaqEntry>(`${outDir}/data/faq.json`),
    products: loadJson<ProductEntry>(`${outDir}/data/products.json`),
    articles: loadJson<ArticleEntry>(`${outDir}/data/articles.json`),
    pricing: loadJson<PricingEntry>(`${outDir}/data/pricing.json`),
    changelog: loadJson<ChangelogEntry>(`${outDir}/data/changelog.json`),
  };
}

function registerTools(server: McpServer, data: McpData, searchIndex: Map<string, Set<number>>, outDir: string) {
  server.tool(
    'search',
    'Search site content by keyword',
    { query: z.string().describe('Search keyword'), limit: z.number().optional().describe('Max results (default 10)') },
    async ({ query, limit }) => {
      const max = limit ?? 10;
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

      const sorted = [...scoreMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, max)
        .map(([idx]) => {
          const p = data.scanResult.pages[idx];
          return { url: p.url, title: p.title, type: p.type, summary: p.summary };
        });

      return { content: [{ type: 'text' as const, text: JSON.stringify(sorted, null, 2) }] };
    },
  );

  server.tool(
    'get_page',
    'Get detailed info about a specific page by URL',
    { url: z.string().describe('Page URL') },
    async ({ url }) => {
      const page = data.scanResult.pages.find((p) => p.url === url);
      if (!page) {
        return { content: [{ type: 'text' as const, text: 'Page not found' }] };
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(page, null, 2) }] };
    },
  );

  server.tool(
    'list_pages',
    'List all pages with optional type filter',
    { type: z.string().optional().describe('Filter by page type: docs, faq, blog, product, pricing, about, contact, changelog') },
    async ({ type }) => {
      let pages = data.scanResult.pages;
      if (type) {
        pages = pages.filter((p) => p.type === type);
      }
      const summary = pages.map((p) => ({ url: p.url, title: p.title, type: p.type }));
      return { content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }] };
    },
  );

  server.tool(
    'list_faq',
    'List FAQ entries with optional category filter',
    { category: z.string().optional().describe('Filter by category') },
    async ({ category }) => {
      let items = data.faq;
      if (category) {
        items = items.filter((f) => f.category.toLowerCase() === category.toLowerCase());
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(items, null, 2) }] };
    },
  );

  server.tool(
    'list_docs',
    'List documentation entries with optional section filter',
    { section: z.string().optional().describe('Filter by section') },
    async ({ section }) => {
      let items = data.docs;
      if (section) {
        items = items.filter((d) => d.section.toLowerCase() === section.toLowerCase());
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(items, null, 2) }] };
    },
  );

  server.tool(
    'list_products',
    'List all product entries',
    {},
    async () => {
      return { content: [{ type: 'text' as const, text: JSON.stringify(data.products, null, 2) }] };
    },
  );

  server.tool(
    'list_articles',
    'List blog/article entries with optional tag filter',
    { tag: z.string().optional().describe('Filter by tag') },
    async ({ tag }) => {
      let items = data.articles;
      if (tag) {
        items = items.filter((a) => a.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(items, null, 2) }] };
    },
  );

  server.tool(
    'list_pricing',
    'List pricing/plan entries',
    {},
    async () => {
      return { content: [{ type: 'text' as const, text: JSON.stringify(data.pricing, null, 2) }] };
    },
  );

  server.tool(
    'list_changelog',
    'List changelog/release entries',
    { version: z.string().optional().describe('Filter by version') },
    async ({ version }) => {
      let items = data.changelog;
      if (version) {
        items = items.filter((c) => c.version.toLowerCase().includes(version.toLowerCase()));
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(items, null, 2) }] };
    },
  );

  server.tool(
    'get_config',
    'Get site configuration summary (API keys hidden)',
    {},
    async () => {
      const configPath = `${outDir}/../agentsite.config.yaml`;
      let configSummary: unknown = { note: 'Config file not found at expected location' };
      if (existsSync(configPath)) {
        const yaml = await import('js-yaml');
        const raw = readFileSync(configPath, 'utf-8');
        const parsed = yaml.load(raw) as Record<string, unknown>;
        if (parsed.llm && typeof parsed.llm === 'object') {
          (parsed.llm as Record<string, unknown>).apiKey = '***';
        }
        configSummary = parsed;
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(configSummary, null, 2) }] };
    },
  );

  server.tool(
    'site_overview',
    'Get a high-level overview of the site: name, description, page counts by type',
    {},
    async () => {
      const typeCounts: Record<string, number> = {};
      for (const p of data.scanResult.pages) {
        typeCounts[p.type] = (typeCounts[p.type] ?? 0) + 1;
      }
      const overview = {
        totalPages: data.scanResult.totalPages,
        scannedAt: data.scanResult.scannedAt,
        pageTypes: typeCounts,
        dataFiles: {
          docs: data.docs.length,
          faq: data.faq.length,
          products: data.products.length,
          articles: data.articles.length,
          pricing: data.pricing.length,
          changelog: data.changelog.length,
        },
      };
      return { content: [{ type: 'text' as const, text: JSON.stringify(overview, null, 2) }] };
    },
  );
}

function registerResources(server: McpServer, outDir: string) {
  const llmsPath = `${outDir}/llms.txt`;
  if (existsSync(llmsPath)) {
    server.resource(
      'llms-txt',
      'file:///llms.txt',
      { description: 'LLM-friendly site overview in llms.txt format', mimeType: 'text/plain' },
      async () => ({
        contents: [{ uri: 'file:///llms.txt', text: readFileSync(llmsPath, 'utf-8'), mimeType: 'text/plain' }],
      }),
    );
  }

  const indexPath = `${outDir}/agent-index.json`;
  if (existsSync(indexPath)) {
    server.resource(
      'agent-index',
      'file:///agent-index.json',
      { description: 'Agent index with site metadata and API endpoints', mimeType: 'application/json' },
      async () => ({
        contents: [{ uri: 'file:///agent-index.json', text: readFileSync(indexPath, 'utf-8'), mimeType: 'application/json' }],
      }),
    );
  }

  const sitemapPath = `${outDir}/agent-sitemap.json`;
  if (existsSync(sitemapPath)) {
    server.resource(
      'agent-sitemap',
      'file:///agent-sitemap.json',
      { description: 'Machine-readable sitemap with page metadata', mimeType: 'application/json' },
      async () => ({
        contents: [{ uri: 'file:///agent-sitemap.json', text: readFileSync(sitemapPath, 'utf-8'), mimeType: 'application/json' }],
      }),
    );
  }

  const dataFiles = ['docs', 'faq', 'products', 'articles', 'pricing', 'changelog'];
  for (const name of dataFiles) {
    const dataPath = `${outDir}/data/${name}.json`;
    if (existsSync(dataPath)) {
      server.resource(
        `data-${name}`,
        `file:///data/${name}.json`,
        { description: `Structured ${name} data`, mimeType: 'application/json' },
        async () => ({
          contents: [{ uri: `file:///data/${name}.json`, text: readFileSync(dataPath, 'utf-8'), mimeType: 'application/json' }],
        }),
      );
    }
  }
}

export async function startMcpServer(outDir: string) {
  const data = loadData(outDir);
  const searchIndex = buildSearchIndex(data.scanResult.pages);

  const server = new McpServer({
    name: 'agentsite',
    version: '1.0.0',
  });

  registerTools(server, data, searchIndex, outDir);
  registerResources(server, outDir);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
