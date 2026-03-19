import type { FastifyInstance } from 'fastify';
import type { ServerData } from '../app.js';

export function registerDocsRoute(app: FastifyInstance, data: ServerData) {
  app.get<{ Querystring: { section?: string } }>('/api/docs', async (req) => {
    let items = data.docs as { section?: string }[];
    const section = req.query.section;
    if (section) {
      items = items.filter((d) => d.section?.toLowerCase() === section.toLowerCase());
    }
    return { ok: true, data: items, total: items.length };
  });
}
