import type { AgentSitePlugin } from './types.js';
import { log } from '../utils/logger.js';
import wordpressPlugin from './builtin/wordpress.js';
import staticSitePlugin from './builtin/static-site.js';

const BUILTIN_PLUGINS: Record<string, AgentSitePlugin> = {
  'wordpress': wordpressPlugin,
  'static-site': staticSitePlugin,
};

export async function loadPlugins(pluginNames: string[]): Promise<AgentSitePlugin[]> {
  const plugins: AgentSitePlugin[] = [];

  for (const name of pluginNames) {
    try {
      let plugin: AgentSitePlugin;

      if (name in BUILTIN_PLUGINS) {
        plugin = BUILTIN_PLUGINS[name];
      } else if (name.startsWith('./') || name.startsWith('../') || name.startsWith('/')) {
        const mod = await import(name);
        plugin = mod.default ?? mod;
      } else {
        const mod = await import(`agentsite-plugin-${name}`);
        plugin = mod.default ?? mod;
      }

      plugins.push(plugin);
      log.info(`Loaded plugin: ${plugin.name} v${plugin.version}`);
    } catch (err) {
      log.warn(`Failed to load plugin "${name}": ${(err as Error).message}`);
    }
  }

  return plugins;
}

export async function runHook<K extends keyof NonNullable<AgentSitePlugin['hooks']>>(
  plugins: AgentSitePlugin[],
  hook: K,
  ...args: Parameters<NonNullable<NonNullable<AgentSitePlugin['hooks']>[K]>>
): Promise<void> {
  for (const plugin of plugins) {
    const fn = plugin.hooks?.[hook];
    if (fn) {
      await (fn as (...a: unknown[]) => Promise<unknown>)(...args);
    }
  }
}

export async function runAfterScan(plugins: AgentSitePlugin[], pages: import('../types/page.js').ScannedPage[]): Promise<import('../types/page.js').ScannedPage[]> {
  let result = pages;
  for (const plugin of plugins) {
    if (plugin.hooks?.afterScan) {
      result = await plugin.hooks.afterScan(result);
    }
  }
  return result;
}
