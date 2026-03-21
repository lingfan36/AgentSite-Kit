import { describe, it, expect } from 'vitest';
import { extractContent } from './content-extractor.js';

describe('extractContent - title', () => {
  it('extracts og:title', () => {
    const html = `<html><head><meta property="og:title" content="OG Title"/><title>HTML Title</title></head><body></body></html>`;
    expect(extractContent(html, 'https://example.com').title).toBe('OG Title');
  });

  it('falls back to <title>', () => {
    const html = `<html><head><title>HTML Title</title></head><body></body></html>`;
    expect(extractContent(html, 'https://example.com').title).toBe('HTML Title');
  });

  it('falls back to h1', () => {
    const html = `<html><body><h1>H1 Title</h1></body></html>`;
    expect(extractContent(html, 'https://example.com').title).toBe('H1 Title');
  });
});

describe('extractContent - summary', () => {
  it('prefers meta description', () => {
    const html = `<html><head><meta name="description" content="Meta description"/></head><body><p>Body paragraph</p></body></html>`;
    expect(extractContent(html, 'https://example.com').summary).toBe('Meta description');
  });

  it('uses og:description as fallback', () => {
    const html = `<html><head><meta property="og:description" content="OG description"/></head><body></body></html>`;
    expect(extractContent(html, 'https://example.com').summary).toBe('OG description');
  });

  it('uses first paragraph as fallback', () => {
    const html = `<html><body><p>This is a long enough paragraph that should be used as summary content for the page.</p></body></html>`;
    const result = extractContent(html, 'https://example.com');
    expect(result.summary).toContain('long enough paragraph');
  });
});

describe('extractContent - headings', () => {
  it('extracts h1, h2, h3', () => {
    const html = `<html><body><h1>Title</h1><h2>Section</h2><h3>Sub</h3><h4>Ignored</h4></body></html>`;
    const { headings } = extractContent(html, 'https://example.com');
    expect(headings).toContain('Title');
    expect(headings).toContain('Section');
    expect(headings).toContain('Sub');
    expect(headings).not.toContain('Ignored');
  });
});

describe('extractContent - FAQ items', () => {
  it('extracts FAQ from JSON-LD', () => {
    const jsonLd = JSON.stringify({
      '@type': 'FAQPage',
      mainEntity: [
        { name: 'What is this?', acceptedAnswer: { text: 'It is a tool.' } },
        { name: 'How does it work?', acceptedAnswer: { text: 'It crawls websites.' } },
      ],
    });
    const html = `<html><head><script type="application/ld+json">${jsonLd}</script></head><body></body></html>`;
    const { faqItems } = extractContent(html, 'https://example.com');
    expect(faqItems).toHaveLength(2);
    expect(faqItems[0].question).toBe('What is this?');
    expect(faqItems[0].answer).toBe('It is a tool.');
  });

  it('extracts FAQ from details/summary', () => {
    const html = `<html><body><details><summary>What is this?</summary>It is a tool.</details></body></html>`;
    const { faqItems } = extractContent(html, 'https://example.com');
    expect(faqItems.length).toBeGreaterThan(0);
    expect(faqItems[0].question).toBe('What is this?');
  });
});

describe('extractContent - SPA detection', () => {
  it('detects React SPA', () => {
    const html = `<html><body><div id="root"></div></body></html>`;
    const { isSpa } = extractContent(html, 'https://example.com');
    expect(isSpa).toBe(true);
  });

  it('detects Vue SPA', () => {
    const html = `<html><body><div id="app"></div></body></html>`;
    const { isSpa } = extractContent(html, 'https://example.com');
    expect(isSpa).toBe(true);
  });

  it('does not flag content-rich pages as SPA', () => {
    const html = `<html><body><div id="root"><p>${'word '.repeat(100)}</p></div></body></html>`;
    const { isSpa } = extractContent(html, 'https://example.com');
    expect(isSpa).toBe(false);
  });
});

describe('extractContent - metadata', () => {
  it('extracts author from meta', () => {
    const html = `<html><head><meta name="author" content="John Doe"/></head><body></body></html>`;
    expect(extractContent(html, 'https://example.com').author).toBe('John Doe');
  });

  it('extracts tags from keywords meta', () => {
    const html = `<html><head><meta name="keywords" content="tag1, tag2, tag3"/></head><body></body></html>`;
    const { tags } = extractContent(html, 'https://example.com');
    expect(tags).toContain('tag1');
    expect(tags).toContain('tag2');
  });

  it('counts words correctly', () => {
    const words = 'word '.repeat(50).trim();
    const html = `<html><body><p>${words}</p></body></html>`;
    const { wordCount } = extractContent(html, 'https://example.com');
    expect(wordCount).toBeGreaterThan(0);
  });
});
