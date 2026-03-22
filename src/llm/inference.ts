import { chatCompletion, type LlmConfig } from './client.js';
import type { PageType } from '../types/page.js';

// --- Classification ---

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

// --- Summarization ---

const SYSTEM_PROMPTS: Partial<Record<PageType, string>> = {
  docs: 'You are a technical writer assistant. Summarize the following documentation page in 1-2 sentences, focusing on what technology/feature it covers and what the reader will learn.',
  faq: 'You are a support assistant. Summarize the following FAQ page in 1-2 sentences, describing what questions it answers and for whom.',
  blog: 'You are a content editor. Summarize the following blog post in 1-2 sentences, capturing the main insight or argument.',
  product: 'You are a product marketer. Summarize the following product page in 1-2 sentences, highlighting the core value proposition.',
  pricing: 'You are a sales analyst. Summarize the following pricing page in 1-2 sentences, describing available plans and key differentiators.',
  changelog: 'You are a developer advocate. Summarize the following changelog page in 1-2 sentences, highlighting the most important changes.',
};

const DEFAULT_SYSTEM = 'You are a concise content summarizer. Summarize the following web page content in 1-2 sentences. Focus on what this page is about and its key information. Reply in the same language as the content.';

export async function llmSummarize(
  config: LlmConfig,
  title: string,
  bodyText: string,
  pageType?: PageType,
): Promise<string> {
  const truncated = bodyText.slice(0, 3000);
  const systemPrompt = (pageType && SYSTEM_PROMPTS[pageType]) || DEFAULT_SYSTEM;

  const response = await chatCompletion(config, [
    {
      role: 'system',
      content: systemPrompt + ' Reply in the same language as the content.',
    },
    {
      role: 'user',
      content: `Title: ${title}\n\nContent:\n${truncated}`,
    },
  ], { maxTokens: 256 });

  return response;
}

// --- Tag extraction ---

export async function llmExtractTags(config: LlmConfig, title: string, bodyText: string): Promise<string[]> {
  const truncated = bodyText.slice(0, 2000);
  const response = await chatCompletion(config, [
    {
      role: 'system',
      content: 'Extract 3-5 relevant tags/keywords from the following web page. Return only a JSON array of strings, nothing else. Example: ["tag1", "tag2", "tag3"]',
    },
    {
      role: 'user',
      content: `Title: ${title}\n\nContent:\n${truncated}`,
    },
  ], { maxTokens: 128 });

  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch { /* ignore parse error */ }
  return [];
}
