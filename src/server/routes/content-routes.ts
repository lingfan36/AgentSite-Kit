import type { FastifyInstance } from 'fastify';
import type { ServerData } from '../app.js';

export function registerContentRoutes(app: FastifyInstance, data: ServerData) {
  app.get('/api/pricing', async () => {
    return { ok: true, data: data.pricing };
  });

  app.get('/api/changelog', async () => {
    return { ok: true, data: data.changelog };
  });

  app.get<{ Querystring: { category?: string } }>('/api/faq', async (req) => {
    let items = data.faq as { category?: string }[];
    const category = req.query.category;
    if (category) {
      items = items.filter((f) => f.category?.toLowerCase() === category.toLowerCase());
    }
    return { ok: true, data: items, total: items.length };
  });

  app.get<{ Querystring: { section?: string } }>('/api/docs', async (req) => {
    let items = data.docs as { section?: string }[];
    const section = req.query.section;
    if (section) {
      items = items.filter((d) => d.section?.toLowerCase() === section.toLowerCase());
    }
    return { ok: true, data: items, total: items.length };
  });

  app.get('/api/products', async () => {
    return { ok: true, data: data.products, total: data.products.length };
  });

  app.get<{ Querystring: { tag?: string; page?: string; limit?: string } }>(
    '/api/articles',
    async (req) => {
      let items = data.articles as { tags?: string[] }[];
      const tag = req.query.tag;
      if (tag) {
        items = items.filter((a) => a.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()));
      }

      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? '10', 10)));
      const total = items.length;
      const start = (page - 1) * limit;
      const paged = items.slice(start, start + limit);

      return { ok: true, data: paged, total, page };
    },
  );
}
