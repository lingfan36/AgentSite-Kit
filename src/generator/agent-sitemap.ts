import type { ScanResult } from '../types/page.js';

interface AgentSitemapEntry {
  url: string;
  title: string;
  type: string;
  summary: string;
  lastModified?: string;
  wordCount: number;
}

export function generateAgentSitemap(scanResult: ScanResult): object {
  const entries: AgentSitemapEntry[] = scanResult.pages.map((p) => ({
    url: p.url,
    title: p.title,
    type: p.type,
    summary: p.summary,
    lastModified: p.lastModified,
    wordCount: p.wordCount,
  }));

  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    siteUrl: scanResult.siteUrl,
    totalPages: entries.length,
    pages: entries,
  };
}
