import { describe, it, expect } from 'vitest';
import { normalizeUrl, isSameOrigin, urlToId } from './url.js';

describe('normalizeUrl', () => {
  it('adds https when no protocol', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });

  it('keeps https protocol', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('keeps http protocol', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('removes trailing slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
  });

  it('removes multiple trailing slashes', () => {
    expect(normalizeUrl('https://example.com///')).toBe('https://example.com');
  });

  it('trims whitespace', () => {
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
  });

  it('preserves path without trailing slash', () => {
    expect(normalizeUrl('https://example.com/path')).toBe('https://example.com/path');
  });
});

describe('isSameOrigin', () => {
  it('returns true for same origin', () => {
    expect(isSameOrigin('https://example.com', 'https://example.com/page')).toBe(true);
  });

  it('returns false for different domain', () => {
    expect(isSameOrigin('https://example.com', 'https://other.com')).toBe(false);
  });

  it('returns false for different protocol', () => {
    expect(isSameOrigin('https://example.com', 'http://example.com')).toBe(false);
  });

  it('returns false for different port', () => {
    expect(isSameOrigin('https://example.com', 'https://example.com:8080')).toBe(false);
  });

  it('returns false for invalid URL', () => {
    expect(isSameOrigin('https://example.com', 'not-a-url')).toBe(false);
  });
});

describe('urlToId', () => {
  it('encodes URL to base64url', () => {
    const id = urlToId('https://example.com/page');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    // base64url: no +, /, or =
    expect(id).not.toMatch(/[+/=]/);
  });

  it('same URL produces same id', () => {
    const url = 'https://example.com/page';
    expect(urlToId(url)).toBe(urlToId(url));
  });

  it('different URLs produce different ids', () => {
    expect(urlToId('https://example.com/a')).not.toBe(urlToId('https://example.com/b'));
  });
});
