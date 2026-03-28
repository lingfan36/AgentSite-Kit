import { Command } from 'commander';
import { loadConfig, toSlug, type NormalizedConfig } from '../config/loader.js';
import { createApp, type ServerData } from '../server/app.js';
import { registerSiteRoutes } from '../server/routes/site-routes.js';
import { log } from '../utils/logger.js';
import { loadSiteData } from '../utils/data-loader.js';

export function registerServeCommand(program: Command) {
  program
    .command('serve')
    .description('Start the Agent-friendly API server')
    .option('-p, --port <port>', 'Port number')
    .action(async (opts) => {
      let config = loadConfig();
      const outDir = config.output.dir;

      // Load primary site data (allow empty data so server can still boot)
      const primary = loadSiteData(outDir);
      const data: ServerData = primary
        ? { pages: primary.scanResult.pages, docs: primary.docs, faq: primary.faq, products: primary.products, articles: primary.articles, pricing: primary.pricing, changelog: primary.changelog }
        : { pages: [], docs: [], faq: [], products: [], articles: [], pricing: [], changelog: [] };
      if (!primary) {
        log.warn('No scan data found. Server starting with empty data.');
        log.warn('Use the Dashboard Operations panel or run `agentsite scan && agentsite generate` to populate.');
      }

      const port = parseInt(opts.port, 10) || config.server.port;
      const app = await createApp(config, data);

      // Register site management routes (POST /api/sites, DELETE /api/sites/:slug, POST /api/sites/:slug/scan)
      registerSiteRoutes(
        app,
        () => config,
        (c) => { config = c; },
      );

      // Multi-site: register additional site routes
      if (config.resolvedSites.length > 1) {
        for (const siteEntry of config.resolvedSites) {
          const slug = toSlug(siteEntry.site.name);
          const siteOutDir = siteEntry.output.dir;
          const siteData = loadSiteData(siteOutDir);
          if (siteData) {
            // Register site-prefixed API endpoints
            app.get(`/api/${slug}/pages-data`, async () => ({
              siteUrl: siteData.scanResult.siteUrl,
              scannedAt: siteData.scanResult.scannedAt,
              totalPages: siteData.scanResult.totalPages,
              pages: siteData.scanResult.pages,
            }));
            app.get(`/api/${slug}/search`, async (req) => {
              const query = req.query as Record<string, string>;
              return { site: slug, query: query.q, results: [] };
            });
            app.get(`/api/${slug}/docs`, async () => siteData.docs);
            app.get(`/api/${slug}/faq`, async () => siteData.faq);
            app.get(`/api/${slug}/products`, async () => siteData.products);
            app.get(`/api/${slug}/articles`, async () => siteData.articles);
            app.get(`/api/${slug}/pricing`, async () => siteData.pricing);
            app.get(`/api/${slug}/changelog`, async () => siteData.changelog);
          }
        }
      }

      // Sites list endpoint
      app.get('/api/sites', async () => {
        return {
          sites: config.resolvedSites.map((s) => ({
            name: s.site.name,
            slug: toSlug(s.site.name),
            url: s.site.url,
            description: s.site.description,
            outDir: s.output.dir,
          })),
        };
      });

      await app.listen({ port, host: '0.0.0.0' });
      log.success(`API server running at http://localhost:${port}`);
      log.info('Endpoints:');
      console.log('  GET  /api/health');
      console.log('  GET  /api/search?q=keyword');
      console.log('  GET  /api/pages/:id');
      console.log('  GET  /api/faq');
      console.log('  GET  /api/products');
      console.log('  GET  /api/docs');
      console.log('  GET  /api/articles');
      console.log('  GET  /api/pricing');
      console.log('  GET  /api/changelog');
      console.log('  GET  /api/stats');
      console.log('  GET  /api/config');
      console.log('  GET  /api/files');
      console.log('  GET  /api/access-log');
      console.log('  GET  /api/sites');
      console.log('  POST /api/sites          (add site)');
      console.log('  DELETE /api/sites/:slug   (remove site)');
      console.log('  POST /api/sites/:slug/scan (scan site)');
      console.log('  POST /api/rescan         (rescan all, or {url} for ad-hoc)');
      if (config.resolvedSites.length > 1) {
        for (const s of config.resolvedSites) {
          console.log(`  GET  /api/${toSlug(s.site.name)}/* (multi-site)`);
        }
      }
    });
}
