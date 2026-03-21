import * as cheerio from 'cheerio';

export interface ExtractedContent {
  title: string;
  summary: string;
  headings: string[];
  bodyText: string;
  metaOgType?: string;
  faqItems: { question: string; answer: string }[];
  features: string[];
  lastModified?: string;
  wordCount: number;
  tags?: string[];
  version?: string;
  author?: string;
  publishedAt?: string;
  isSpa?: boolean;
}

const REMOVE_SELECTORS = 'nav, footer, header, aside, .sidebar, .nav, .footer, .header, script, style, noscript, iframe, svg, button, input, label, select, textarea, form';

function extractJsonLd($: ReturnType<typeof cheerio.load>): Record<string, unknown> | null {
  try {
    const raw = $('script[type="application/ld+json"]').first().html();
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data[0] : data;
  } catch {
    return null;
  }
}

function extractFirstParagraph($: ReturnType<typeof cheerio.load>): string {
  let text = '';
  $('article p, main p, .content p, .post-content p, p').each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 40) {
      text = t;
      return false; // break
    }
  });
  return text;
}

export function extractContent(html: string, url: string): ExtractedContent {
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('h1').first().text().trim() ||
    '';

  const metaOgType = $('meta[property="og:type"]').attr('content');

  const lastModified =
    $('meta[property="article:modified_time"]').attr('content') ||
    $('meta[name="last-modified"]').attr('content') ||
    undefined;

  const author =
    $('meta[name="author"]').attr('content') ||
    $('meta[property="article:author"]').attr('content') ||
    $('.author').first().text().trim() ||
    undefined;

  const publishedAt =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    $('time[datetime]').first().attr('datetime') ||
    undefined;

  const tags: string[] = [];
  $('meta[property="article:tag"]').each((_, el) => {
    const tag = $(el).attr('content')?.trim();
    if (tag) tags.push(tag);
  });
  $('meta[name="keywords"]').attr('content')?.split(',').forEach(k => {
    const tag = k.trim();
    if (tag) tags.push(tag);
  });

  // JSON-LD structured data
  const jsonLd = extractJsonLd($);

  // Remove non-content elements
  $(REMOVE_SELECTORS).remove();

  // Extract headings
  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push(text);
  });

  // Extract body text
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // SPA detection: very little content + known SPA root divs
  const isSpa = wordCount < 50 && (
    html.includes('<div id="root">') ||
    html.includes('<div id="app">') ||
    html.includes('data-reactroot') ||
    html.includes('__NEXT_DATA__')
  );

  const version =
    $('meta[name="version"]').attr('content') ||
    (jsonLd?.version as string | undefined) ||
    bodyText.match(/v?\d+\.\d+\.\d+/)?.[0] ||
    undefined;

  // Extract FAQ items
  const faqItems: { question: string; answer: string }[] = [];

  // JSON-LD FAQ
  if (jsonLd?.['@type'] === 'FAQPage' && Array.isArray(jsonLd.mainEntity)) {
    for (const item of jsonLd.mainEntity as Record<string, unknown>[]) {
      const q = item.name as string;
      const a = (item.acceptedAnswer as Record<string, unknown>)?.text as string;
      if (q && a) faqItems.push({ question: q, answer: a });
    }
  }

  // Pattern 1: details/summary
  if (faqItems.length === 0) {
    $('details').each((_, el) => {
      const q = $(el).find('summary').text().trim();
      const a = $(el).clone().find('summary').remove().end().text().trim();
      if (q && a) faqItems.push({ question: q, answer: a });
    });
  }

  // Pattern 2: dt/dd
  if (faqItems.length === 0) {
    $('dt').each((_, el) => {
      const q = $(el).text().trim();
      const a = $(el).next('dd').text().trim();
      if (q && a) faqItems.push({ question: q, answer: a });
    });
  }

  // Extract features (list items)
  const features: string[] = [];
  $('ul li, ol li').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 200) features.push(text);
  });

  // Summary: priority order
  const summary =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    (jsonLd?.description as string | undefined) ||
    extractFirstParagraph($) ||
    bodyText.slice(0, 200);

  return {
    title,
    summary,
    headings,
    bodyText,
    metaOgType,
    faqItems,
    features: features.slice(0, 20),
    lastModified,
    wordCount,
    tags: tags.length > 0 ? tags : undefined,
    version,
    author,
    publishedAt,
    isSpa,
  };
}
