# Security

## Reporting

If you find a security vulnerability, please report it privately. Do not open a public issue.

## Environment

- Never commit `.env` or `.env.local`
- `ANTHROPIC_API_KEY` must be kept secret
- Use environment variables for all secrets in deployment (e.g. Vercel)

## Dependencies

- Run `npm audit` regularly
- CI runs `npm audit --audit-level=high` (advisory)
- Update dependencies with `npm update` and review changelogs

## API

- The `/api/run` endpoint proxies to Anthropic; API key is server-side only
- No user data is persisted by default
