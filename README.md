# Prompt Observatory

A developer tool for testing and comparing Claude prompts with latency metrics, token counting, and run versioning.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[Changelog](CHANGELOG.md)** · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

## Features

- **Prompt testing** — Run prompts against Claude Haiku 4.5 or Sonnet 4
- **Metrics** — Latency, input/output tokens, tokens/sec, stop reason
- **Comparison** — Side-by-side run comparison when you have 2+ runs
- **Versioning** — Label runs for easy reference
- **Starter prompts** — Pre-built examples for extraction, classification, rewrite, drift detection

## Quick Start

```bash
# Install
npm install

# Configure (optional in dev — API is mocked; copy .env.example to .env for real Claude)
cp .env.example .env

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API docs at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

## Scripts

| Command                 | Description                       |
| ----------------------- | --------------------------------- |
| `npm run dev`           | Start dev server                  |
| `npm run build`         | Production build                  |
| `npm run start`         | Start production server           |
| `npm run lint`          | Run ESLint                        |
| `npm run format`        | Format with Prettier              |
| `npm run typecheck`     | TypeScript check                  |
| `npm run test`          | Run tests                         |
| `npm run test:watch`    | Run tests in watch mode           |
| `npm run test:coverage` | Run tests with coverage           |
| `npm run docs`          | Generate TypeDoc                  |
| `npm run commit`        | Commitizen (conventional commits) |
| `npm run validate`      | Lint + format + typecheck + test  |
| `npm run quality`       | Validate + audit                  |
| `npm run lint:fix`      | Run ESLint with auto-fix          |
| `npm run audit`         | Run npm security audit            |

## Development Standards

- **ESLint** + **Prettier** — Code style and quality
- **Husky** + **lint-staged** — Pre-commit hooks (lint, format, typecheck)
- **Commitlint** + **Commitizen** — Conventional commits
- **Vitest** — Unit tests
- **TypeDoc** — Auto-generated API docs
- **OpenAPI / Swagger UI** — API documentation at `/api-docs`
- **npm audit** — Security checks

## Commits

Use conventional commits:

```bash
npm run commit
```

Or manually: `type(scope): subject` (e.g. `feat(api): add temperature param`).

## Environment

| Variable            | Description                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (required for production)                         |
| `MOCK_API`          | In dev, API is mocked by default. Set to `false` to use real Claude API. |

## Deploy on Vercel

1. [Import the project](https://vercel.com/new) from GitHub
2. Add `ANTHROPIC_API_KEY` in Project Settings → Environment Variables
3. Deploy (production uses `main`; previews from PRs)

## License

MIT
