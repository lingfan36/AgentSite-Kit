<p align="center">
  <br />
  <code>&nbsp;🤖 AgentSite Kit&nbsp;</code>
  <br />
  <strong>Make any website Agent-friendly.</strong>
  <br />
  <br />
  <a href="https://www.npmjs.com/package/agentsite-kit"><img src="https://img.shields.io/npm/v/agentsite-kit.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/agentsite-kit"><img src="https://img.shields.io/npm/dm/agentsite-kit.svg" alt="npm downloads" /></a>
  <a href="https://github.com/lingfan36/AgentSite-Kit/blob/main/LICENSE"><img src="https://img.shields.io/github/license/lingfan36/AgentSite-Kit.svg" alt="license" /></a>
  <img src="https://img.shields.io/node/v/agentsite-kit.svg" alt="node version" />
  <br />
  <br />
  <a href="./README.zh-CN.md">中文文档</a> · <a href="https://github.com/lingfan36/AgentSite-Kit/issues">Report Bug</a> · <a href="https://github.com/lingfan36/AgentSite-Kit/issues">Request Feature</a>
</p>

---

AgentSite Kit scans your website's public pages, extracts and classifies content, then generates structured data and APIs that AI Agents can reliably read, search, and query.

## Why?

**Search is changing.** AI-powered search (Perplexity, ChatGPT Search, Google AI Overviews) and autonomous Agents are replacing traditional search engines. Gartner predicts traditional search volume will drop **25% by 2026**.

The problem: **93% of AI search sessions end without a website visit.** AI engines read your site, summarize it, and answer the user directly. If your site isn't structured for AI consumption, you become invisible.

AgentSite Kit adds an **Agent-readable layer** on top of your existing site — no redesign required:

- Generates `llms.txt` so LLMs understand your site at a glance
- Creates structured JSON indexes for agent navigation
- Serves a query API for real-time agent access
- Supports MCP (Model Context Protocol) for direct AI tool integration

> In the era of **GEO** (Generative Engine Optimization), making your website Agent-friendly isn't optional — it's the new SEO.

## Features

- **Scan** — Discovers pages via sitemap or crawling, respects robots.txt
- **Classify** — Auto-detects page types (docs, FAQ, blog, product, pricing, changelog, etc.)
- **Extract** — Titles, summaries, headings, metadata, and body content
- **Generate** — Standardized output: `llms.txt`, `agent-sitemap.json`, `agent-index.json`, and per-type structured JSON
- **Serve** — Query API for agents to search and retrieve your content
- **MCP** — Model Context Protocol server for direct AI tool integration
- **Incremental Updates** — Only re-processes changed pages
- **LLM-Assisted** — Optional AI-powered classification and summarization
- **Plugin System** — Lifecycle hooks for custom processing
- **Multi-Site** — Manage multiple websites from a single config
- **Dynamic Site Management** — Add, remove, and scan sites via REST API at runtime
- **Docker** — Ready-to-deploy container support

## Quick Start

```bash
# Install globally
npm install -g agentsite-kit

# Initialize config (interactive)
agentsite init

# Scan your website
agentsite scan

# Generate Agent-friendly files
agentsite generate

# Start the API server
agentsite serve
```

Or use without installing:

```bash
npx agentsite-kit init
npx agentsite-kit scan
npx agentsite-kit generate
npx agentsite-kit serve
```

The API server runs on `http://localhost:3141` by default.

## How It Works

```
Your Website                    AgentSite Kit                    AI Agents
┌──────────┐    agentsite scan    ┌──────────────┐    llms.txt      ┌──────────┐
│  HTML     │ ──────────────────> │  Scan &      │ ──────────────> │ ChatGPT  │
│  Pages    │                     │  Classify    │    JSON APIs    │ Claude   │
│  sitemap  │                     │  Extract     │ ──────────────> │ Perplexity│
└──────────┘                     │  Generate    │    MCP          │ Agents   │
                                  └──────────────┘ ──────────────> └──────────┘
```

## Commands

| Command | Description |
|---------|-------------|
| `agentsite init` | Create `agentsite.config.yaml` interactively |
| `agentsite init -t <template>` | Initialize with an industry template |
| `agentsite init --list-templates` | List available templates |
| `agentsite scan` | Scan website and classify pages |
| `agentsite scan --no-llm` | Scan without LLM-assisted classification |
| `agentsite generate` | Generate Agent-friendly files from scan results |
| `agentsite serve` | Start the API server |
| `agentsite serve -p 8080` | Start on a custom port |
| `agentsite update` | Incremental update — re-scan, detect changes, regenerate |
| `agentsite mcp` | Start MCP server over stdio |

## Templates

Pre-configured templates for common site types:

| Template | Use Case |
|----------|----------|
| `docs-site` | Documentation websites |
| `blog` | Blogs and content sites |
| `saas` | SaaS product websites |
| `knowledge-base` | Knowledge base / wiki sites |
| `ecommerce` | E-commerce stores |
| `portfolio` | Personal / portfolio sites |
| `api-docs` | API documentation |
| `community` | Community forums |

```bash
agentsite init -t saas
```

## API Endpoints

Once `agentsite serve` is running:

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/search?q=keyword` | Search across all content |
| `GET /api/pages/:id` | Get a single page |
| `GET /api/docs` | Documentation entries |
| `GET /api/faq` | FAQ entries |
| `GET /api/products` | Product entries |
| `GET /api/articles` | Blog / article entries |
| `GET /api/pricing` | Pricing information |
| `GET /api/changelog` | Changelog entries |
| `GET /api/stats` | Site statistics |
| `GET /api/config` | Current configuration |
| `GET /api/files` | Generated file listing |
| `GET /api/access-log` | Access log |
| `GET /api/sites` | All configured sites (multi-site) |
| `POST /api/sites` | Add a new site dynamically |
| `DELETE /api/sites/:slug` | Remove a site |
| `POST /api/sites/:slug/scan` | Trigger scan for a specific site |
| `POST /api/rescan` | Rescan all sites, or pass `{ "url": "..." }` for ad-hoc scan |

### Site Management API

Manage sites dynamically via API — no need to SSH in and edit config files:

```bash
# Add a new site
curl -X POST http://localhost:3141/api/sites \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com", "name": "Example", "description": "My site"}'

# List all sites
curl http://localhost:3141/api/sites

# Scan a specific site
curl -X POST http://localhost:3141/api/sites/example/scan

# Remove a site
curl -X DELETE http://localhost:3141/api/sites/example

# Ad-hoc scan any URL (without adding to config)
curl -X POST http://localhost:3141/api/rescan \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://any-website.com"}'
```

Changes are persisted to `agentsite.config.yaml` automatically.

## Generated Files

After `scan` + `generate`, the `.agentsite/` directory contains:

```
.agentsite/
├── llms.txt                  # LLM-friendly plain text overview
├── agent-sitemap.json        # Agent-oriented sitemap
├── agent-index.json          # Structured site index
├── scan-result.json          # Raw scan data
└── data/
    ├── docs.json             # Documentation
    ├── faq.json              # FAQs
    ├── products.json         # Products
    ├── articles.json         # Articles / blog posts
    ├── pricing.json          # Pricing
    └── changelog.json        # Changelog
```

## Configuration

`agentsite.config.yaml` example:

```yaml
site:
  url: https://example.com
  name: My Site
  description: A brief description of your site

scan:
  maxPages: 100
  concurrency: 3
  delayMs: 200
  include:
    - "**"
  exclude: []
  respectRobotsTxt: true

output:
  dir: .agentsite
  formats:
    - llms-txt
    - agent-sitemap
    - agent-index
    - structured

server:
  port: 3141
  rateLimit:
    max: 60
    timeWindow: 1 minute
  accessLog: true

access:
  allowedPages:
    - "**"
  blockedPages: []
  allowedTypes:
    - docs
    - faq
    - blog
    - product
    - pricing
    - about
    - contact
    - changelog
  summaryOnly: false
  allowSearch: true
```

### LLM-Assisted Mode

Add LLM config to enable AI-powered page classification and summarization:

```yaml
llm:
  provider: openai   # or anthropic, etc.
  apiKey: sk-...
  model: gpt-4o-mini
```

## Comparison

| Feature | AgentSite Kit | Firecrawl llms.txt | SiteSpeakAI | LLMs.txt Generator |
|---------|:---:|:---:|:---:|:---:|
| llms.txt generation | ✅ | ✅ | ✅ | ✅ |
| Page classification | ✅ | ❌ | ❌ | ❌ |
| Structured JSON export | ✅ | ❌ | ❌ | ❌ |
| Query API server | ✅ | ❌ | ❌ | ❌ |
| Dynamic site management API | ✅ | ❌ | ❌ | ❌ |
| MCP integration | ✅ | ❌ | ❌ | ❌ |
| Incremental updates | ✅ | ❌ | ❌ | ❌ |
| Multi-site support | ✅ | ❌ | ❌ | ❌ |
| Industry templates | ✅ | ❌ | ❌ | ❌ |
| Plugin system | ✅ | ❌ | ❌ | ❌ |
| Open source | ✅ | ✅ | ❌ | ✅ |
| CLI tool | ✅ | ✅ | ❌ | ✅ |
| Self-hosted | ✅ | ❌ | ❌ | ✅ |

## Docker

```bash
# Build and run
docker compose up -d

# Or build manually
docker build -t agentsite .
docker run -p 3141:3141 -v ./agentsite.config.yaml:/app/agentsite.config.yaml:ro agentsite
```

## MCP Integration

AgentSite Kit can run as an MCP server, allowing AI tools (Claude, Cursor, etc.) to directly query your site data:

```bash
agentsite mcp
```

Add to your MCP client config:

```json
{
  "mcpServers": {
    "my-site": {
      "command": "npx",
      "args": ["agentsite-kit", "mcp"]
    }
  }
}
```

## Plugin System

AgentSite Kit supports plugins with lifecycle hooks:

```yaml
plugins:
  - ./my-plugin.js
```

Plugins can hook into `beforeScan`, `afterScan`, `beforeGenerate`, and `afterGenerate` stages.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

[MIT](./LICENSE)

---

<p align="center">
  <a href="https://star-history.com/#lingfan36/AgentSite-Kit&Date">
    <img src="https://api.star-history.com/svg?repos=lingfan36/AgentSite-Kit&type=Date" width="600" alt="Star History" />
  </a>
</p>
