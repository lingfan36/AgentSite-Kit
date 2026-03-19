import type { ScanResult } from '../types/page.js';

export function generateLlmsTxt(scanResult: ScanResult, siteName: string, siteDescription: string): string {
  const lines: string[] = [];
  lines.push(`# ${siteName}`);
  lines.push(`> ${siteDescription}`);
  lines.push('');

  const grouped = new Map<string, typeof scanResult.pages>();
  for (const page of scanResult.pages) {
    const group = grouped.get(page.type) ?? [];
    group.push(page);
    grouped.set(page.type, group);
  }

  const sectionOrder = ['docs', 'faq', 'product', 'blog', 'pricing', 'about', 'contact', 'homepage', 'unknown'];
  const sectionLabels: Record<string, string> = {
    docs: 'Docs',
    faq: 'FAQ',
    product: 'Products',
    blog: 'Articles',
    pricing: 'Pricing',
    about: 'About',
    contact: 'Contact',
    homepage: 'Home',
    unknown: 'Other',
  };

  for (const type of sectionOrder) {
    const pages = grouped.get(type);
    if (!pages?.length) continue;

    lines.push(`## ${sectionLabels[type] ?? type}`);
    for (const page of pages) {
      const summary = page.summary ? `: ${page.summary}` : '';
      lines.push(`- [${page.title || page.url}](${page.url})${summary}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
