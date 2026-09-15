# FinTrack Testing Strategy & Execution Guide

This document outlines the testing architecture, suites, execution commands, and security verification procedures for the FinTrack monorepo.

---

## 1. Testing Architecture Overview

FinTrack utilizes a multi-layered testing pyramid:
1. **Unit Tests (Vitest)**: Pure domain logic, date and number parsing, IDR formatters, CSV parser & delimiter detection, and service business rules.
2. **Integration & API Tests (Vitest & Supertest)**: Atomic database transactions, balance updates, transfer exclusions, budget calculations, and batch CSV imports.
3. **Security Cross-User Tests (Vitest)**: Strict multi-tenant verification ensuring User B cannot read, update, delete, or reference User A's financial assets.
4. **End-to-End & Responsive Smoke Tests (Playwright)**: Full browser automation verifying user registration, account creation, transaction logging, transfer neutrality, budget adherence, CSV import wizard, report generation, and layout responsiveness across 9 screen viewports.

---

## 2. Test Execution Commands

### 2.1 Run All Unit & Integration Tests
```bash
# Run unit & security tests across all workspace packages
pnpm -r test -- --run

# Run backend API tests only
pnpm --filter @fintrack/api test -- --run

# Run frontend unit tests only
pnpm --filter @fintrack/web test -- --run
```

### 2.2 Run End-to-End & Responsive Tests (Playwright)
```bash
cd apps/web

# Run all Playwright tests (headless)
npx playwright test

# Run responsive layout smoke tests across 9 viewports
npx playwright test e2e/responsive-layout.spec.ts

# Run authenticated dashboard responsive tests
npx playwright test e2e/dashboard-responsive.spec.ts

# Run full end-to-end user flow test
npx playwright test e2e/e2e-flow.spec.ts
```

---

## 3. Test Suites Breakdown

### 3.1 Unit Tests
* `apps/web/lib/utils.spec.ts`:
  * Tests IDR formatting with dot separators (`formatIDR`).
  * Tests zero amount, negative amounts, and decimal rounding.
  * Tests Tailwind class merge utility (`cn`).
* `apps/web/lib/csv-helper.spec.ts`:
  * Auto-detects comma, semicolon, and tab delimiters.
  * Parses quoted fields containing escaped quotes and commas.
  * Normalizes negative amounts in parentheses `(50000)` and trailing minus signs.
  * Normalizes ISO dates, Indonesian `DD/MM/YYYY`, and EU `DD-MM-YYYY`.

### 3.2 Backend Service Integration Tests
* `apps/api/src/transactions/transactions.service.spec.ts`:
  * Atomic balance increment on income.
  * Atomic balance decrement on expense.
  * Batch CSV import with duplicate detection and error tracking.
* `apps/api/src/transfers/transfers.service.spec.ts`:
  * Atomic decrement on source account and increment on target account.
  * Rejects identical source and destination accounts (`400 Bad Request`).
* `apps/api/src/analytics/analytics.service.spec.ts`:
  * Strict transfer exclusion from Income, Expense, and Net Savings.
  * Budget adherence evaluations (`ON_TRACK`, `WARNING`, `EXCEEDED`).

### 3.3 Security Cross-User Isolation Tests
* `apps/api/test/security-cross-user.spec.ts`:
  * Attacker User B attempts to fetch User A's transaction $\rightarrow$ Throws `ForbiddenException`.
  * Attacker User B attempts to update User A's transaction $\rightarrow$ Throws `ForbiddenException`.
  * Attacker User B attempts to delete User A's transaction $\rightarrow$ Throws `ForbiddenException`.
  * Attacker User B attempts to create transaction referencing User A's account $\rightarrow$ Throws `ForbiddenException`.
  * Attacker User B attempts to create transaction referencing User A's custom category $\rightarrow$ Throws `ForbiddenException`.
  * Attacker User B attempts to view/update User A's account $\rightarrow$ Throws `ForbiddenException`.
  * Attacker User B attempts to modify User A's budget/savings goal $\rightarrow$ Throws `NotFoundException`.
  * Attacker User B attempts to initiate transfer from User A's account $\rightarrow$ Throws `ForbiddenException`.

### 3.4 Responsive Viewport Smoke Matrix
Tested programmatically via Playwright at:
1. `1920x1080` (FHD Desktop)
2. `1536x864` (Standard Laptop)
3. `1440x900` (MacBook Pro)
4. `1366x768` (Compact Laptop)
5. `1280x720` (HD Desktop)
6. `1024x768` (iPad Landscape / Small Desktop)
7. `768x1024` (iPad Portrait Tablet)
8. `390x844` (iPhone 14 Mobile)
9. `375x812` (iPhone Mini Compact Mobile)

**Assertion**: `document.documentElement.scrollWidth <= window.innerWidth` is strictly verified with zero horizontal overflow.
