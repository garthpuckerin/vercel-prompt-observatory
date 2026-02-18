# Contributing

## Setup

1. Fork and clone
2. `npm install`
3. Copy `.env.example` to `.env` and add `ANTHROPIC_API_KEY`
4. `npm run dev` to verify

## Git Workflow

We use a **main/develop** flow. See [.github/GIT_WORKFLOW.md](.github/GIT_WORKFLOW.md) for full details.

**Quick flow:**

1. Branch from `develop`: `git checkout -b feature/my-feature`
2. Make changes, run `npm run validate` before committing
3. Use `npm run commit` for conventional commits
4. Push and open a **PR into `develop`** (not `main`)
5. After review, merge to `develop`; releases merge `develop` → `main`

## Commit Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code change (no feature/fix)
- `perf`: Performance
- `test`: Tests
- `chore`: Maintenance

Scopes (optional): `api`, `ui`, `deps`, `config`, `docs`, `ci`, `auth`

Example: `feat(api): add temperature parameter to run endpoint`

## Pre-commit

Husky runs on every commit:

- **pre-commit**: lint-staged (Prettier + ESLint) + typecheck
- **commit-msg**: Commitlint (validates message format)

## Quality Gates

CI runs on push/PR:

- Lint
- Format check
- Type check
- Tests
- Security audit (advisory)
- Build
