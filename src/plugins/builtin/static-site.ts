import type { AgentSitePlugin } from '../types.js';

const STATIC_SITE_PATTERNS: Record<string, string[]> = {
  hugo: ['/tags/', '/categories/', '/posts/', '/page/'],
  jekyll: ['/jekyll/', '/_site/', '/collections/'],
  docusaurus: ['/docs/', '/blog/', '/community/'],
  gatsby: ['/gatsby/', '/blog/', '/tags/'],
  vitepress: ['/guide/', '/api/', '/config/'],
  nextjs: ['/_next/', '/api/'],
};

const plugin: AgentSitePlugin = {
  name: 'static-site',
  version: '1.0.0',
  hooks: {
    async afterScan(pages) {
      // Detect which static site generator is likely in use
      const urlSample = pages.slice(0, 50).map((p) => p.url.toLowerCase());
      let detectedGenerator: string | null = null;

      for (const [generator, patterns] of Object.entries(STATIC_SITE_PATTERNS)) {
        const matchCount = patterns.filter((pat) =>
          urlSample.some((url) => url.includes(pat))
        ).length;
        if (matchCount >= 2) {
          detectedGenerator = generator;
          break;
        }
      }

      if (!detectedGenerator) return pages;

      return pages.map((page) => ({
        ...page,
        tags: [...(page.tags ?? []), `ssg-${detectedGenerator}`],
      }));
    },
  },
};

export default plugin;
