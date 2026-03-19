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
}

const REMOVE_SELECTORS = 'nav, footer, header, aside, .sidebar, .nav, .footer, .header, script, style, noscript, iframe, svg';

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

  const version =
    $('meta[name="version"]').attr('content') ||
    bodyText.match(/v?\d+\.\d+\.\d+/)?.[0] ||
    undefined;

  // Extract FAQ items
  const faqItems: { question: string; answer: string }[] = [];

  // Pattern 1: details/summary
  $('details').each((_, el) => {
    const q = $(el).find('summary').text().trim();
    const a = $(el).clone().find('summary').remove().end().text().trim();
    if (q && a) faqItems.push({ question: q, answer: a });
  });

  // Pattern 2: dt/dd
  $('dt').each((_, el) => {
    const q = $(el).text().trim();
    const a = $(el).next('dd').text().trim();
    if (q && a) faqItems.push({ question: q, answer: a });
  });

  // Extract features (list items in product-like pages)
  const features: string[] = [];
  $('ul li, ol li').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 200) features.push(text);
  });

  // Summary: meta description or first 200 chars
  const summary =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
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
  };
}
