import type { AgentSiteConfig } from '../types/config.js';

export const defaultConfig: AgentSiteConfig = {
  site: {
    url: '',
    name: '',
    description: '',
  },
  scan: {
    maxPages: 100,
    concurrency: 3,
    delayMs: 200,
    include: ['**'],
    exclude: [],
    respectRobotsTxt: true,
  },
  output: {
    dir: '.agentsite',
    formats: ['llms-txt', 'agent-sitemap', 'agent-index', 'structured'],
  },
  server: {
    port: 3141,
    rateLimit: {
      max: 60,
      timeWindow: '1 minute',
    },
    accessLog: true,
  },
  access: {
    allowedPages: ['**'],
    blockedPages: [],
    allowedTypes: ['docs', 'faq', 'blog', 'product', 'pricing', 'about', 'contact', 'changelog'],
    summaryOnly: false,
    allowSearch: true,
  },
  plugins: [],
};
