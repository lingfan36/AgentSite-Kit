import type { PageType } from '../types/page.js';

interface ClassifyInput {
  url: string;
  title: string;
  metaOgType?: string;
  headings: string[];
  bodyText: string;
}

const URL_PATTERNS: [RegExp, PageType, number][] = [
  [/\/(docs?|documentation|guide|manual|reference|api-docs)(\/|$)/i, 'docs', 3],
  [/\/(faq|frequently-asked|help\/faq)(\/|$)/i, 'faq', 3],
  [/\/(blog|posts?|articles?|news)(\/|$)/i, 'blog', 3],
  [/\/(products?|features?|solutions?)(\/|$)/i, 'product', 2],
  [/\/(pricing|plans?|packages?)(\/|$)/i, 'pricing', 3],
  [/\/(about|about-us|team|company)(\/|$)/i, 'about', 3],
  [/\/(contact|contact-us|support)(\/|$)/i, 'contact', 3],
  [/\/(changelog|changes|release-notes|releases|updates|whats-new)(\/|$)/i, 'changelog', 3],
];

const TITLE_KEYWORDS: [RegExp, PageType, number][] = [
  [/\b(documentation|docs|guide|reference|api)\b/i, 'docs', 2],
  [/\b(faq|frequently asked|common questions)\b/i, 'faq', 2],
  [/\b(blog|article|post)\b/i, 'blog', 2],
  [/\b(pricing|plans|packages)\b/i, 'pricing', 2],
  [/\b(product|feature|solution)\b/i, 'product', 1],
  [/\b(about|team|company|who we are)\b/i, 'about', 2],
  [/\b(contact|get in touch|support)\b/i, 'contact', 2],
  [/\b(changelog|release notes|what's new|updates|releases)\b/i, 'changelog', 2],
];

export function classifyPage(input: ClassifyInput): PageType {
  const { url, title, bodyText } = input;
  const scores = new Map<PageType, number>();

  const add = (type: PageType, weight: number) => {
    scores.set(type, (scores.get(type) ?? 0) + weight);
  };

  // Check if homepage
  try {
    const parsed = new URL(url);
    if (parsed.pathname === '/' || parsed.pathname === '') {
      return 'homepage';
    }
  } catch { /* ignore */ }

  // URL patterns
  for (const [pattern, type, weight] of URL_PATTERNS) {
    if (pattern.test(url)) add(type, weight);
  }

  // Title keywords
  for (const [pattern, type, weight] of TITLE_KEYWORDS) {
    if (pattern.test(title)) add(type, weight);
  }

  // Content features
  const qaPairs = (bodyText.match(/\?[\s\n]/g) || []).length;
  if (qaPairs >= 3) add('faq', 2);

  if (/\$\d+|\d+\/mo|per month|free tier/i.test(bodyText)) add('pricing', 2);

  // Pick highest score
  let best: PageType = 'unknown';
  let bestScore = 1; // threshold
  for (const [type, score] of scores) {
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  }

  return best;
}
