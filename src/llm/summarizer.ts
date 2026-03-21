import { chatCompletion, type LlmConfig } from './client.js';
import type { PageType } from '../types/page.js';

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
