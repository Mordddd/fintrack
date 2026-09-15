# Contributing to FinTrack

Thank you for your interest in contributing to FinTrack! To maintain code quality, financial accuracy, and strict security across the monorepo, please review our contribution guidelines below.

---

## 1. Branch Naming Conventions

* `feature/feature-name`: For new functionality (e.g., `feature/csv-export-filters`).
* `fix/bug-description`: For bug fixes (e.g., `fix/currency-input-step`).
* `test/test-description`: For test additions or refactoring.
* `docs/documentation-update`: For documentation changes.

---

## 2. Commit Message Standards

We adhere to Conventional Commits:
* `feat(...)`: A new feature
* `fix(...)`: A bug fix
* `test(...)`: Adding or updating tests
* `docs(...)`: Documentation updates
* `refactor(...)`: Code changes that neither fix a bug nor add a feature
* `chore(...)`: Maintenance or tooling updates

Example:
```bash
git commit -m "feat(reports): add net savings rate and monthly cash flow breakdown"
```

---

## 3. Pull Request Guidelines

Before opening a PR:
1. **Financial Domain Integrity**: Ensure monetary calculations comply with [docs/financial-rules.md](docs/financial-rules.md). Transfers must never inflate income or expense.
2. **Multi-Tenant Security**: Any new endpoint or query must be scoped to the authenticated user.
3. **Responsive Verification**: Ensure no horizontal scrollbar is introduced on any viewport.
4. **Run Verification Commands**:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm -r test -- --run
   pnpm --filter @fintrack/web test:e2e
   pnpm build
   ```
5. Fill out the PR template completely with screenshots and test results.
