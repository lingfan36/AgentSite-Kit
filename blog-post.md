# Your Website Has an Agent Problem (And You Don't Know It Yet)

Over the past year, something quietly shifted in how people find information on the web. ChatGPT Search, Perplexity, Google's AI Overviews, and a growing number of autonomous agents are now crawling websites — not to index them for a search results page, but to read, summarize, and act on their content directly. These systems are becoming a meaningful traffic source, and in some niches, they're already the dominant one.

The problem is that your website wasn't built for them.

---

## The Web Was Designed for Humans

This isn't a criticism — it's just a fact. HTML is a presentation format. It's designed to render visually in a browser, and over the decades we've layered on navigation bars, sidebars, cookie consent banners, promotional CTAs, footer links, and a dozen other UI elements that make perfect sense to a human visitor but are pure noise to a machine trying to extract meaning.

When ChatGPT Search crawls your documentation site, it doesn't get a clean article. It gets a wall of HTML with your top nav, a sidebar with 40 links, the actual content somewhere in the middle, a "Was this helpful?" widget, a footer with legal links, and maybe a chat bubble injected by your support tool. The agent has to guess what's signal and what's chrome.

Some agents are getting better at this. But "getting better at parsing messy HTML" is the wrong direction to optimize. It's like solving a communication problem by getting better at reading bad handwriting instead of just typing.

There's no standard way to tell an agent: here's what my site contains, here's how to query it, here's what you're allowed to use. We have `robots.txt` for crawl permissions and sitemaps for URL discovery, but nothing that says "here is the semantic structure of my content, machine-readable, ready for you to consume."

---

## What "Agent-Ready" Actually Means

I've been thinking about this as a spectrum. On one end, you have a raw HTML page — technically readable by an agent, but with significant extraction overhead and high noise. On the other end, you have something like a structured API with explicit content types, access controls, and a query interface.

A few things would make a site genuinely agent-ready:

**A machine-readable content index.** Not a sitemap of URLs, but a manifest of what content exists, what type it is, what it's about, and when it was last updated. Something an agent can scan in one request to understand the shape of your site.

**Structured content extraction.** The actual text of your pages, stripped of UI chrome, with metadata attached — title, description, content type, canonical URL. JSON is fine. The point is that the content is unambiguous.

**A query interface.** If an agent wants to find everything on your site about a specific topic, it shouldn't have to crawl every page. A simple search endpoint that returns structured results is a significant upgrade.

**Access control signals.** Which content can agents use? Can they summarize it? Can they train on it? Right now there's no standard way to express this. `robots.txt` is a blunt instrument — it's all-or-nothing at the URL level.

**MCP support.** The Model Context Protocol is emerging as a way for AI systems to interact with external tools and data sources in a structured way. A site that exposes an MCP server is directly consumable by agents without any scraping at all.

None of this is exotic. It's mostly a matter of generating the right artifacts from content that already exists.

---

## What I Built

I got frustrated enough with this gap that I built a tool to address it: [AgentSite Kit](https://github.com/lingfan36/AgentSite-Kit), an open-source CLI that scans a website and generates an agent-readable layer on top of it.

The core idea is simple: point it at a URL, let it crawl, and it produces a set of standardized artifacts that make the site consumable by AI agents without requiring any changes to the site itself.

Here's what it generates:

- **`llms.txt`** — a plain-text file (following the emerging `llms.txt` convention) that gives language models a high-level overview of the site and its content
- **`agent-sitemap.json`** — a structured JSON index of all discovered pages, with metadata, content summaries, and content type classifications
- **Structured JSON per page** — clean content extraction for each page, stripped of navigation and UI elements
- **A query API server** — a lightweight HTTP server that lets agents search and retrieve content programmatically
- **An MCP server** — so agents that support the Model Context Protocol can interact with the site's content directly as a tool

The workflow is four commands:

```bash
agentkit init          # configure your target site
agentkit scan          # crawl and extract content
agentkit generate      # produce the agent-readable artifacts
agentkit serve         # start the API and MCP server
```

The scan step does the heavy lifting: it fetches pages, strips UI chrome using content extraction heuristics, classifies content types (documentation, blog post, product page, etc.), and builds an internal graph of the site structure. The generate step takes that graph and produces the artifacts. The serve step exposes everything through a local API.

A concrete example: I ran it against a mid-sized developer documentation site with about 400 pages. The scan took a few minutes. The resulting `agent-sitemap.json` was a clean index of all 400 pages with titles, descriptions, content types, and word counts. The query API let me search across all of them with a single HTTP request. An agent using this could understand the full scope of the documentation in seconds, rather than crawling hundreds of HTML pages.

---

## What's Missing (And What Comes Next)

AgentSite Kit is a practical tool, but it's also pointing at a larger problem: we don't have standards here yet.

`llms.txt` is a community proposal, not a spec. There's no equivalent of `robots.txt` for agent permissions that's widely adopted. There's no standard schema for a machine-readable site index. Every agent is making its own decisions about how to parse and use web content, which means every site is being interpreted differently by different systems.

I think a few things need to happen:

**An open standard for agent-readable site manifests.** Something like a `agent.json` at the root of a domain — analogous to `robots.txt` but richer. It would declare what content is available, how to access it, and what agents are permitted to do with it.

**Agent analytics.** Right now, most sites have no visibility into how AI agents are consuming their content. You can see Googlebot in your logs, but you can't easily distinguish ChatGPT Search from a random scraper, and you have no idea what content is being summarized or cited. This is a blind spot that will matter more as agent traffic grows.

**"Agent SEO" as a discipline.** Traditional SEO is about making content legible to search engine crawlers. Agent SEO is about making content legible to AI systems — which means structured data, clear content hierarchy, explicit metadata, and machine-readable access points. The practices are related but not identical.

I'm planning to add agent traffic analytics to AgentSite Kit — a way to log and analyze which agents are hitting the served endpoints, what they're querying, and what content they're consuming. It won't capture agents that bypass the kit entirely and scrape raw HTML, but for agents that use the structured interface, it would give site owners real visibility.

---

## The Broader Point

The web has gone through several transitions in how content gets discovered and consumed. RSS was an early attempt at machine-readable content syndication. Structured data markup (schema.org) was another. Neither fully solved the problem, but both moved things forward.

AI agents are a more significant shift than either of those. They're not just indexing content — they're reading it, synthesizing it, and acting on it. A site that's well-structured for agents will be cited more accurately, summarized more faithfully, and integrated more easily into agent workflows. A site that's a wall of HTML will be misrepresented, ignored, or scraped badly.

This isn't about chasing a trend. It's about the fact that a meaningful fraction of your users may soon be non-human, and right now you have no infrastructure for that.

AgentSite Kit is my attempt to build that infrastructure, at least at the individual site level. It's open source, it's early, and I'd genuinely like feedback from people who've thought about this problem.

GitHub: [https://github.com/lingfan36/AgentSite-Kit](https://github.com/lingfan36/AgentSite-Kit)

If you've run into this problem from a different angle — building agents that consume web content, or running a site that's trying to be more AI-friendly — I'd be curious what you've found.
