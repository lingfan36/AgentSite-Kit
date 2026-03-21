import { chatCompletion, type LlmConfig } from './client.js';
import type { PageType } from '../types/page.js';

const VALID_TYPES: PageType[] = ['homepage', 'docs', 'faq', 'blog', 'product', 'pricing', 'about', 'contact', 'changelog', 'unknown'];

const TYPE_DESCRIPTIONS = `
- homepage: The main landing page or root page of the website
- docs: Technical documentation, API reference, guides, tutorials, how-to articles
- faq: Frequently asked questions, help center, Q&A pages
- blog: Blog posts, articles, news, editorial content
- product: Product pages, feature descriptions, solution overviews
- pricing: Pricing plans, subscription tiers, cost information
- about: About us, team, company info, mission pages
- contact: Contact forms, support pages, office locations
- changelog: Release notes, version history, what's new, update logs
- unknown: Any page that doesn't clearly fit the above categories
`.trim();

export async function llmClassifyPage(
  config: LlmConfig,
  url: string,
  title: string,
  bodyText: string,
): Promise<PageType> {
  const truncated = bodyText.slice(0, 2000);
  const response = await chatCompletion(config, [
    {
      role: 'system',
      content: `You are a web page classifier. Given a URL, title, and content snippet, classify the page into exactly one of these types:\n\n${TYPE_DESCRIPTIONS}\n\nReply with only the type name, nothing else.`,
    },
    {
      role: 'user',
      content: `URL: ${url}\nTitle: ${title}\n\nContent:\n${truncated}`,
    },
  ], { temperature: 0.1, maxTokens: 32 });

  const cleaned = response.toLowerCase().trim() as PageType;
  if (VALID_TYPES.includes(cleaned)) return cleaned;
  return 'unknown';
}
