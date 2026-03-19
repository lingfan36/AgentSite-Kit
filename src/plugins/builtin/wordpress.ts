import type { AgentSitePlugin } from '../types.js';

const plugin: AgentSitePlugin = {
  name: 'wordpress',
  version: '1.0.0',
  hooks: {
    async afterScan(pages) {
      return pages.map((page) => {
        const url = page.url.toLowerCase();

        // Detect WordPress patterns and enhance classification
        if (url.includes('/wp-content/') || url.includes('/wp-json/')) {
          // Already classified, skip
          return page;
        }

        // WordPress category/tag archives
        if (url.includes('/category/')) {
          return { ...page, tags: [...(page.tags ?? []), 'wordpress-category'] };
        }
        if (url.includes('/tag/')) {
          return { ...page, tags: [...(page.tags ?? []), 'wordpress-tag'] };
        }

        // WordPress author pages
        if (url.includes('/author/')) {
          return { ...page, tags: [...(page.tags ?? []), 'wordpress-author'] };
        }

        return page;
      });
    },
  },
};

export default plugin;
