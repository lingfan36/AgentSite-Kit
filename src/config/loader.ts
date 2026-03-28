import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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

/** Find the config file path (for saving back) */
function findConfigPath(cwd: string = process.cwd()): string {
  for (const file of CONFIG_FILES) {
    const filepath = `${cwd}/${file}`;
    if (existsSync(filepath)) return filepath;
  }
  return `${cwd}/agentsite.config.yaml`;
}

/** Save config back to the YAML config file */
export function saveConfig(config: ValidatedConfig, cwd: string = process.cwd()): void {
  const filepath = findConfigPath(cwd);
  const dump = yaml.dump(JSON.parse(JSON.stringify(config)), { lineWidth: 120, noRefs: true });
  writeFileSync(filepath, dump, 'utf-8');
}

/** Add a site entry to config and persist */
export function addSiteToConfig(
  site: { url: string; name: string; description?: string },
  cwd: string = process.cwd(),
): NormalizedConfig {
  const config = loadConfig(cwd);

  const newEntry: SiteEntry = {
    site: { url: site.url, name: site.name, description: site.description ?? '' },
    scan: config.scan,
    output: { dir: `.agentsite-${toSlug(site.name)}`, formats: config.output.formats },
    access: config.access,
  };

  // If no sites array exists, convert single-site config to multi-site
  if (!config.sites || config.sites.length === 0) {
    config.sites = [
      {
        site: config.site,
        scan: config.scan,
        output: config.output,
        access: config.access,
      },
    ];
  }

  // Prevent duplicates
  const slug = toSlug(site.name);
  if (config.sites.some(s => toSlug(s.site.name) === slug)) {
    throw new Error(`Site "${site.name}" already exists (slug: ${slug})`);
  }

  config.sites.push(newEntry);
  saveConfig(config, cwd);
  return normalizeConfig(config);
}

/** Remove a site entry from config by slug and persist */
export function removeSiteFromConfig(slug: string, cwd: string = process.cwd()): NormalizedConfig {
  const config = loadConfig(cwd);

  if (!config.sites || config.sites.length === 0) {
    // Single-site mode — check if the primary site matches
    if (toSlug(config.site.name) === slug) {
      throw new Error('Cannot remove the only configured site');
    }
    throw new Error(`Site "${slug}" not found`);
  }

  const idx = config.sites.findIndex(s => toSlug(s.site.name) === slug);
  if (idx === -1) {
    throw new Error(`Site "${slug}" not found`);
  }
  if (config.sites.length === 1) {
    throw new Error('Cannot remove the only configured site');
  }

  config.sites.splice(idx, 1);
  saveConfig(config, cwd);
  return normalizeConfig(config);
}
