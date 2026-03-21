import { chatCompletion, type LlmConfig } from './client.js';
import type { PageType } from '../types/page.js';

const VALID_TYPES: PageType[] = ['homepage', 'docs', 'faq', 'blog', 'product', 'pricing', 'about', 'contact', 'changelog', 'unknown'];

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
      content: `You are a web page classifier. Classify the page into exactly one of these types: ${VALID_TYPES.join(', ')}. Reply with only the type name, nothing else.`,
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
