# AgentSite Kit

[English](./README.md)

让任何网站对 AI Agent 友好。

AgentSite Kit 扫描网站的公开页面，提取并分类内容，然后生成结构化数据和 API，让 AI Agent 能稳定地读取、检索和查询你的网站内容。

在 AI 搜索（Perplexity、ChatGPT Search）和自动化 Agent 的时代，网站不能只有人类可读的 HTML。AgentSite Kit 在你现有网站之上添加一层 **Agent 可读层** —— 无需重新设计网站。

## 功能特性

- **扫描** — 通过 sitemap 或爬虫发现页面，遵守 robots.txt
- **分类** — 自动识别页面类型（文档、FAQ、博客、产品、定价、更新日志等）
- **提取** — 标题、摘要、标题层级、元数据、正文内容
- **生成** — 标准化输出文件：`llms.txt`、`agent-sitemap.json`、`agent-index.json` 及分类结构化 JSON
- **服务** — 提供查询 API，供 Agent 搜索和获取内容
- **MCP 支持** — 兼容 Model Context Protocol，可直接接入 AI 工具
- **增量更新** — 检测变化，只重新处理有更新的页面

## 快速开始

```bash
# 安装依赖并构建
npm install
npm run build

# 初始化配置（交互式）
npx agentsite init

# 扫描网站
npx agentsite scan

# 生成 Agent 可读文件
npx agentsite generate

# 启动 API 服务
npx agentsite serve
```

API 服务默认运行在 `http://localhost:3141`。

## 命令一览

| 命令 | 说明 |
|------|------|
| `agentsite init` | 交互式创建 `agentsite.config.yaml` |
| `agentsite init -t <模板>` | 使用行业模板初始化 |
| `agentsite init --list-templates` | 列出可用模板 |
| `agentsite scan` | 扫描网站并分类页面 |
| `agentsite scan --no-llm` | 扫描时不使用 LLM 辅助分类 |
| `agentsite generate` | 根据扫描结果生成 Agent 可读文件 |
| `agentsite serve` | 启动 API 服务 |
| `agentsite serve -p 8080` | 指定端口启动 |
| `agentsite update` | 增量更新 — 重新扫描、检测变化、重新生成 |
| `agentsite mcp` | 启动 MCP 服务（stdio 模式） |

## 行业模板

内置多种常见网站类型的预配置模板：

- `docs-site` — 文档站
- `blog` — 博客 / 内容站
- `saas` — SaaS 产品官网
- `knowledge-base` — 知识库 / Wiki
- `ecommerce` — 电商网站
- `portfolio` — 个人作品集
- `api-docs` — API 文档
- `community` — 社区论坛

```bash
npx agentsite init -t saas
```

## API 接口

启动 `agentsite serve` 后可用：

| 接口 | 说明 |
|------|------|
| `GET /api/health` | 健康检查 |
| `GET /api/search?q=关键词` | 全文搜索 |
| `GET /api/pages/:id` | 获取单个页面 |
| `GET /api/docs` | 文档数据 |
| `GET /api/faq` | FAQ 数据 |
| `GET /api/products` | 产品数据 |
| `GET /api/articles` | 文章 / 博客数据 |
| `GET /api/pricing` | 定价信息 |
| `GET /api/changelog` | 更新日志 |
| `GET /api/stats` | 站点统计 |
| `GET /api/config` | 当前配置 |
| `GET /api/files` | 生成文件列表 |
| `GET /api/access-log` | 访问日志 |
| `GET /api/sites` | 所有配置的站点（多站点模式） |

## 生成文件

执行 `scan` + `generate` 后，`.agentsite/` 目录结构：

```
.agentsite/
├── llms.txt                  # LLM 友好的纯文本概览
├── agent-sitemap.json        # Agent 专用站点地图
├── agent-index.json          # 结构化站点索引
├── scan-result.json          # 原始扫描数据
└── data/
    ├── docs.json             # 文档
    ├── faq.json              # 常见问题
    ├── products.json         # 产品
    ├── articles.json         # 文章 / 博客
    ├── pricing.json          # 定价
    └── changelog.json        # 更新日志
```

## 配置说明

`agentsite.config.yaml` 示例：

```yaml
site:
  url: https://example.com
  name: 我的网站
  description: 网站简介

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

### LLM 辅助模式

添加 LLM 配置以启用 AI 驱动的页面分类和摘要生成：

```yaml
llm:
  provider: openai   # 或 anthropic 等
  apiKey: sk-...
  model: gpt-4o-mini
```

## Docker 部署

```bash
# 构建并运行
docker compose up -d

# 或手动构建
docker build -t agentsite .
docker run -p 3141:3141 -v ./agentsite.config.yaml:/app/agentsite.config.yaml:ro agentsite
```

## MCP 集成

AgentSite Kit 可作为 MCP 服务运行，让 AI 工具（Claude、Cursor 等）直接查询你的站点数据：

```bash
npx agentsite mcp
```

在 MCP 客户端配置中添加：

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

## 插件系统

AgentSite Kit 支持插件，可在生命周期各阶段介入：

```yaml
plugins:
  - ./my-plugin.js
```

支持的钩子：`beforeScan`、`afterScan`、`beforeGenerate`、`afterGenerate`。

## 环境要求

- Node.js >= 18

## 许可证

MIT
