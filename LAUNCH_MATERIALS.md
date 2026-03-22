# AgentSite Kit — 发布文案

---

## 1. Hacker News — Show HN

### 标题
```
Show HN: AgentSite Kit – Open-source CLI to make any website AI-agent friendly
```

### 首条跟帖评论（背景故事）
```
Hi HN, I built AgentSite Kit because I noticed a growing gap: AI search engines
(Perplexity, ChatGPT Search, Google AI Overviews) are replacing traditional search,
but most websites are still optimized only for human readers and Google's crawler.

93% of AI search sessions end without a website click. The AI reads your site,
summarizes it, and answers the user directly. If your content isn't structured
for AI consumption, you're invisible.

AgentSite Kit is a CLI tool that scans your website, classifies pages automatically
(docs, FAQ, blog, product, pricing, etc.), and generates:

- llms.txt — a plain text file that helps LLMs understand your site at a glance
- agent-sitemap.json / agent-index.json — structured navigation for agents
- A query API server for real-time agent access
- An MCP server for direct integration with Claude, Cursor, etc.

It's different from simple llms.txt generators (Firecrawl, SiteSpeakAI) because
it does the full pipeline: scan → classify → extract → generate → serve → MCP.
It also supports incremental updates, multi-site management, industry templates,
and a plugin system.

Built with TypeScript, Fastify, and Cheerio. No external dependencies required
for basic usage (LLM integration is optional for enhanced classification).

I'd love feedback on the tool and the overall approach to making websites
"agent-friendly." What would you want from a tool like this?

GitHub: https://github.com/lingfan36/AgentSite-Kit
npm: npm install -g agentsite-kit
```

---

## 2. Product Hunt

### Tagline
```
Make any website AI-agent friendly — open source CLI
```

### Description
```
AgentSite Kit scans your website, classifies pages, and generates structured
data (llms.txt, JSON indexes, APIs) that AI agents can reliably read and query.

In the era of AI search, 93% of sessions end without a click. Your website
needs an Agent-readable layer. AgentSite Kit adds it — no redesign required.

Features:
- Automatic page classification (docs, FAQ, blog, product, pricing...)
- llms.txt + structured JSON generation
- Query API server for agent access
- MCP (Model Context Protocol) integration
- Industry templates (SaaS, docs, blog, e-commerce...)
- Plugin system with lifecycle hooks
- Incremental updates — only re-processes changed pages

Open source, self-hosted, MIT licensed.
```

### Topics
```
Developer Tools, AI, Open Source, SEO, CLI
```

---

## 3. Reddit

### r/webdev
```
Title: I built an open-source CLI to make websites AI-agent friendly (llms.txt,
structured data, query API, MCP)

Body:
With AI search (Perplexity, ChatGPT, Google AI Overviews) replacing traditional
search, I built a tool to bridge the gap.

AgentSite Kit scans your website, auto-classifies pages, and generates:
- llms.txt for LLM comprehension
- Structured JSON for agent navigation
- A query API for real-time access
- An MCP server for Claude/Cursor integration

One command to scan, one to generate, one to serve. Works with any website.

GitHub: https://github.com/lingfan36/AgentSite-Kit

Would love feedback from the community.
```

### r/programming
```
Title: Show r/programming: AgentSite Kit — CLI toolkit for Generative Engine
Optimization (GEO)

Body:
Traditional SEO optimizes for Google's blue links. GEO (Generative Engine
Optimization) optimizes for AI-generated answers.

I built AgentSite Kit to automate this: it crawls your site, classifies pages,
extracts structured content, generates llms.txt + JSON indexes, and serves
a query API + MCP server.

Built with TypeScript/Fastify/Cheerio. Open source, MIT.

Technically interesting bits:
- Rule-based page classification with optional LLM fallback
- Incremental change detection via content hashing
- MCP (Model Context Protocol) server for direct AI tool integration
- Plugin system with beforeScan/afterScan/beforeGenerate/afterGenerate hooks

GitHub: https://github.com/lingfan36/AgentSite-Kit
```

---

## 4. V2EX

### 标题
```
分享我做的开源工具：AgentSite Kit — 让任何网站对 AI Agent 友好
```

### 正文
```
背景：

AI 搜索（Perplexity、ChatGPT Search、Google AI Overviews）正在取代传统搜索引擎。
Gartner 预测 2026 年传统搜索量下降 25%。但大多数网站还只针对人类和 Google 爬虫做
了优化，对 AI Agent 来说是"半盲"状态。

93% 的 AI 搜索不会产生网站访问——AI 直接读你的网站、总结内容、回答用户。
如果网站没有结构化的 Agent 可读层，就会在 AI 时代变得"隐形"。

这就是 GEO（Generative Engine Optimization，生成式引擎优化）的概念——新的 SEO。

我做了什么：

AgentSite Kit 是一个 CLI 工具，一键让网站变得 AI Agent 友好：

1. 扫描网站，自动分类页面（文档、FAQ、博客、产品、定价...）
2. 生成 llms.txt（让 LLM 一眼看懂你的网站）
3. 生成结构化 JSON 索引
4. 启动查询 API 服务
5. 支持 MCP（Model Context Protocol），直接对接 Claude、Cursor 等 AI 工具

和竞品的区别：

市面上有 Firecrawl、SiteSpeakAI 等 llms.txt 生成器，但它们只做单一功能。
AgentSite Kit 做全流程：扫描 → 分类 → 提取 → 生成 → 服务 → MCP。
还支持增量更新、多站点、行业模板、插件系统。

技术栈：TypeScript + Fastify + Cheerio，MIT 开源。

npm install -g agentsite-kit
GitHub: https://github.com/lingfan36/AgentSite-Kit

欢迎试用和反馈！
```

---

## 5. 掘金

### 标题
```
GEO 时代的基础设施：我开源了 AgentSite Kit，一键让网站对 AI Agent 友好
```

### 正文

用 V2EX 的内容，加上更多技术细节：

- 代码架构解析
- 工作流图示（scan → classify → extract → generate → serve）
- 实际使用示例（扫描一个真实网站的输出）
- 竞品对比表格
- 未来规划

### 标签
```
AI, CLI, 开源, GEO, SEO, TypeScript, MCP
```
