import { describe, it, expect } from 'vitest';
import { sha256 } from './hash.js';

describe('sha256', () => {
  it('returns a hex string', () => {
    const result = sha256('hello');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('same input produces same output', () => {
    expect(sha256('test content')).toBe(sha256('test content'));
  });

  it('different inputs produce different outputs', () => {
    expect(sha256('content a')).not.toBe(sha256('content b'));
  });

  it('handles empty string', () => {
    const result = sha256('');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('handles unicode content', () => {
    const result = sha256('中文内容');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});
