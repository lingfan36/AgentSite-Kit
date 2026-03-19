export interface AgentSiteConfig {
  site: {
    url: string;
    name: string;
    description: string;
  };
  scan: {
    maxPages: number;
    concurrency: number;
    delayMs: number;
    include: string[];
    exclude: string[];
    respectRobotsTxt: boolean;
  };
  output: {
    dir: string;
    formats: ('llms-txt' | 'agent-sitemap' | 'agent-index' | 'structured')[];
  };
  server: {
    port: number;
    rateLimit: {
      max: number;
      timeWindow: string;
    };
    accessLog: boolean;
  };
  access: {
    allowedPages: string[];
    blockedPages: string[];
    allowedTypes: string[];
    summaryOnly: boolean;
    allowSearch: boolean;
  };
  llm?: {
    apiUrl: string;
    apiKey: string;
    model: string;
  };
  plugins?: string[];
}
