# Git Workflow

## Branches

| Branch      | Purpose                                                    |
| ----------- | ---------------------------------------------------------- |
| `main`      | Production-ready. Always deployable.                       |
| `develop`   | Integration branch. Default for feature work.              |
| `feature/*` | New features (from `develop`)                              |
| `fix/*`     | Bug fixes (from `develop`)                                 |
| `release/*` | Release prep (from `develop`, merge to `main` + `develop`) |

## Flow

```
main ──────────────────────────────────────●
         \                               /
develop ──●───●───●───●───●───●───●───●───●
              \     /         \     /
           feature/x      feature/y
```

1. **Start work**: Branch from `develop`

   ```bash
   git checkout develop
   git pull
   git checkout -b feature/my-feature
   ```

2. **Develop**: Commit with `npm run commit`, push to your branch

3. **Merge**: Open PR into `develop` (not `main`)

4. **Release**: When ready for production

   ```bash
   git checkout develop
   git checkout -b release/1.1.0
   # Bump version in package.json
   # Update CHANGELOG.md: move Unreleased items to new version, add date
   # Fix last-minute bugs if needed
   git checkout main
   git merge --no-ff release/1.1.0
   git tag v1.1.0
   git checkout develop
   git merge --no-ff release/1.1.0
   git branch -d release/1.1.0
   ```

5. **Hotfix**: For urgent production fixes
   ```bash
   git checkout main
   git checkout -b fix/critical-bug
   # Fix, commit
   git checkout main
   git merge --no-ff fix/critical-bug
   git tag v1.1.1
   git checkout develop
   git merge --no-ff fix/critical-bug
   git branch -d fix/critical-bug
   ```

## Default Branch

- **Development**: Use `develop` as the default branch for day-to-day work
- **CI**: Runs on push/PR to `main` and `develop`

## Branch Naming

- `feature/short-description` — e.g. `feature/add-temperature-param`
- `fix/issue-description` — e.g. `fix/api-key-validation`
- `release/x.y.z` — e.g. `release/1.2.0`
- `chore/description` — e.g. `chore/update-deps`
