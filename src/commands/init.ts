import { Command } from 'commander';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import yaml from 'js-yaml';
import { log } from '../utils/logger.js';
import { normalizeUrl } from '../utils/url.js';
import { listTemplates, loadTemplate, applyTemplate } from '../templates/registry.js';

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export function registerInitCommand(program: Command) {
  program
    .command('init')
    .description('Initialize AgentSite config for your website')
    .option('-t, --template <name>', 'Use an industry template (docs-site, blog, saas, knowledge-base, ecommerce, portfolio, api-docs, community)')
    .option('--list-templates', 'List available templates')
    .action(async (opts) => {
      // List templates
      if (opts.listTemplates) {
        const templates = listTemplates();
        if (templates.length === 0) {
          log.warn('No templates found.');
          return;
        }
        log.info('Available templates:');
        for (const t of templates) {
          console.log(`  ${t.id.padEnd(20)} ${t.description}`);
        }
        return;
      }

      if (existsSync('agentsite.config.yaml')) {
        log.warn('agentsite.config.yaml already exists. Overwrite? (y/N)');
        const confirm = await ask('');
        if (confirm.toLowerCase() !== 'y') {
          log.info('Aborted.');
          return;
        }
      }

      const url = normalizeUrl(await ask('Site URL: '));
      const name = await ask('Site name: ');
      const description = await ask('Site description: ');

      // Build base config
      let config: Record<string, unknown> = {
        site: { url, name, description },
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
          rateLimit: { max: 60, timeWindow: '1 minute' },
          accessLog: true,
        },
        access: {
          allowedPages: ['**'],
          blockedPages: [],
          allowedTypes: ['docs', 'faq', 'blog', 'product', 'pricing', 'about', 'contact', 'changelog'],
          summaryOnly: false,
          allowSearch: true,
        },
      };

      // Apply template if specified
      if (opts.template) {
        const template = loadTemplate(opts.template);
        if (!template) {
          log.error(`Template "${opts.template}" not found. Use --list-templates to see available templates.`);
          process.exit(1);
        }
        config = applyTemplate(config, template);
        log.info(`Applied template: ${template.name}`);
      }

      const yamlContent = yaml.dump(config, { lineWidth: -1, noRefs: true });
      writeFileSync('agentsite.config.yaml', yamlContent, 'utf-8');
      mkdirSync('.agentsite/cache/pages', { recursive: true });
      mkdirSync('.agentsite/data', { recursive: true });

      log.success('Created agentsite.config.yaml');
      log.success('Created .agentsite/ directory');
      log.info('Next: run `agentsite scan` to scan your site.');
    });
}
