import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { ValidatedConfig } from '../config/schema.js';
import type { NormalizedConfig } from '../config/loader.js';
import type { ScannedPage } from '../types/page.js';
import { isPageAllowed } from '../utils/access-control.js';
import { dashboardHtml } from '../web/dashboard.js';
import { AccessLogger } from './access-log.js';
import { registerSearchRoute } from './routes/search.js';
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

export async function createApp(config: ValidatedConfig | NormalizedConfig, data: ServerData) {
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

  // Static file routes for agents and crawlers
  const { readFileSync: readFs, existsSync: existsFs } = await import('node:fs');
  const outDir = config.output.dir;

  app.get('/llms.txt', async (req, reply) => {
    const p = `${outDir}/llms.txt`;
    if (existsFs(p)) {
      reply.type('text/plain').send(readFs(p, 'utf-8'));
    } else {
      reply.code(404).send('Not generated yet. Run scan + generate first.');
    }
  });

  app.get('/agent-sitemap.json', async (req, reply) => {
    const p = `${outDir}/agent-sitemap.json`;
    if (existsFs(p)) {
      reply.type('application/json').send(readFs(p, 'utf-8'));
    } else {
      reply.code(404).send({ error: 'Not generated yet' });
    }
  });

  app.get('/agent-index.json', async (req, reply) => {
    const p = `${outDir}/agent-index.json`;
    if (existsFs(p)) {
      reply.type('application/json').send(readFs(p, 'utf-8'));
    } else {
      reply.code(404).send({ error: 'Not generated yet' });
    }
  });

  app.get('/.well-known/ai-plugin.json', async () => {
    return {
      schema_version: 'v1',
      name_for_human: config.site.name,
      name_for_model: config.site.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      description_for_human: config.site.description,
      description_for_model: `Access structured content from ${config.site.name}. Search pages, browse docs, FAQ, products, articles, pricing, and changelog via REST API.`,
      auth: { type: 'none' },
      api: {
        type: 'openapi',
        url: '/api/config',
      },
      logo_url: '',
      contact_email: '',
      legal_info_url: '',
    };
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
  registerContentRoutes(app, filteredData, config);

  // Operation endpoints (rescan / regenerate)
  app.post<{ Body: { url?: string } }>('/api/rescan', async (req) => {
    try {
      const targetUrl = req.body?.url;
      const { runScan } = await import('../commands/scan.js');

      if (targetUrl) {
        // Scan a specific URL on-the-fly (not necessarily in config)
        const { loadConfig: loadCfg } = await import('../config/loader.js');
        const currentConfig = loadCfg();
        const adhocConfig = {
          ...currentConfig,
          site: { url: targetUrl, name: 'adhoc-scan', description: '' },
          output: { ...currentConfig.output, dir: `.agentsite-adhoc` },
        };
        const result = await runScan(adhocConfig);
        return { ok: true, message: `Scan complete for ${targetUrl}. ${result.totalPages} pages scanned.`, totalPages: result.totalPages };
      }

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

  // Webhook endpoint — triggers incremental update
  // Body: { secret: string, urls?: string[] }
  // Set AGENTSITE_WEBHOOK_SECRET env var to enable
  app.post<{ Body: { secret?: string; urls?: string[] } }>('/api/webhook', async (req, reply) => {
    const expectedSecret = process.env.AGENTSITE_WEBHOOK_SECRET;
    if (!expectedSecret) {
      reply.code(501);
      return { ok: false, error: 'Webhook not configured. Set AGENTSITE_WEBHOOK_SECRET env var.' };
    }
    if (req.body?.secret !== expectedSecret) {
      reply.code(401);
      return { ok: false, error: 'Invalid webhook secret.' };
    }
    // Fire-and-forget async update
    setImmediate(async () => {
      try {
        const { runScan } = await import('../commands/scan.js');
        const { runGenerate } = await import('../commands/generate.js');
        await runScan();
        await runGenerate();
      } catch { /* errors logged inside commands */ }
    });
    return { ok: true, message: 'Update triggered.' };
  });

  return app;
}

export type SearchIndex = Map<string, Set<number>>;
