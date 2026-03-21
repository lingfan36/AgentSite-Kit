import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { loadConfig } from '../config/loader.js';
import { generateLlmsTxt, generateAgentSitemap, generateAgentIndex } from '../generator/static-generators.js';
import { generateStructuredExports } from '../generator/structured-export.js';
import { loadPlugins, runHook } from '../plugins/loader.js';
import { log, spinner } from '../utils/logger.js';
import type { ScanResult } from '../types/page.js';

export async function runGenerate(configOverride?: ReturnType<typeof loadConfig>): Promise<void> {
  const config = configOverride ?? loadConfig();
  const outDir = config.output.dir;
  const scanPath = `${outDir}/scan-result.json`;

  if (!existsSync(scanPath)) {
    log.error('No scan result found. Run `agentsite scan` first.');
    throw new Error('No scan result found');
  }

  const scanResult: ScanResult = JSON.parse(readFileSync(scanPath, 'utf-8'));
  mkdirSync(`${outDir}/data`, { recursive: true });

  // Load plugins
  const plugins = await loadPlugins(config.plugins ?? []);
  await runHook(plugins, 'beforeGenerate', scanResult);

  const sp = spinner('Generating files...');
  let count = 0;

  // llms.txt
  const llmsTxt = generateLlmsTxt(scanResult, config.site.name, config.site.description);
  writeFileSync(`${outDir}/llms.txt`, llmsTxt, 'utf-8');
  count++;

  // agent-sitemap.json
  const sitemap = generateAgentSitemap(scanResult);
  writeFileSync(`${outDir}/agent-sitemap.json`, JSON.stringify(sitemap, null, 2), 'utf-8');
  count++;

  // agent-index.json
  const index = generateAgentIndex(scanResult, config.site.name, config.site.description);
  writeFileSync(`${outDir}/agent-index.json`, JSON.stringify(index, null, 2), 'utf-8');
  count++;

  // Structured exports
  const { docs, faq, products, articles, pricing, changelog } = await generateStructuredExports(scanResult, outDir, config);
  writeFileSync(`${outDir}/data/docs.json`, JSON.stringify(docs, null, 2), 'utf-8');
  writeFileSync(`${outDir}/data/faq.json`, JSON.stringify(faq, null, 2), 'utf-8');
  writeFileSync(`${outDir}/data/products.json`, JSON.stringify(products, null, 2), 'utf-8');
  writeFileSync(`${outDir}/data/articles.json`, JSON.stringify(articles, null, 2), 'utf-8');
  writeFileSync(`${outDir}/data/pricing.json`, JSON.stringify(pricing, null, 2), 'utf-8');
  writeFileSync(`${outDir}/data/changelog.json`, JSON.stringify(changelog, null, 2), 'utf-8');
  count += 6;

  // Run afterGenerate plugin hooks
  await runHook(plugins, 'afterGenerate', outDir);

  sp.succeed(`Generated ${count} files`);

  // Quality report
  const unknownPages = scanResult.pages.filter(p => p.type === 'unknown').length;
  const spaPages = scanResult.pages.filter(p => p.isSpa).length;
  const emptySummaryPages = scanResult.pages.filter(p => !p.summary || p.summary.length < 20).length;
  const totalStructured = docs.length + faq.length + products.length + articles.length + pricing.length + changelog.length;

  log.info('─'.repeat(40));
  log.info('Generated files:');
  log.info(`  llms.txt           ${llmsTxt.length} bytes`);
  log.info(`  agent-sitemap.json ${scanResult.totalPages} pages`);
  log.info(`  agent-index.json`);
  log.info(`  data/docs.json     ${docs.length} entries`);
  log.info(`  data/faq.json      ${faq.length} entries`);
  log.info(`  data/products.json ${products.length} entries`);
  log.info(`  data/articles.json ${articles.length} entries`);
  log.info(`  data/pricing.json  ${pricing.length} entries`);
  log.info(`  data/changelog.json ${changelog.length} entries`);
  log.info('─'.repeat(40));
  log.info(`Quality check:`);
  log.info(`  Structured entries: ${totalStructured} / ${scanResult.totalPages} pages`);
  if (unknownPages > 0) log.info(`  ⚠ Unclassified pages: ${unknownPages} (type=unknown)`);
  if (spaPages > 0) log.info(`  ⚠ SPA pages (may lack content): ${spaPages}`);
  if (emptySummaryPages > 0) log.info(`  ⚠ Poor summaries: ${emptySummaryPages}`);
  if (unknownPages === 0 && spaPages === 0 && emptySummaryPages === 0) log.success('  ✓ All checks passed');
  log.info('─'.repeat(40));
}

export function registerGenerateCommand(program: Command) {
  program
    .command('generate')
    .description('Generate Agent-friendly files from scan results')
    .action(async () => {
      await runGenerate();
    });
}
