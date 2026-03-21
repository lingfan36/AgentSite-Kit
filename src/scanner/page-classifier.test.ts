import { describe, it, expect } from 'vitest';
import { classifyPage } from './page-classifier.js';

const base = { metaOgType: undefined, headings: [], bodyText: '' };

describe('classifyPage - homepage', () => {
  it('detects root path as homepage', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/', title: '' })).toBe('homepage');
  });

  it('detects empty path as homepage', () => {
    expect(classifyPage({ ...base, url: 'https://example.com', title: '' })).toBe('homepage');
  });
});

describe('classifyPage - URL patterns', () => {
  it('classifies /docs/ as docs', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/docs/intro', title: '' })).toBe('docs');
  });

  it('classifies /documentation as docs', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/documentation', title: '' })).toBe('docs');
  });

  it('classifies /pricing as pricing', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/pricing', title: '' })).toBe('pricing');
  });

  it('classifies /blog/ as blog', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/blog/post-1', title: '' })).toBe('blog');
  });

  it('classifies /changelog as changelog', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/changelog', title: '' })).toBe('changelog');
  });

  it('classifies /about as about', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/about', title: '' })).toBe('about');
  });

  it('classifies /contact as contact', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/contact', title: '' })).toBe('contact');
  });

  it('classifies /faq as faq', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/faq', title: '' })).toBe('faq');
  });
});

describe('classifyPage - title keywords (English)', () => {
  it('classifies "Documentation" title as docs', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/page', title: 'API Documentation' })).toBe('docs');
  });

  it('classifies "Pricing Plans" title as pricing', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/page', title: 'Pricing Plans' })).toBe('pricing');
  });

  it('classifies "FAQ" title as faq', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/page', title: 'Frequently Asked Questions' })).toBe('faq');
  });
});

describe('classifyPage - title keywords (Chinese)', () => {
  it('classifies Chinese docs title', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/page', title: '使用文档' })).toBe('docs');
  });

  it('classifies Chinese pricing title', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/page', title: '价格方案' })).toBe('pricing');
  });

  it('classifies Chinese FAQ title', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/page', title: '常见问题' })).toBe('faq');
  });
});

describe('classifyPage - body signals', () => {
  it('detects pricing from $ symbol in body', () => {
    const result = classifyPage({
      ...base,
      url: 'https://example.com/plans',
      title: '',
      bodyText: 'Pro plan $29/mo, Enterprise $99/mo',
    });
    expect(result).toBe('pricing');
  });

  it('detects pricing from Chinese price symbol', () => {
    const result = classifyPage({
      ...base,
      url: 'https://example.com/page',
      title: '',
      bodyText: '专业版 ¥99/月，企业版 ¥499/月',
    });
    expect(result).toBe('pricing');
  });
});

describe('classifyPage - unknown', () => {
  it('returns unknown for unrecognized pages', () => {
    expect(classifyPage({ ...base, url: 'https://example.com/random', title: 'Random Page' })).toBe('unknown');
  });
});
