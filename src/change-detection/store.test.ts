import { describe, it, expect } from 'vitest';
import { findChangedUrls } from './store.js';

describe('findChangedUrls', () => {
  it('detects new pages as changed', () => {
    const old = {};
    const next = { 'https://example.com/new': 'hash1' };
    const { changed, deleted } = findChangedUrls(old, next);
    expect(changed).toContain('https://example.com/new');
    expect(deleted).toHaveLength(0);
  });

  it('detects content changes', () => {
    const old = { 'https://example.com/page': 'oldhash' };
    const next = { 'https://example.com/page': 'newhash' };
    const { changed, deleted } = findChangedUrls(old, next);
    expect(changed).toContain('https://example.com/page');
    expect(deleted).toHaveLength(0);
  });

  it('detects deleted pages', () => {
    const old = { 'https://example.com/gone': 'hash1' };
    const next = {};
    const { changed, deleted } = findChangedUrls(old, next);
    expect(deleted).toContain('https://example.com/gone');
    expect(changed).toHaveLength(0);
  });

  it('returns empty for no changes', () => {
    const hashes = { 'https://example.com/page': 'samehash' };
    const { changed, deleted } = findChangedUrls(hashes, hashes);
    expect(changed).toHaveLength(0);
    expect(deleted).toHaveLength(0);
  });

  it('handles multiple changes simultaneously', () => {
    const old = {
      'https://example.com/a': 'hash-a',
      'https://example.com/b': 'hash-b',
      'https://example.com/c': 'hash-c',
    };
    const next = {
      'https://example.com/a': 'hash-a-new', // changed
      'https://example.com/b': 'hash-b',     // unchanged
      // c deleted
      'https://example.com/d': 'hash-d',     // new
    };
    const { changed, deleted } = findChangedUrls(old, next);
    expect(changed).toContain('https://example.com/a');
    expect(changed).toContain('https://example.com/d');
    expect(changed).not.toContain('https://example.com/b');
    expect(deleted).toContain('https://example.com/c');
  });

  it('handles empty stores', () => {
    const { changed, deleted } = findChangedUrls({}, {});
    expect(changed).toHaveLength(0);
    expect(deleted).toHaveLength(0);
  });
});
