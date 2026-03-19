import type { FastifyInstance } from 'fastify';
import type { ServerData } from '../app.js';

export function registerArticlesRoute(app: FastifyInstance, data: ServerData) {
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
