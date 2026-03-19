import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'node:fs';
import pLimit from 'p-limit';
import { isSameOrigin } from '../utils/url.js';
import { sha256 } from '../utils/hash.js';
import type { ValidatedConfig } from '../config/schema.js';

export interface CrawlResult {
  url: string;
  html: string;
  status: number;
}

export async function crawlSite(
  config: ValidatedConfig,
  seedUrls: string[],
  onPage?: (url: string, index: number) => void,
): Promise<CrawlResult[]> {
  const { maxPages, concurrency, delayMs } = config.scan;
  const baseUrl = config.site.url;
  const visited = new Set<string>();
  const queue: string[] = [...seedUrls, baseUrl];
  const results: CrawlResult[] = [];
  const limit = pLimit(concurrency);
  const cacheDir = `${config.output.dir}/cache/pages`;
  mkdirSync(cacheDir, { recursive: true });

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  while (queue.length > 0 && visited.size < maxPages) {
    const batch = queue.splice(0, concurrency).filter((u) => !visited.has(u));
    if (batch.length === 0) continue;

    const tasks = batch.map((url) =>
      limit(async () => {
        if (visited.has(url) || visited.size >= maxPages) return null;
        visited.add(url);

        try {
          const res = await axios.get(url, {
            timeout: 15000,
            headers: { 'User-Agent': 'AgentSite-Kit/0.1' },
            maxRedirects: 3,
          });

          const html = res.data as string;
          onPage?.(url, visited.size);

          // Cache HTML
          const filename = sha256(url);
          writeFileSync(`${cacheDir}/${filename}.html`, html, 'utf-8');

          // Extract links
          const $ = cheerio.load(html);
          $('a[href]').each((_, el) => {
            try {
              const href = $(el).attr('href');
              if (!href) return;
              const resolved = new URL(href, url).href.split('#')[0].split('?')[0];
              if (isSameOrigin(baseUrl, resolved) && !visited.has(resolved)) {
                queue.push(resolved);
              }
            } catch { /* ignore invalid URLs */ }
          });

          if (delayMs > 0) await delay(delayMs);

          return { url, html, status: res.status } as CrawlResult;
        } catch {
          return null;
        }
      }),
    );

    const settled = await Promise.all(tasks);
    for (const r of settled) {
      if (r) results.push(r);
    }
  }

  return results;
}
