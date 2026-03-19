import { chatCompletion, type LlmConfig } from './client.js';

export async function llmSummarize(config: LlmConfig, title: string, bodyText: string): Promise<string> {
  const truncated = bodyText.slice(0, 3000);
  const response = await chatCompletion(config, [
    {
      role: 'system',
      content: 'You are a concise content summarizer. Summarize the following web page content in 1-2 sentences. Focus on what this page is about and its key information. Reply in the same language as the content.',
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
