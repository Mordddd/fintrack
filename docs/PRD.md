# FinTrack — Product Requirements Document (PRD)

---

## 1. Product Overview
FinTrack is a production-grade personal financial management system engineered to provide individuals and freelancers with comprehensive visibility, disciplined budgeting, and automated tracking over their personal wealth, multi-account liquidity, and cash flow trends.

---

## 2. Problem Statement
Many individuals maintain financial accounts across various banks, digital e-wallets, and cash reserves. Existing tools often suffer from:
1. Fragmented multi-account visibility.
2. Inaccurate financial calculations (e.g., counting transfers between personal accounts as income/expenses).
3. Poor desktop and mobile ergonomics with clipped navigation and horizontal overflow.
4. Tedious manual entry without robust CSV data ingestion from Indonesian and international financial institutions.

---

## 3. Product Goals
* Provide an intuitive, responsive, and calm dashboard accessible across desktop, tablet, and mobile devices without horizontal overflow.
* Guarantee mathematical correctness using decimal precision arithmetic (`DECIMAL(18,2)`).
* Facilitate frictionless bulk ingestion of transactions through a 4-step CSV import pipeline with column mapping, delimiter detection, and duplicate prevention.
* Offer deep analytical reporting with export capabilities (CSV, print layout).
* Deliver bank-grade security with strict cross-user tenant isolation and JWT token rotation.

---

## 4. Non-Goals
* No speculative AI stock picking or automated high-frequency trading.
* No direct Open Banking / screen-scraping credential aggregators (privacy-first local CSV import is preferred).
* No social feed or public sharing of net worth.

---

## 5. Target Users
* Young professionals, developers, and knowledge workers seeking financial discipline.
* Freelancers managing multiple income streams and operational bank accounts.
* Indonesian tech workers utilizing mixed banking (BCA, Mandiri, Jenius) and e-wallets (GoPay, OVO).

---

## 6. User Personas
* **Persona A: Bram (26, Senior Software Engineer)**: Wants an ultra-fast, keyboard-friendly dashboard with dark accents and precise analytics to monitor his 40% monthly savings target.
* **Persona B: Sarah (22, Fresh Graduate / Freelancer)**: Needs an effortless way to import monthly bank statements in CSV format, categorize project fees, and set food/leisure budgets.

---

## 7. User Stories
* *As a user*, I want to see my net savings and monthly cash flow at a glance so that I understand my financial standing.
* *As a user*, I want to transfer money between my bank and e-wallet without skewing my income and expense totals.
* *As a user*, I want to import hundreds of bank transactions from a CSV file with automatic column detection so that I save time on manual entry.
* *As a user*, I want to filter comprehensive financial reports by month or custom date range and export them to CSV.

---

## 8. Functional Requirements
* **Authentication**: Registration, login, access token refresh, secure cookie handling, password change, account deletion.
* **Accounts**: CRUD for Bank Accounts, Cash, E-Wallets, Credit Cards, Savings, and Investments with automatic balance synchronization.
* **Transactions**: Filterable paginated list, creation/editing/deletion of income and expense with atomic balance updates.
* **Transfers**: Inter-account fund movements with atomic source decrement and destination increment.
* **Budgets**: Category-level monthly limits with warning and exceeded threshold indicators.
* **Savings Goals**: Target tracking, incremental deposits, progress visualization.
* **CSV Import**: Multi-step wizard supporting file upload, text paste, delimiter detection, column mapping, row normalization, validation, duplicate detection, and batch insertion.
* **Reports**: Monthly cash flow, category breakdowns, account distribution, budget adherence, and CSV/print export.

---

## 9. Non-Functional Requirements
* **Performance**: Sub-100ms API response time on indexed queries; client initial load under 1.5s.
* **Responsiveness**: Zero horizontal overflow on viewports ranging from 375px mobile to 1920px+ ultrawide desktops.
* **Reliability**: 100% database transaction atomicity for multi-row financial mutations.
* **Accessibility**: High contrast semantic design adhering to WCAG 2.1 AA standards.

---

## 10. Core User Flows
1. **Onboarding**: Register $\rightarrow$ Auto-generate default categories $\rightarrow$ Create primary bank account $\rightarrow$ Arrive on Dashboard.
2. **Transaction Logging**: Open New Transaction modal $\rightarrow$ Select Type $\rightarrow$ Pick Account & Category $\rightarrow$ Enter Amount $\rightarrow$ Save $\rightarrow$ Balance reflects instantly.
3. **CSV Statement Import**: Navigate to Import $\rightarrow$ Select CSV file $\rightarrow$ Map columns (Date, Amount, Description, Type) $\rightarrow$ Review parsed & validated preview $\rightarrow$ Confirm Import $\rightarrow$ Review summary metrics.
4. **Monthly Review**: Open Reports $\rightarrow$ Select date range (e.g., "This Month") $\rightarrow$ Inspect Income vs. Expense and Net Savings $\rightarrow$ Export CSV or Print.

---

## 11. Business Rules
* Stored currency values must never use floating-point types; all monetary database fields are `DECIMAL(18,2)`.
* Transfers must never count as Income or Expense.
* All financial transactions are scoped strictly to the authenticated `userId`.
* Duplicate CSV rows matching `(userId, accountId, date, amount, description, type)` must be flagged with option to skip.

---

## 12. Data Requirements
* Entities: `User`, `Account`, `Category`, `Transaction`, `Transfer`, `Budget`, `SavingsGoal`, `RecurringTransaction`, `Notification`, `ActivityLog`.
* Referential integrity enforced via foreign keys with cascading deletions on non-financial metadata and restricted deletions on active accounts with transactions.

---

## 13. Analytics Requirements
* Aggregations performed database-side where applicable using Prisma aggregations and indexed date filters.
* Trend analysis across up to 12 trailing months for income, expense, and savings rate.

---

## 14. Security Requirements
* Passwords hashed using bcrypt with salt rounds $\ge 10$.
* Stateless JWT authentication with short-lived access tokens (15m) and rotating refresh tokens (7d).
* Helmet HTTP header protection, CORS origin restriction, and rate limiting (100 req/min).
* Strict multi-tenant verification preventing cross-user read/write/delete attempts.

---

## 15. Accessibility Requirements
* Keyboard navigable tab order, visible focus outlines, and screen-reader accessible `aria-label` attributes on icon buttons.
* Color is never used as the sole indicator of financial state (supplemented by text labels and symbols).

---

## 16. MVP Scope
* Auth (Register, Login, Refresh, Logout).
* Accounts, Transactions, Transfers.
* Budgets & Savings Goals.
* CSV Import Pipeline.
* Comprehensive Financial Reports.
* Full Responsive AppShell without horizontal overflow.

---

## 17. Post-MVP Scope
* Automated recurring transaction execution worker (cron).
* Multi-currency conversion with historical exchange rate tables.
* Biometric web authentication (WebAuthn).

---

## 18. Acceptance Criteria
* All 26 Playwright E2E and responsive smoke tests pass across 9 screen resolutions.
* All 35 Vitest unit, integration, and security isolation tests pass.
* Zero unwanted horizontal scrollbars on desktop and mobile viewports.
* CSV import correctly parses standard bank CSV formats and avoids duplicate ingestion.

---

## 19. Risks & Mitigation
* **Risk**: Bank CSV exports have inconsistent date formats (e.g. DD/MM/YYYY vs. YYYY-MM-DD).
  * *Mitigation*: Smart regex parser with fallback heuristics and user-configurable date mapping.
* **Risk**: High-volume imports causing database timeouts.
  * *Mitigation*: Chunked batch imports inside atomic database transactions.

---

## 20. Future Roadmap
* **Q4 2026**: Advanced tax estimation & deduction category tracking for Indonesian freelancers.
* **Q1 2027**: Offline-first synchronization with IndexedDB and service worker PWA support.
