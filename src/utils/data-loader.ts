import { readFileSync, existsSync } from 'node:fs';
import type { ScanResult } from '../types/page.js';
import type { DocEntry, FaqEntry, ProductEntry, ArticleEntry, PricingEntry, ChangelogEntry } from '../types/content.js';

export interface SiteData {
  scanResult: ScanResult;
  docs: DocEntry[];
  faq: FaqEntry[];
  products: ProductEntry[];
  articles: ArticleEntry[];
  pricing: PricingEntry[];
  changelog: ChangelogEntry[];
}

function loadJson<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function loadSiteData(outDir: string): SiteData | null {
  const scanPath = `${outDir}/scan-result.json`;
  if (!existsSync(scanPath)) return null;

  return {
    scanResult: JSON.parse(readFileSync(scanPath, 'utf-8')),
    docs: loadJson<DocEntry>(`${outDir}/data/docs.json`),
    faq: loadJson<FaqEntry>(`${outDir}/data/faq.json`),
    products: loadJson<ProductEntry>(`${outDir}/data/products.json`),
    articles: loadJson<ArticleEntry>(`${outDir}/data/articles.json`),
    pricing: loadJson<PricingEntry>(`${outDir}/data/pricing.json`),
    changelog: loadJson<ChangelogEntry>(`${outDir}/data/changelog.json`),
  };
}
