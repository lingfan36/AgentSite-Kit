import { Command } from 'commander';
import { writeFileSync, mkdirSync } from 'node:fs';
import { loadConfig } from '../config/loader.js';
import { crawlSite } from '../scanner/crawler.js';
import { parseSitemap } from '../scanner/sitemap-parser.js';
import { classifyPage } from '../scanner/page-classifier.js';
import { extractContent } from '../scanner/content-extractor.js';
import { sha256 } from '../utils/hash.js';
import { log, spinner } from '../utils/logger.js';
import { getLlmConfig } from '../llm/client.js';
import { llmClassifyPage } from '../llm/classifier.js';
import { llmSummarize } from '../llm/summarizer.js';
import { loadPlugins, runHook, runAfterScan } from '../plugins/loader.js';
import type { ScannedPage, ScanResult } from '../types/page.js';

export async function runScan(configOverride?: ReturnType<typeof loadConfig>): Promise<ScanResult> {
  const config = configOverride ?? loadConfig();
  const outDir = config.output.dir;
  mkdirSync(`${outDir}/cache/pages`, { recursive: true });
  mkdirSync(`${outDir}/data`, { recursive: true });

  // Load plugins
  const plugins = await loadPlugins(config.plugins ?? []);
  await runHook(plugins, 'beforeScan', config);

  // Check LLM availability
  const llmConfig = getLlmConfig(config);
  if (llmConfig) {
    log.info('LLM enabled — using AI-assisted classification & summarization');
  }

  // 1. Try sitemap
  const sp = spinner('Fetching sitemap...');
  const sitemapUrls = await parseSitemap(config.site.url);
  if (sitemapUrls.length > 0) {
    sp.succeed(`Found ${sitemapUrls.length} URLs in sitemap`);
  } else {
    sp.info('No sitemap found, will discover pages by crawling');
  }

  // 2. Crawl
  const crawlSp = spinner('Crawling site...');
  const crawled = await crawlSite(config, sitemapUrls, (url, i) => {
    crawlSp.text = `Crawling (${i}/${config.scan.maxPages})... ${url}`;
  });
  crawlSp.succeed(`Crawled ${crawled.length} pages`);

  // 3. Extract & classify
  const extractSp = spinner('Extracting content...');
  let pages: ScannedPage[] = [];

  for (let idx = 0; idx < crawled.length; idx++) {
    const { url, html } = crawled[idx];
    const content = extractContent(html, url);

    extractSp.text = `Processing (${idx + 1}/${crawled.length})... ${url}`;

    // Classification: LLM or rule-based
    let pageType;
    if (llmConfig) {
      try {
        pageType = await llmClassifyPage(llmConfig, url, content.title, content.bodyText);
      } catch {
        pageType = classifyPage({
          url, title: content.title, metaOgType: content.metaOgType,
          headings: content.headings, bodyText: content.bodyText,
        });
      }
    } else {
      pageType = classifyPage({
        url, title: content.title, metaOgType: content.metaOgType,
        headings: content.headings, bodyText: content.bodyText,
      });
    }

    // Summary: LLM or fallback
    let summary = content.summary;
    if (llmConfig) {
      try {
        summary = await llmSummarize(llmConfig, content.title, content.bodyText);
      } catch { /* keep rule-based summary */ }
    }

    pages.push({
      url,
      title: content.title,
      type: pageType,
      contentHash: sha256(content.bodyText),
      summary,
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
  extractSp.succeed(`Extracted content from ${pages.length} pages`);

  // Run afterScan plugin hooks
  pages = await runAfterScan(plugins, pages);

  // 4. Write scan result
  const result: ScanResult = {
    siteUrl: config.site.url,
    scannedAt: new Date().toISOString(),
    totalPages: pages.length,
    pages,
  };

  writeFileSync(`${outDir}/scan-result.json`, JSON.stringify(result, null, 2), 'utf-8');
  log.success(`Scan result saved to ${outDir}/scan-result.json`);

  // Stats
  const typeCounts = new Map<string, number>();
  for (const p of pages) {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1);
  }
  log.info('Page types:');
  for (const [type, count] of typeCounts) {
    console.log(`  ${type}: ${count}`);
  }

  return result;
}

export function registerScanCommand(program: Command) {
  program
    .command('scan')
    .description('Scan your website and classify pages')
    .option('--no-llm', 'Disable LLM-assisted classification and summarization')
    .action(async (opts) => {
      if (!opts.llm) {
        // Override LLM config to disable it
        const config = loadConfig();
        (config as Record<string, unknown>).llm = undefined;
        await runScan(config);
      } else {
        await runScan();
      }
    });
}
