import type { FastifyInstance } from 'fastify';
import type { ServerData } from '../app.js';

export function registerProductsRoute(app: FastifyInstance, data: ServerData) {
  app.get('/api/products', async () => {
    return { ok: true, data: data.products, total: data.products.length };
  });
}
