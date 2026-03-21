import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { ValidatedConfig } from '../config/schema.js';
import type { ScannedPage } from '../types/page.js';
import { isPageAllowed } from '../utils/access-control.js';
import { dashboardHtml } from '../web/dashboard.js';
import { AccessLogger } from './access-log.js';
import { registerSearchRoute } from './routes/search.js';
import { registerPagesRoute } from './routes/pages.js';
import { registerContentRoutes } from './routes/content-routes.js';
import { buildSearchIndex } from '../utils/search.js';

export interface ServerData {
  docs: unknown[];
  faq: unknown[];
  products: unknown[];
  articles: unknown[];
  pricing: unknown[];
  changelog: unknown[];
  pages: ScannedPage[];
}

export async function createApp(config: ValidatedConfig, data: ServerData) {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });
  await app.register(rateLimit, {
    max: config.server.rateLimit.max,
    timeWindow: config.server.rateLimit.timeWindow,
  });

  // Access logging
  let accessLogger: AccessLogger | undefined;
  if (config.server.accessLog) {
    accessLogger = new AccessLogger(config.output.dir);
    accessLogger.register(app);
  }

  // Filter pages based on access control rules
  const filteredPages = data.pages.filter(page => isPageAllowed(page, config));
  const filteredData = { ...data, pages: filteredPages };

  // Build simple inverted index for search
  const searchIndex = buildSearchIndex(filteredData.pages);

  app.get('/api/health', async () => ({ ok: true }));

  // Access log endpoint
  app.get('/api/access-log', async (req) => {
    if (!accessLogger) return { entries: [], message: 'Access logging is disabled' };
    const query = req.query as Record<string, string>;
    const limit = parseInt(query.limit, 10) || 100;
    return { entries: accessLogger.getRecent(limit) };
  });

  // Stats endpoint
  app.get('/api/stats', async () => {
    const typeCounts: Record<string, number> = {};
    let totalWords = 0;
    for (const p of filteredData.pages) {
      typeCounts[p.type] = (typeCounts[p.type] ?? 0) + 1;
      totalWords += p.wordCount;
    }
    return {
      totalPages: filteredData.pages.length,
      totalWords,
      pageTypes: typeCounts,
      dataFiles: {
        docs: filteredData.docs.length,
        faq: filteredData.faq.length,
        products: filteredData.products.length,
        articles: filteredData.articles.length,
        pricing: filteredData.pricing.length,
        changelog: filteredData.changelog.length,
      },
    };
  });

  // Config endpoint (sanitized)
  app.get('/api/config', async () => {
    const sanitized = {
      site: config.site,
      scan: config.scan,
      output: config.output,
      server: { port: config.server.port, rateLimit: config.server.rateLimit, accessLog: config.server.accessLog },
      access: config.access,
      llm: config.llm ? { apiUrl: config.llm.apiUrl, model: config.llm.model, apiKey: '***' } : undefined,
    };
    return sanitized;
  });

  // Files endpoint
  app.get('/api/files', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    const outDir = config.output.dir;
    const files: { name: string; size: number; content?: string }[] = [];

    const textFiles = ['llms.txt'];
    const jsonFiles = ['agent-sitemap.json', 'agent-index.json', 'data/docs.json', 'data/faq.json', 'data/products.json', 'data/articles.json', 'data/pricing.json', 'data/changelog.json'];

    for (const f of textFiles) {
      const p = `${outDir}/${f}`;
      if (existsSync(p)) {
        const content = readFileSync(p, 'utf-8');
        files.push({ name: f, size: content.length, content });
      }
    }
    for (const f of jsonFiles) {
      const p = `${outDir}/${f}`;
      if (existsSync(p)) {
        const content = readFileSync(p, 'utf-8');
        files.push({ name: f, size: content.length, content });
      }
    }

    return { files };
  });

  // Web dashboard
  app.get('/', async (req, reply) => {
    reply.type('text/html').send(dashboardHtml);
  });

  app.get('/api/pages-data', async () => {
    return {
      siteUrl: filteredData.pages[0]?.url.split('/').slice(0, 3).join('/') || '',
      scannedAt: filteredData.pages[0]?.scannedAt || new Date().toISOString(),
      totalPages: filteredData.pages.length,
      pages: filteredData.pages,
    };
  });

  if (config.access.allowSearch) {
    registerSearchRoute(app, filteredData, searchIndex);
  }
  registerPagesRoute(app, filteredData, config);
  registerContentRoutes(app, filteredData);

  // Operation endpoints (rescan / regenerate)
  app.post('/api/rescan', async () => {
    try {
      const { runScan } = await import('../commands/scan.js');
      const result = await runScan();
      return { ok: true, message: `Rescan complete. ${result.totalPages} pages scanned.` };
    } catch (err) {
      return { ok: false, message: (err as Error).message };
    }
  });

  app.post('/api/regenerate', async () => {
    try {
      const { runGenerate } = await import('../commands/generate.js');
      await runGenerate();
      return { ok: true, message: 'Regeneration complete.' };
    } catch (err) {
      return { ok: false, message: (err as Error).message };
    }
  });

  return app;
}

export type SearchIndex = Map<string, Set<number>>;
