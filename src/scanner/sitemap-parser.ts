import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

export async function parseSitemap(siteUrl: string): Promise<string[]> {
  const urls: string[] = [];
  const sitemapUrl = `${siteUrl}/sitemap.xml`;

  try {
    const res = await axios.get(sitemapUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'AgentSite-Kit/0.1' },
    });

    const parser = new XMLParser();
    const parsed = parser.parse(res.data);

    // Handle sitemap index
    if (parsed.sitemapindex?.sitemap) {
      const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
        ? parsed.sitemapindex.sitemap
        : [parsed.sitemapindex.sitemap];

      for (const sm of sitemaps) {
        if (sm.loc) {
          const childUrls = await parseSitemapFromUrl(sm.loc);
          urls.push(...childUrls);
        }
      }
    }

    // Handle urlset
    if (parsed.urlset?.url) {
      const entries = Array.isArray(parsed.urlset.url)
        ? parsed.urlset.url
        : [parsed.urlset.url];
      for (const entry of entries) {
        if (entry.loc) urls.push(entry.loc);
      }
    }
  } catch {
    // No sitemap available, that's fine
  }

  return urls;
}

async function parseSitemapFromUrl(url: string): Promise<string[]> {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'AgentSite-Kit/0.1' },
    });
    const parser = new XMLParser();
    const parsed = parser.parse(res.data);

    if (parsed.urlset?.url) {
      const entries = Array.isArray(parsed.urlset.url)
        ? parsed.urlset.url
        : [parsed.urlset.url];
      return entries.map((e: { loc: string }) => e.loc).filter(Boolean);
    }
  } catch { /* ignore */ }
  return [];
}
