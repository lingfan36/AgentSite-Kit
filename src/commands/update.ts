import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { loadConfig } from '../config/loader.js';
import { crawlSite } from '../scanner/crawler.js';
import { parseSitemap } from '../scanner/sitemap-parser.js';
import { classifyPage } from '../scanner/page-classifier.js';
import { extractContent } from '../scanner/content-extractor.js';
import { sha256 } from '../utils/hash.js';
import { loadHashes, saveHashes, findChangedUrls } from '../change-detection/store.js';
import { generateLlmsTxt } from '../generator/llms-txt.js';
import { generateAgentSitemap } from '../generator/agent-sitemap.js';
import { generateAgentIndex } from '../generator/agent-index.js';
import { generateStructuredExports } from '../generator/structured-export.js';
import { log, spinner } from '../utils/logger.js';
import type { ScannedPage, ScanResult } from '../types/page.js';

export function registerUpdateCommand(program: Command) {
  program
    .command('update')
    .description('Incrementally update: re-scan, detect changes, regenerate')
    .action(async () => {
      const config = loadConfig();
      const outDir = config.output.dir;
      const hashPath = `${outDir}/cache/hashes.json`;
      mkdirSync(`${outDir}/cache/pages`, { recursive: true });
      mkdirSync(`${outDir}/data`, { recursive: true });

      const oldHashes = loadHashes(hashPath);

      // Re-scan
      const sp = spinner('Re-scanning site...');
      const sitemapUrls = await parseSitemap(config.site.url);
      const crawled = await crawlSite(config, sitemapUrls, (url, i) => {
        sp.text = `Scanning (${i})... ${url}`;
      });
      sp.succeed(`Scanned ${crawled.length} pages`);

      // Build new pages & hashes
      const newHashes: Record<string, string> = {};
      const pages: ScannedPage[] = [];

      for (const { url, html } of crawled) {
        const content = extractContent(html, url);
        const contentHash = sha256(content.bodyText);
        newHashes[url] = contentHash;

        const pageType = classifyPage({
          url,
          title: content.title,
          metaOgType: content.metaOgType,
          headings: content.headings,
          bodyText: content.bodyText,
        });

        pages.push({
          url,
          title: content.title,
          type: pageType,
          contentHash,
          summary: content.summary,
          headings: content.headings,
          lastModified: content.lastModified,
          scannedAt: new Date().toISOString(),
          wordCount: content.wordCount,
          tags: content.tags,
          version: content.version,
          author: content.author,
          publishedAt: content.publishedAt,
          updatedAt: content.lastModified,
        });
      }

      // Detect changes
      const changed = findChangedUrls(oldHashes, newHashes);
      if (changed.length === 0) {
        log.success('No changes detected. Everything is up to date.');
        return;
      }

      log.info(`${changed.length} page(s) changed`);

      // Save updated scan result
      const result: ScanResult = {
        siteUrl: config.site.url,
        scannedAt: new Date().toISOString(),
        totalPages: pages.length,
        pages,
      };
      writeFileSync(`${outDir}/scan-result.json`, JSON.stringify(result, null, 2), 'utf-8');

      // Regenerate outputs
      const genSp = spinner('Regenerating files...');

      writeFileSync(`${outDir}/llms.txt`, generateLlmsTxt(result, config.site.name, config.site.description), 'utf-8');
      writeFileSync(`${outDir}/agent-sitemap.json`, JSON.stringify(generateAgentSitemap(result), null, 2), 'utf-8');
      writeFileSync(`${outDir}/agent-index.json`, JSON.stringify(generateAgentIndex(result, config.site.name, config.site.description), null, 2), 'utf-8');

      const { docs, faq, products, articles, pricing, changelog } = await generateStructuredExports(result, outDir, config);
      writeFileSync(`${outDir}/data/docs.json`, JSON.stringify(docs, null, 2), 'utf-8');
      writeFileSync(`${outDir}/data/faq.json`, JSON.stringify(faq, null, 2), 'utf-8');
      writeFileSync(`${outDir}/data/products.json`, JSON.stringify(products, null, 2), 'utf-8');
      writeFileSync(`${outDir}/data/articles.json`, JSON.stringify(articles, null, 2), 'utf-8');
      writeFileSync(`${outDir}/data/pricing.json`, JSON.stringify(pricing, null, 2), 'utf-8');
      writeFileSync(`${outDir}/data/changelog.json`, JSON.stringify(changelog, null, 2), 'utf-8');

      // Update hashes
      saveHashes(hashPath, newHashes);

      genSp.succeed('All files regenerated');
      log.success(`Update complete. ${changed.length} page(s) updated.`);
    });
}
