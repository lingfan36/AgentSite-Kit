import type { FastifyInstance } from 'fastify';
import type { ServerData } from '../app.js';

export function registerPricingRoute(app: FastifyInstance, data: ServerData) {
  app.get('/api/pricing', async () => {
    return { ok: true, data: data.pricing };
  });
}
