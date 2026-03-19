import { readFileSync, existsSync } from 'node:fs';
import yaml from 'js-yaml';
import { configSchema, type ValidatedConfig, type SiteEntry } from './schema.js';

const CONFIG_FILES = ['agentsite.config.yaml', 'agentsite.config.yml', 'agentsite.config.json'];

export interface NormalizedConfig extends ValidatedConfig {
  /** Always populated: either from `sites` array or auto-wrapped from single-site fields */
  resolvedSites: SiteEntry[];
}

export function loadConfig(cwd: string = process.cwd()): NormalizedConfig {
  for (const file of CONFIG_FILES) {
    const filepath = `${cwd}/${file}`;
    if (!existsSync(filepath)) continue;

    const raw = readFileSync(filepath, 'utf-8');
    const parsed = file.endsWith('.json') ? JSON.parse(raw) : yaml.load(raw);
    const config = configSchema.parse(parsed);

    return normalizeConfig(config);
  }

  throw new Error('Config file not found. Run `agentsite init` first.');
}

function normalizeConfig(config: ValidatedConfig): NormalizedConfig {
  const resolvedSites: SiteEntry[] = config.sites && config.sites.length > 0
    ? config.sites
    : [{
        site: config.site,
        scan: config.scan,
        output: config.output,
        access: config.access,
      }];

  return { ...config, resolvedSites };
}

/** Convert a site name to a URL-safe slug */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
