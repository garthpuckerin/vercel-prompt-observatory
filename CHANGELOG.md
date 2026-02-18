# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Mock API in dev mode — Claude API is mocked by default when `npm run dev`; set `MOCK_API=false` to use real API
- LICENSE file (MIT)
- Dependabot config for weekly npm updates

### Changed

- Husky hooks updated for v10 compatibility (removed deprecated husky.sh)
- OpenAPI description notes dev mock behavior

### Fixed

- Resolved npm audit vulnerabilities (24 → 15)
  - Next.js 14 → 15.5.12 (fixes DoS, RSC deserialization)
  - Vitest 2 → 4, @vitest/coverage-v8 2 → 4 (fixes esbuild dev server)
  - eslint-config-next 14 → 15.5.12
  - commitizen 4.3.0 → 4.3.1

### Changed

- Added `*.tsbuildinfo` to `.gitignore`

## [1.0.0] - 2025-02-18

### Added

- Prompt Observatory app for testing and comparing Claude prompts
- Support for Claude Haiku 4.5 and Sonnet 4
- Latency metrics, token counting, run comparison, and labeling
- Starter prompts (extraction, classification, rewrite, drift detection)
- OpenAPI spec at `/api/openapi` and Swagger UI at `/api-docs`
- Development standards: ESLint, Prettier, Husky, lint-staged, Commitizen, Commitlint
- TypeDoc for API docs, Vitest for tests
- CI workflow (lint, format, typecheck, test, audit, build)
- Git workflow (main/develop) and branch strategy
- README, CONTRIBUTING, SECURITY documentation

[Unreleased]: https://github.com/BlurredConcepts/vercel-prompt-observatory/compare/v1.0.0...develop
[1.0.0]: https://github.com/BlurredConcepts/vercel-prompt-observatory/releases/tag/v1.0.0
