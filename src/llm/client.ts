import axios from 'axios';
import type { AgentSiteConfig } from '../types/config.js';

export interface LlmConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function getLlmConfig(config?: AgentSiteConfig): LlmConfig | null {
  // Priority: env vars > config file
  const apiUrl = process.env.AGENTSITE_LLM_API_URL || config?.llm?.apiUrl;
  const apiKey = process.env.AGENTSITE_LLM_API_KEY || config?.llm?.apiKey;
  const model = process.env.AGENTSITE_LLM_MODEL || config?.llm?.model;

  if (!apiUrl || !apiKey || !model) return null;
  return { apiUrl, apiKey, model };
}

export async function chatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const res = await axios.post(
    `${config.apiUrl}/chat/completions`,
    {
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.3,
      top_p: 0.95,
      max_tokens: options?.maxTokens ?? 1024,
      stream: false,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      timeout: 30000,
    },
  );

  return res.data.choices[0]?.message?.content?.trim() ?? '';
}
