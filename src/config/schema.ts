import { z } from 'zod';

const siteInfoSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  description: z.string().default(''),
});

const scanSchema = z.object({
  maxPages: z.number().int().positive().default(100),
  concurrency: z.number().int().positive().default(3),
  delayMs: z.number().int().nonnegative().default(200),
  include: z.array(z.string()).default(['**']),
  exclude: z.array(z.string()).default([]),
  respectRobotsTxt: z.boolean().default(true),
}).default({});

const outputSchema = z.object({
  dir: z.string().default('.agentsite'),
  formats: z.array(z.enum(['llms-txt', 'agent-sitemap', 'agent-index', 'structured'])).default(['llms-txt', 'agent-sitemap', 'agent-index', 'structured']),
}).default({});

const accessSchema = z.object({
  allowedPages: z.array(z.string()).default(['**']),
  blockedPages: z.array(z.string()).default([]),
  allowedTypes: z.array(z.string()).default(['docs', 'faq', 'blog', 'product', 'pricing', 'about', 'contact', 'changelog']),
  summaryOnly: z.boolean().default(false),
  allowSearch: z.boolean().default(true),
}).default({});

const siteEntrySchema = z.object({
  site: siteInfoSchema,
  scan: scanSchema,
  output: outputSchema,
  access: accessSchema,
});

export const configSchema = z.object({
  site: siteInfoSchema,
  scan: scanSchema,
  output: outputSchema,
  server: z.object({
    port: z.number().int().positive().default(3141),
    rateLimit: z.object({
      max: z.number().int().positive().default(60),
      timeWindow: z.string().default('1 minute'),
    }).default({}),
    accessLog: z.boolean().default(true),
  }).default({}),
  llm: z.object({
    apiUrl: z.string().default('https://integrate.api.nvidia.com/v1'),
    apiKey: z.string().default('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'),
    model: z.string().default('minimaxai/minimax-m2.5'),
  }).optional(),
  access: accessSchema,
  plugins: z.array(z.string()).default([]),
  sites: z.array(siteEntrySchema).optional(),
});

export type ValidatedConfig = z.infer<typeof configSchema>;
export type SiteEntry = z.infer<typeof siteEntrySchema>;
