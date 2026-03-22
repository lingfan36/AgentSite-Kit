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
import { llmClassifyPage, llmSummarize } from '../llm/inference.js';
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
  const { results: crawled, failed } = await crawlSite(config, sitemapUrls, (url, i) => {
    crawlSp.text = `Crawling (${i}/${config.scan.maxPages})... ${url}`;
  });
  crawlSp.succeed(`Crawled ${crawled.length} pages${failed.length > 0 ? `, ${failed.length} failed` : ''}`);

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
        summary = await llmSummarize(llmConfig, content.title, content.bodyText, pageType);
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
      isSpa: content.isSpa,
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

  printScanReport(pages, failed, outDir);

  return result;
}

function printScanReport(pages: ScannedPage[], failed: string[], outDir: string) {
  const typeCounts = new Map<string, number>();
  let spaCount = 0;
  let emptySummary = 0;
  let totalWords = 0;
  for (const p of pages) {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1);
    if (p.isSpa) spaCount++;
    if (!p.summary || p.summary.length < 20) emptySummary++;
    totalWords += p.wordCount;
  }
  const avgWords = pages.length > 0 ? Math.round(totalWords / pages.length) : 0;

  log.success(`✓ Scan complete: ${pages.length} pages, ${failed.length} failed`);
  log.info('─'.repeat(40));
  log.info('Page types:');
  for (const [type, count] of [...typeCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type.padEnd(12)}: ${count}`);
  }
  if (spaCount > 0) {
    log.info(`⚠ SPA pages detected: ${spaCount} (content may be incomplete — consider using Playwright)`);
  }
  if (emptySummary > 0) {
    log.info(`⚠ Pages with poor summary: ${emptySummary}`);
  }
  log.info(`Avg words/page: ${avgWords}`);
  if (failed.length > 0) {
    log.info(`Failed URLs:`);
    for (const u of failed.slice(0, 5)) console.log(`  ${u}`);
    if (failed.length > 5) console.log(`  ... and ${failed.length - 5} more`);
  }
  log.info('─'.repeat(40));
  log.success(`Output: ${outDir}/scan-result.json`);
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
