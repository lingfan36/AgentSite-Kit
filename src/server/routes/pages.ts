import type { FastifyInstance } from 'fastify';
import type { ServerData } from '../app.js';
import type { ValidatedConfig } from '../../config/schema.js';
import { urlToId } from '../../utils/url.js';
import { filterPageContent } from '../../utils/access-control.js';

export function registerPagesRoute(app: FastifyInstance, data: ServerData, config: ValidatedConfig) {
  app.get<{ Params: { id: string } }>('/api/pages/:id', async (req, reply) => {
    const page = data.pages.find((p) => urlToId(p.url) === req.params.id);
    if (!page) {
      reply.code(404);
      return { ok: false, error: 'Page not found' };
    }
    return { ok: true, data: filterPageContent(page, config) };
  });
}
