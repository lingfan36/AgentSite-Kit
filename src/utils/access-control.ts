import { minimatch } from 'minimatch';
import type { ValidatedConfig } from '../config/schema.js';
import type { ScannedPage } from '../types/page.js';

export function isPageAllowed(page: ScannedPage, config: ValidatedConfig): boolean {
  const { allowedPages, blockedPages, allowedTypes } = config.access;

  // Check blocked patterns first
  for (const pattern of blockedPages) {
    if (minimatch(page.url, pattern)) return false;
  }

  // Check allowed patterns
  let matchesAllowed = false;
  for (const pattern of allowedPages) {
    if (minimatch(page.url, pattern)) {
      matchesAllowed = true;
      break;
    }
  }
  if (!matchesAllowed) return false;

  // Check page type
  return allowedTypes.includes(page.type);
}

export function filterPageContent(page: ScannedPage, config: ValidatedConfig): Partial<ScannedPage> {
  if (config.access.summaryOnly) {
    return {
      url: page.url,
      title: page.title,
      type: page.type,
      summary: page.summary,
      updatedAt: page.updatedAt,
    };
  }
  return page;
}
