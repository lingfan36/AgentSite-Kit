import type { FastifyInstance } from 'fastify';
import type { ServerData } from '../app.js';

export function registerChangelogRoute(app: FastifyInstance, data: ServerData) {
  app.get('/api/changelog', async () => {
    return { ok: true, data: data.changelog };
  });
}
