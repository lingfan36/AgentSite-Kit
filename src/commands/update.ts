import { Command } from 'commander';
import { writeFileSync, mkdirSync } from 'node:fs';
import { loadConfig } from '../config/loader.js';
import { runScan } from './scan.js';
import { loadHashes, saveHashes, findChangedUrls } from '../change-detection/store.js';
import { generateLlmsTxt, generateAgentSitemap, generateAgentIndex } from '../generator/static-generators.js';
import { generateStructuredExports } from '../generator/structured-export.js';
import { log, spinner } from '../utils/logger.js';
import type { ScanResult } from '../types/page.js';

export function registerUpdateCommand(program: Command) {
  program
    .command('update')
    .description('Incrementally update: re-scan, detect changes, regenerate')
    .action(async () => {
      const config = loadConfig();
      const outDir = config.output.dir;
      const hashPath = `${outDir}/cache/hashes.json`;
      mkdirSync(`${outDir}/cache`, { recursive: true });

      const oldHashes = loadHashes(hashPath);

      // Re-scan using the shared scan pipeline
      const result = await runScan(config);

      // Build new hashes from scan result
      const newHashes: Record<string, string> = {};
      for (const p of result.pages) {
        newHashes[p.url] = p.contentHash;
      }

      // Detect changes
      const { changed, deleted } = findChangedUrls(oldHashes, newHashes);
      if (changed.length === 0 && deleted.length === 0) {
        log.success('No changes detected. Everything is up to date.');
        return;
      }

      if (deleted.length > 0) {
        log.info(`${deleted.length} page(s) removed`);
      }
      log.info(`${changed.length} page(s) changed`);

      // Save updated scan result (exclude deleted pages)
      const deletedSet = new Set(deleted);
      const filtered: ScanResult = {
        siteUrl: result.siteUrl,
        scannedAt: result.scannedAt,
        totalPages: result.pages.filter(p => !deletedSet.has(p.url)).length,
        pages: result.pages.filter(p => !deletedSet.has(p.url)),
      };
      writeFileSync(`${outDir}/scan-result.json`, JSON.stringify(filtered, null, 2), 'utf-8');

      // Regenerate outputs
      const genSp = spinner('Regenerating files...');

      writeFileSync(`${outDir}/llms.txt`, generateLlmsTxt(filtered, config.site.name, config.site.description), 'utf-8');
      writeFileSync(`${outDir}/agent-sitemap.json`, JSON.stringify(generateAgentSitemap(filtered), null, 2), 'utf-8');
      writeFileSync(`${outDir}/agent-index.json`, JSON.stringify(generateAgentIndex(filtered, config.site.name, config.site.description), null, 2), 'utf-8');

      const { docs, faq, products, articles, pricing, changelog } = await generateStructuredExports(filtered, outDir, config);
      writeFileSync(`${outDir}/data/docs.json`, JSON.stringify(docs, null, 2), 'utf-8');
      writeFileSync(`${outDir}/data/faq.json`, JSON.stringify(faq, null, 2), 'utf-8');
      writeFileSync(`${outDir}/data/products.json`, JSON.stringify(products, null, 2), 'utf-8');
      writeFileSync(`${outDir}/data/articles.json`, JSON.stringify(articles, null, 2), 'utf-8');
      writeFileSync(`${outDir}/data/pricing.json`, JSON.stringify(pricing, null, 2), 'utf-8');
      writeFileSync(`${outDir}/data/changelog.json`, JSON.stringify(changelog, null, 2), 'utf-8');

      // Update hashes
      saveHashes(hashPath, newHashes);

      genSp.succeed('All files regenerated');
      log.success(`Update complete. ${changed.length} changed, ${deleted.length} removed.`);
    });
}
