import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CheckItem {
  id: string;
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details: string;
  suggestion: string;
}

export interface CheckResult {
  url: string;
  items: CheckItem[];
  totalScore: number;
  responseTimeMs: number;
}

const AGENT_BOTS = [
  'GPTBot', 'ChatGPT-User', 'Google-Extended', 'Anthropic',
  'ClaudeBot', 'Claude-Web', 'CCBot', 'PerplexityBot', 'Bytespider',
];

const TIMEOUT = 10000;

async function fetchUrl(url: string): Promise<{ data: string; status: number; timeMs: number }> {
  const start = Date.now();
  const res = await axios.get(url, {
    timeout: TIMEOUT,
    maxRedirects: 5,
    headers: { 'User-Agent': 'AgentScore/1.0 (https://agentscore.dev)' },
    validateStatus: () => true,
    responseType: 'text',
  });
  return { data: res.data, status: res.status, timeMs: Date.now() - start };
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return url.replace(/\/+$/, '');
}

export async function runChecks(rawUrl: string): Promise<CheckResult> {
  const baseUrl = normalizeUrl(rawUrl);
  const items: CheckItem[] = [];

  // Fetch main page
  let html = '';
  let pageTimeMs = 0;
  let pageOk = false;
  try {
    const res = await fetchUrl(baseUrl);
    html = typeof res.data === 'string' ? res.data : '';
    pageTimeMs = res.timeMs;
    pageOk = res.status >= 200 && res.status < 400;
  } catch {
    pageTimeMs = TIMEOUT;
  }

  const $ = pageOk ? cheerio.load(html) : null;

  // 1. llms.txt
  try {
    const res = await fetchUrl(baseUrl + '/llms.txt');
    const found = res.status >= 200 && res.status < 400 && res.data.length > 10;
    items.push({
      id: 'llms-txt',
      name: 'llms.txt',
      passed: found,
      score: found ? 15 : 0,
      maxScore: 15,
      details: found ? 'Found llms.txt with content' : 'No llms.txt found',
      suggestion: found ? '' : 'Create a /llms.txt file describing your site for AI agents. See https://llmstxt.org for the spec.',
    });
  } catch {
    items.push({ id: 'llms-txt', name: 'llms.txt', passed: false, score: 0, maxScore: 15, details: 'Failed to fetch /llms.txt', suggestion: 'Create a /llms.txt file describing your site for AI agents.' });
  }

  // 2. sitemap.xml
  try {
    const res = await fetchUrl(baseUrl + '/sitemap.xml');
    const found = res.status >= 200 && res.status < 400 && res.data.includes('<urlset');
    items.push({
      id: 'sitemap',
      name: 'sitemap.xml',
      passed: found,
      score: found ? 10 : 0,
      maxScore: 10,
      details: found ? 'Valid sitemap.xml found' : 'No valid sitemap.xml',
      suggestion: found ? '' : 'Add a /sitemap.xml to help agents discover your pages.',
    });
  } catch {
    items.push({ id: 'sitemap', name: 'sitemap.xml', passed: false, score: 0, maxScore: 10, details: 'Failed to fetch /sitemap.xml', suggestion: 'Add a /sitemap.xml to help agents discover your pages.' });
  }

  // 3. robots.txt
  try {
    const res = await fetchUrl(baseUrl + '/robots.txt');
    const found = res.status >= 200 && res.status < 400 && res.data.length > 5;
    let blocksAgents = false;
    if (found) {
      const text = res.data.toLowerCase();
      blocksAgents = AGENT_BOTS.some(bot => {
        const pattern = new RegExp(`user-agent:\\s*${bot.toLowerCase()}[\\s\\S]*?disallow:\\s*/`, 'i');
        return pattern.test(text);
      });
      // Also check wildcard block
      if (!blocksAgents) {
        const wildcardBlock = /user-agent:\s*\*[\s\S]*?disallow:\s*\//i.test(text);
        const hasAllow = /allow:\s*\//i.test(text);
        if (wildcardBlock && !hasAllow) blocksAgents = true;
      }
    }
    const score = !found ? 3 : blocksAgents ? 3 : 10;
    items.push({
      id: 'robots',
      name: 'robots.txt',
      passed: found && !blocksAgents,
      score,
      maxScore: 10,
      details: !found ? 'No robots.txt found' : blocksAgents ? 'robots.txt blocks AI bots' : 'robots.txt allows AI bots',
      suggestion: !found ? 'Add a /robots.txt file.' : blocksAgents ? 'Update robots.txt to allow AI agent crawlers (GPTBot, ClaudeBot, etc.).' : '',
    });
  } catch {
    items.push({ id: 'robots', name: 'robots.txt', passed: false, score: 0, maxScore: 10, details: 'Failed to fetch /robots.txt', suggestion: 'Add a /robots.txt file.' });
  }

  // 4. Structured Data (JSON-LD)
  if ($) {
    const jsonLdScripts: string[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      const text = $(el).html();
      if (text) jsonLdScripts.push(text);
    });
    const hasJsonLd = jsonLdScripts.length > 0;
    let validJsonLd = false;
    if (hasJsonLd) {
      try { JSON.parse(jsonLdScripts[0]); validJsonLd = true; } catch {}
    }
    const score = validJsonLd ? 15 : hasJsonLd ? 8 : 0;
    items.push({
      id: 'structured-data',
      name: 'Structured Data (JSON-LD)',
      passed: validJsonLd,
      score,
      maxScore: 15,
      details: validJsonLd ? `Found ${jsonLdScripts.length} JSON-LD block(s)` : hasJsonLd ? 'JSON-LD found but invalid' : 'No JSON-LD structured data',
      suggestion: validJsonLd ? '' : 'Add Schema.org JSON-LD structured data to help agents understand your content.',
    });
  } else {
    items.push({ id: 'structured-data', name: 'Structured Data (JSON-LD)', passed: false, score: 0, maxScore: 15, details: 'Could not load page', suggestion: 'Ensure your page is accessible and add JSON-LD structured data.' });
  }

  // 5. Meta tags completeness
  if ($) {
    const checks = {
      title: !!$('title').text().trim(),
      description: !!($('meta[name="description"]').attr('content')?.trim()),
      'og:title': !!($('meta[property="og:title"]').attr('content')?.trim()),
      'og:description': !!($('meta[property="og:description"]').attr('content')?.trim()),
      'og:image': !!($('meta[property="og:image"]').attr('content')?.trim()),
      'og:type': !!($('meta[property="og:type"]').attr('content')?.trim()),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const score = Math.round((passed / total) * 15);
    const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
    items.push({
      id: 'meta-tags',
      name: 'Meta Tags',
      passed: passed === total,
      score,
      maxScore: 15,
      details: `${passed}/${total} meta tags present` + (missing.length ? `. Missing: ${missing.join(', ')}` : ''),
      suggestion: missing.length ? `Add missing meta tags: ${missing.join(', ')}` : '',
    });
  } else {
    items.push({ id: 'meta-tags', name: 'Meta Tags', passed: false, score: 0, maxScore: 15, details: 'Could not load page', suggestion: 'Ensure your page is accessible.' });
  }

  // 6. Semantic HTML
  if ($) {
    const hasH1 = $('h1').length > 0;
    const hasMain = $('main').length > 0;
    const hasArticle = $('article').length > 0;
    const headingCount = $('h1, h2, h3').length;
    const hasGoodHeadings = headingCount >= 2;
    const passedCount = [hasH1, hasMain || hasArticle, hasGoodHeadings].filter(Boolean).length;
    const score = Math.round((passedCount / 3) * 10);
    const issues: string[] = [];
    if (!hasH1) issues.push('no <h1>');
    if (!hasMain && !hasArticle) issues.push('no <main> or <article>');
    if (!hasGoodHeadings) issues.push('insufficient heading hierarchy');
    items.push({
      id: 'semantic-html',
      name: 'Semantic HTML',
      passed: passedCount === 3,
      score,
      maxScore: 10,
      details: passedCount === 3 ? 'Good semantic structure' : `Issues: ${issues.join(', ')}`,
      suggestion: issues.length ? `Improve HTML semantics: ${issues.join('; ')}.` : '',
    });
  } else {
    items.push({ id: 'semantic-html', name: 'Semantic HTML', passed: false, score: 0, maxScore: 10, details: 'Could not load page', suggestion: 'Ensure your page is accessible.' });
  }

  // 7. Content extractability (signal-to-noise ratio)
  if ($ && html) {
    const totalLength = html.length;
    const $clone = cheerio.load(html);
    $clone('nav, footer, header, aside, .sidebar, .nav, .footer, .header, script, style, noscript, iframe, svg').remove();
    const bodyText = $clone('body').text().replace(/\s+/g, ' ').trim();
    const ratio = totalLength > 0 ? bodyText.length / totalLength : 0;
    const score = ratio > 0.3 ? 10 : ratio > 0.15 ? 7 : ratio > 0.05 ? 4 : 0;
    items.push({
      id: 'content-ratio',
      name: 'Content Extractability',
      passed: ratio > 0.3,
      score,
      maxScore: 10,
      details: `Content-to-HTML ratio: ${(ratio * 100).toFixed(1)}%`,
      suggestion: ratio <= 0.3 ? 'Reduce HTML noise (inline scripts, excessive wrappers). Aim for >30% content ratio.' : '',
    });
  } else {
    items.push({ id: 'content-ratio', name: 'Content Extractability', passed: false, score: 0, maxScore: 10, details: 'Could not load page', suggestion: 'Ensure your page is accessible.' });
  }

  // 8. Page load speed
  {
    const fast = pageTimeMs < 1000;
    const medium = pageTimeMs < 3000;
    const score = fast ? 5 : medium ? 3 : pageOk ? 1 : 0;
    items.push({
      id: 'speed',
      name: 'Page Load Speed',
      passed: fast,
      score,
      maxScore: 5,
      details: pageOk ? `Response time: ${pageTimeMs}ms` : 'Page failed to load',
      suggestion: !fast ? 'Optimize server response time. Aim for <1s.' : '',
    });
  }

  // 9. agent-sitemap.json / agent-index.json
  {
    let foundAny = false;
    const found: string[] = [];
    for (const file of ['agent-sitemap.json', 'agent-index.json']) {
      try {
        const res = await fetchUrl(baseUrl + '/' + file);
        if (res.status >= 200 && res.status < 400) {
          try { JSON.parse(res.data); found.push(file); foundAny = true; } catch {}
        }
      } catch {}
    }
    const score = found.length === 2 ? 10 : found.length === 1 ? 5 : 0;
    items.push({
      id: 'agent-files',
      name: 'Agent Files',
      passed: foundAny,
      score,
      maxScore: 10,
      details: found.length ? `Found: ${found.join(', ')}` : 'No agent-sitemap.json or agent-index.json',
      suggestion: !foundAny ? 'Add agent-sitemap.json and agent-index.json for AI agent navigation. Use AgentSite Kit (http://47.85.109.161:3141/) to generate them.' : '',
    });
  }

  const totalScore = items.reduce((sum, item) => sum + item.score, 0);

  return { url: baseUrl, items, totalScore, responseTimeMs: pageTimeMs };
}
