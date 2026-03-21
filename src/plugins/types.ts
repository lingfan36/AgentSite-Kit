import type { ScannedPage, PageType } from '../types/page.js';

export interface PluginExtractedContent {
  title: string;
  summary: string;
  headings: string[];
  tags: string[];
}

export interface AgentSitePlugin {
  name: string;
  version: string;
  hooks?: {
    beforeScan?(config: unknown): Promise<void>;
    afterScan?(pages: ScannedPage[]): Promise<ScannedPage[]>;
    beforeGenerate?(scanResult: unknown): Promise<void>;
    afterGenerate?(outDir: string): Promise<void>;
  };
  extractors?: Partial<Record<PageType, (html: string, url: string) => Partial<PluginExtractedContent>>>;
}
