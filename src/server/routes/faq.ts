import type { FastifyInstance } from 'fastify';
import type { ServerData } from '../app.js';

export function registerFaqRoute(app: FastifyInstance, data: ServerData) {
  app.get<{ Querystring: { category?: string } }>('/api/faq', async (req) => {
    let items = data.faq as { category?: string }[];
    const category = req.query.category;
    if (category) {
      items = items.filter((f) => f.category?.toLowerCase() === category.toLowerCase());
    }
    return { ok: true, data: items, total: items.length };
  });
}
