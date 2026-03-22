# Contributing to AgentSite Kit

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/lingfan36/AgentSite-Kit.git
cd AgentSite-Kit
npm install
npm run build
```

## Making Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Build: `npm run build`
6. Commit: `git commit -m "feat: add my feature"`
7. Push: `git push origin feature/my-feature`
8. Open a Pull Request

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `refactor:` — code refactoring
- `test:` — adding tests
- `chore:` — maintenance

## Project Structure

```
src/
├── commands/       # CLI commands (init, scan, generate, serve, update, mcp)
├── config/         # Configuration loading and validation
├── scanner/        # Website crawler, content extractor, page classifier
├── generator/      # Output file generators (llms.txt, JSON, etc.)
├── server/         # Fastify API server and dashboard
├── mcp/            # MCP (Model Context Protocol) server
├── llm/            # LLM integration for classification/summarization
├── plugins/        # Plugin system
├── types/          # TypeScript type definitions
└── utils/          # Shared utilities
```

## Reporting Issues

- Use [GitHub Issues](https://github.com/lingfan36/AgentSite-Kit/issues)
- Include steps to reproduce, expected behavior, and actual behavior
- Include your Node.js version and OS

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
