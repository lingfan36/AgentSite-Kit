import { Command } from 'commander';
import { writeFileSync, mkdirSync } from 'node:fs';
import { loadConfig } from '../config/loader.js';
import { runScan } from './scan.js';
import { runGenerate } from './generate.js';
import { loadHashes, saveHashes, findChangedUrls } from '../utils/change-store.js';
import { log } from '../utils/logger.js';
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

      // Regenerate outputs using shared generate pipeline
      await runGenerate(config);

      // Update hashes
      saveHashes(hashPath, newHashes);

      log.success(`Update complete. ${changed.length} changed, ${deleted.length} removed.`);
    });
}
