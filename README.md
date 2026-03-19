# AgentSite Kit

[中文文档](./README.zh-CN.md)

Make any website Agent-friendly.

AgentSite Kit scans your website's public pages, extracts and classifies content, then generates structured data and APIs that AI Agents can reliably read, search, and query.

In the age of AI search (Perplexity, ChatGPT Search) and autonomous Agents, websites need more than just human-readable HTML. AgentSite Kit adds an **Agent-readable layer** on top of your existing site — no redesign required.

## What It Does

- **Scans** your site via sitemap or crawling, respects robots.txt
- **Classifies** pages automatically (docs, FAQ, blog, product, pricing, changelog, etc.)
- **Extracts** titles, summaries, headings, metadata, and body content
- **Generates** standardized output files: `llms.txt`, `agent-sitemap.json`, `agent-index.json`, and per-type structured JSON
- **Serves** a query API for Agents to search and retrieve your content
- **Supports MCP** (Model Context Protocol) for direct integration with AI tools
- **Detects changes** incrementally — only re-processes updated pages

## Quick Start

```bash
# Install dependencies and build
npm install
npm run build

# Initialize config (interactive)
npx agentsite init

# Scan your website
npx agentsite scan

# Generate Agent-friendly files
npx agentsite generate

# Start the API server
npx agentsite serve
```

The API server runs on `http://localhost:3141` by default.

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

- `docs-site` — Documentation websites
- `blog` — Blogs and content sites
- `saas` — SaaS product websites
- `knowledge-base` — Knowledge base / wiki sites
- `ecommerce` — E-commerce stores
- `portfolio` — Personal / portfolio sites
- `api-docs` — API documentation
- `community` — Community forums

```bash
npx agentsite init -t saas
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
npx agentsite mcp
```

Add to your MCP client config:

```json
{
  "mcpServers": {
    "my-site": {
      "command": "npx",
      "args": ["agentsite", "mcp"]
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

## Requirements

- Node.js >= 18

## License

MIT
