import type { FastifyInstance } from 'fastify';
import { toSlug, addSiteToConfig, removeSiteFromConfig, loadConfig, type NormalizedConfig } from '../../config/loader.js';
import { loadSiteData } from '../../utils/data-loader.js';
import type { ServerData } from '../app.js';

interface AddSiteBody {
  url: string;
  name: string;
  description?: string;
}

interface SlugParams {
  slug: string;
}

export function registerSiteRoutes(
  app: FastifyInstance,
  getConfig: () => NormalizedConfig,
  setConfig: (c: NormalizedConfig) => void,
) {
  // POST /api/sites — add a new site
  app.post<{ Body: AddSiteBody }>('/api/sites', async (req, reply) => {
    const { url, name, description } = req.body ?? {};
    if (!url || !name) {
      reply.code(400);
      return { ok: false, error: 'Missing required fields: url, name' };
    }

    try {
      new URL(url); // validate URL
    } catch {
      reply.code(400);
      return { ok: false, error: 'Invalid url' };
    }

    try {
      const updated = addSiteToConfig({ url, name, description });
      setConfig(updated);

      const slug = toSlug(name);
      return {
        ok: true,
        site: { slug, name, url, description: description ?? '' },
        message: `Site "${name}" added. Use POST /api/sites/${slug}/scan to scan it.`,
      };
    } catch (err) {
      reply.code(409);
      return { ok: false, error: (err as Error).message };
    }
  });

  // DELETE /api/sites/:slug — remove a site
  app.delete<{ Params: SlugParams }>('/api/sites/:slug', async (req, reply) => {
    const { slug } = req.params;

    try {
      const updated = removeSiteFromConfig(slug);
      setConfig(updated);
      return { ok: true, message: `Site "${slug}" removed.` };
    } catch (err) {
      const msg = (err as Error).message;
      reply.code(msg.includes('not found') ? 404 : 400);
      return { ok: false, error: msg };
    }
  });

  // POST /api/sites/:slug/scan — trigger scan for a specific site
  app.post<{ Params: SlugParams }>('/api/sites/:slug/scan', async (req, reply) => {
    const { slug } = req.params;
    const config = getConfig();
    const siteEntry = config.resolvedSites.find(s => toSlug(s.site.name) === slug);

    if (!siteEntry) {
      reply.code(404);
      return { ok: false, error: `Site "${slug}" not found` };
    }

    try {
      // Build a per-site config by merging the site entry with server-level settings
      const siteConfig: NormalizedConfig = {
        ...config,
        site: siteEntry.site,
        scan: siteEntry.scan,
        output: siteEntry.output,
        access: siteEntry.access,
      };

      const { runScan } = await import('../../commands/scan.js');
      const { runGenerate } = await import('../../commands/generate.js');

      const result = await runScan(siteConfig);
      await runGenerate(siteConfig);

      return {
        ok: true,
        message: `Scan complete for "${siteEntry.site.name}". ${result.totalPages} pages scanned.`,
        totalPages: result.totalPages,
      };
    } catch (err) {
      reply.code(500);
      return { ok: false, error: (err as Error).message };
    }
  });
}
