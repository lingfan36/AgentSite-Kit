import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import yaml from 'js-yaml';

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Works both in dev (src/templates/) and bundled (dist/) contexts
const PRESETS_DIR = existsSync(resolve(__dirname, '../../templates/presets'))
  ? resolve(__dirname, '../../templates/presets')
  : resolve(__dirname, '../templates/presets');

const BUILTIN_TEMPLATES = ['docs-site', 'blog', 'saas', 'knowledge-base', 'ecommerce', 'portfolio', 'api-docs', 'community'];

export function listTemplates(): TemplatePreset[] {
  const templates: TemplatePreset[] = [];
  for (const id of BUILTIN_TEMPLATES) {
    const preset = loadTemplate(id);
    if (preset) templates.push(preset);
  }
  return templates;
}

export function loadTemplate(id: string): TemplatePreset | null {
  const filePath = resolve(PRESETS_DIR, `${id}.yaml`);
  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(raw) as Record<string, unknown>;

  return {
    id,
    name: (parsed.name as string) ?? id,
    description: (parsed.description as string) ?? '',
    config: (parsed.config as Record<string, unknown>) ?? {},
  };
}

export function applyTemplate(baseConfig: Record<string, unknown>, template: TemplatePreset): Record<string, unknown> {
  return deepMerge(baseConfig, template.config);
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else {
      result[key] = sv;
    }
  }
  return result;
}
