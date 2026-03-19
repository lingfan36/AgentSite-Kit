import type { FastifyInstance } from 'fastify';
import type { ServerData, SearchIndex } from '../app.js';

export function registerSearchRoute(app: FastifyInstance, data: ServerData, searchIndex: SearchIndex) {
  app.get<{ Querystring: { q?: string; page?: string; limit?: string } }>(
    '/api/search',
    async (req) => {
      const q = (req.query.q ?? '').toLowerCase().trim();
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? '10', 10)));

      if (!q) return { ok: true, data: [], total: 0, page };

      const words = q.split(/\W+/).filter((w) => w.length > 2);
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
        .sort((a, b) => b[1] - a[1]);

      const total = sorted.length;
      const start = (page - 1) * limit;
      const results = sorted.slice(start, start + limit).map(([idx]) => data.pages[idx]);

      return { ok: true, data: results, total, page };
    },
  );
}
