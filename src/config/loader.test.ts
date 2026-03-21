import { describe, it, expect } from 'vitest';
import { toSlug } from './loader.js';

describe('toSlug', () => {
  it('converts to lowercase', () => {
    expect(toSlug('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(toSlug('my site name')).toBe('my-site-name');
  });

  it('replaces special characters', () => {
    expect(toSlug('My Site! #1')).toBe('my-site-1');
  });

  it('removes leading and trailing hyphens', () => {
    expect(toSlug('  Hello  ')).toBe('hello');
  });

  it('collapses multiple separators', () => {
    expect(toSlug('Hello   World---Test')).toBe('hello-world-test');
  });

  it('handles already slug-like input', () => {
    expect(toSlug('my-site')).toBe('my-site');
  });

  it('handles numbers', () => {
    expect(toSlug('Version 2.0')).toBe('version-2-0');
  });

  it('handles Chinese characters by removing them', () => {
    const result = toSlug('中文 Site');
    // Chinese chars are non-alphanumeric, get replaced
    expect(result).toBe('site');
  });
});
