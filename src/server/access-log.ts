import { appendFileSync, readFileSync, existsSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';

export interface AccessLogEntry {
  timestamp: string;
  method: string;
  path: string;
  query: string;
  ip: string;
  userAgent: string;
  statusCode: number;
  responseTimeMs: number;
}

export class AccessLogger {
  private logPath: string;

  constructor(outDir: string) {
    this.logPath = `${outDir}/access-log.jsonl`;
  }

  log(entry: AccessLogEntry): void {
    appendFileSync(this.logPath, JSON.stringify(entry) + '\n', 'utf-8');
  }

  getRecent(limit: number = 100): AccessLogEntry[] {
    if (!existsSync(this.logPath)) return [];
    const lines = readFileSync(this.logPath, 'utf-8')
      .split('\n')
      .filter((l) => l.trim().length > 0);
    return lines
      .slice(-limit)
      .reverse()
      .map((l) => JSON.parse(l) as AccessLogEntry);
  }

  register(app: FastifyInstance): void {
    app.addHook('onResponse', async (request, reply) => {
      const entry: AccessLogEntry = {
        timestamp: new Date().toISOString(),
        method: request.method,
        path: request.url.split('?')[0],
        query: request.url.includes('?') ? request.url.split('?')[1] : '',
        ip: request.ip,
        userAgent: (request.headers['user-agent'] as string) ?? '',
        statusCode: reply.statusCode,
        responseTimeMs: Math.round(reply.elapsedTime),
      };
      this.log(entry);
    });
  }
}
