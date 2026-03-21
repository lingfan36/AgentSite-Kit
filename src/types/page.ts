export type PageType = 'homepage' | 'docs' | 'faq' | 'blog' | 'product' | 'pricing' | 'about' | 'contact' | 'changelog' | 'unknown';

export interface ScannedPage {
  url: string;
  title: string;
  type: PageType;
  contentHash: string;
  summary: string;
  headings: string[];
  lastModified?: string;
  scannedAt: string;
  wordCount: number;
  tags?: string[];
  version?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  isSpa?: boolean;
}

export interface ScanResult {
  siteUrl: string;
  scannedAt: string;
  totalPages: number;
  pages: ScannedPage[];
}
