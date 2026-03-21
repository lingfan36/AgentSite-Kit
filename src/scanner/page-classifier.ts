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
  // English
  [/\b(documentation|docs|guide|reference|api)\b/i, 'docs', 2],
  [/\b(faq|frequently asked|common questions)\b/i, 'faq', 2],
  [/\b(blog|article|post)\b/i, 'blog', 2],
  [/\b(pricing|plans|packages)\b/i, 'pricing', 2],
  [/\b(product|feature|solution)\b/i, 'product', 1],
  [/\b(about|team|company|who we are)\b/i, 'about', 2],
  [/\b(contact|get in touch|support)\b/i, 'contact', 2],
  [/\b(changelog|release notes|what's new|updates|releases)\b/i, 'changelog', 2],
  // Chinese
  [/文档|指南|手册|参考|开发文档|使用文档/, 'docs', 2],
  [/常见问题|FAQ|帮助中心|问答/, 'faq', 2],
  [/博客|文章|资讯|新闻/, 'blog', 2],
  [/价格|定价|套餐|收费|方案/, 'pricing', 2],
  [/产品|功能|特性|解决方案/, 'product', 1],
  [/关于|团队|公司|我们/, 'about', 2],
  [/联系|支持|客服/, 'contact', 2],
  [/更新日志|版本记录|发布说明|更新记录/, 'changelog', 2],
];

const BODY_SIGNALS: [RegExp, PageType, number][] = [
  [/\$\d+|\d+\/mo|per month|free tier|per year|annually/i, 'pricing', 2],
  [/¥\d+|元\/月|元\/年|免费版|付费版|订阅/, 'pricing', 2],
  [/installation|npm install|pip install|yarn add|getting started/i, 'docs', 1],
  [/version \d+\.\d+|released|bug fix|breaking change/i, 'changelog', 1],
];

export function classifyPage(input: ClassifyInput): PageType {
  const { url, title, bodyText, headings } = input;
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

  // Headings signals (weighted lower than title)
  const headingsText = headings.join(' ');
  for (const [pattern, type, weight] of TITLE_KEYWORDS) {
    if (pattern.test(headingsText)) add(type, Math.ceil(weight / 2));
  }

  // Body content signals
  for (const [pattern, type, weight] of BODY_SIGNALS) {
    if (pattern.test(bodyText)) add(type, weight);
  }

  // FAQ detection: question marks density
  const qaPairs = (bodyText.match(/\?[\s\n]/g) || []).length;
  if (qaPairs >= 3) add('faq', 2);

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
