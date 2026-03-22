import { readFileSync, existsSync } from 'node:fs';
import { sha256 } from '../utils/hash.js';
import { extractContent } from '../scanner/content-extractor.js';
import { getLlmConfig, type LlmConfig } from '../llm/client.js';
import { llmExtractTags } from '../llm/inference.js';
import type { ScanResult } from '../types/page.js';
import type { DocEntry, FaqEntry, ProductEntry, ArticleEntry, PricingEntry, ChangelogEntry } from '../types/content.js';
import type { AgentSiteConfig } from '../types/config.js';

function loadCachedHtml(outDir: string, url: string): string | null {
  const path = `${outDir}/cache/pages/${sha256(url)}.html`;
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}

async function tryExtractTags(llm: LlmConfig | null, title: string, bodyText: string): Promise<string[]> {
  if (!llm) return [];
  try {
    return await llmExtractTags(llm, title, bodyText);
  } catch {
    return [];
  }
}

export async function generateStructuredExports(scanResult: ScanResult, outDir: string, config?: AgentSiteConfig) {
  const docs: DocEntry[] = [];
  const faq: FaqEntry[] = [];
  const products: ProductEntry[] = [];
  const articles: ArticleEntry[] = [];
  const pricing: PricingEntry[] = [];
  const changelog: ChangelogEntry[] = [];
  const now = new Date().toISOString();
  const llm = getLlmConfig(config);

  for (const page of scanResult.pages) {
    const html = loadCachedHtml(outDir, page.url);
    if (!html) continue;

    const content = extractContent(html, page.url);

    switch (page.type) {
      case 'docs': {
        const tags = await tryExtractTags(llm, page.title, content.bodyText);
        docs.push({
          title: page.title,
          url: page.url,
          section: page.headings[0] ?? '',
          summary: page.summary,
          tags,
          updated_at: page.lastModified ?? now,
        });
        break;
      }

      case 'faq':
        if (content.faqItems.length > 0) {
          for (const item of content.faqItems) {
            faq.push({
              question: item.question,
              answer: item.answer,
              category: page.headings[0] ?? 'General',
              url: page.url,
              updated_at: page.lastModified ?? now,
            });
          }
        } else {
          faq.push({
            question: page.title,
            answer: page.summary,
            category: 'General',
            url: page.url,
            updated_at: page.lastModified ?? now,
          });
        }
        break;

      case 'product':
        products.push({
          product_name: page.title,
          description: page.summary,
          features: content.features.slice(0, 10),
          pricing: '',
          url: page.url,
          updated_at: page.lastModified ?? now,
        });
        break;

      case 'blog': {
        const tags = await tryExtractTags(llm, page.title, content.bodyText);
        articles.push({
          title: page.title,
          summary: page.summary,
          published_at: page.lastModified ?? now,
          updated_at: page.lastModified ?? now,
          tags,
          url: page.url,
        });
        break;
      }

      case 'pricing':
        pricing.push({
          plan_name: page.title,
          price: content.bodyText.match(/\$\d+(?:\.\d{2})?/)?.[0] ?? '',
          features: content.features.slice(0, 10),
          url: page.url,
          updated_at: page.lastModified ?? now,
        });
        break;

      case 'changelog':
        changelog.push({
          version: page.version ?? page.title,
          date: page.publishedAt ?? page.lastModified ?? now,
          changes: content.headings.slice(1),
          url: page.url,
        });
        break;
    }
  }

  return { docs, faq, products, articles, pricing, changelog };
}
