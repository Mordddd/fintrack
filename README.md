# FinTrack — Production-Grade Personal Finance Platform

> A resilient, responsive, and financially rigorous personal finance management platform built with modern full-stack engineering standards.

[![CI](https://github.com/Mordddd/fintrack/actions/workflows/ci.yml/badge.svg)](https://github.com/Mordddd/fintrack/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)

---

## 📑 Table of Contents
- [Architectural Overview](#-architectural-overview)
- [Key Features](#-key-features)
- [Financial Invariants & Calculation Rules](#-financial-invariants--calculation-rules)
- [Responsive Design System (Zero Horizontal Overflow)](#-responsive-design-system-zero-horizontal-overflow)
- [CSV Ingestion Pipeline](#-csv-ingestion-pipeline)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security & Multi-Tenant Isolation](#-security--multi-tenant-isolation)
- [Local Development Setup](#-local-development-setup)
- [Production Deployment](#-production-deployment)
- [Documentation Index](#-documentation-index)

---

## 🏛 Architectural Overview

FinTrack is structured as a Turborepo monorepo enforcing clean domain separation, shared type safety, and atomic transactions:

```
fintrack/
├── apps/
│   ├── web/                     # Next.js 14 App Router, Tailwind CSS, Lucide Icons, Recharts
│   └── api/                     # NestJS 10 REST API, Prisma ORM, JWT with rotation, Throttler
├── packages/
│   ├── shared/                  # Shared TypeScript interfaces, DTOs, Enums, formatters
│   ├── eslint-config/           # Unified linting rules
│   └── typescript-config/       # Base tsconfig presets
├── prisma/
│   ├── schema.prisma            # Decimal(18,2) schema with composite indexes
│   ├── migrations/              # Version-controlled migrations
│   └── seed/                    # Initial categories and demo seed
├── docs/                        # Comprehensive PRD, Financial Rules, Testing, and Deployment docs
├── .github/workflows/ci.yml     # Automated CI pipeline with PostgreSQL service & Playwright
```

---

## ✨ Key Features

1. **Adaptive Financial Dashboard**: Real-time KPI summaries (Total Balance, Monthly Income, Expenses, Net Savings, Savings Rate) with instant cash flow charts.
2. **Strict Multi-Account Management**: Bank checking/savings, digital e-wallets (GoPay, OVO), cash, and credit cards with atomic balance synchronization.
3. **Neutral Inter-Account Transfers**: Atomic balance shifts between accounts without artificially inflating income or expense totals.
4. **4-Step CSV Statement Ingestion**: Auto-delimiter detection, bilingual header mapping (ID/EN), preview with validation error markers, duplicate detection, and batch execution.
5. **Comprehensive Analytical Reports**: Customizable date filtering, income vs. expense cash flow, category breakdowns, budget adherence, CSV export, and print-ready layout.
6. **Discipline Budgets & Goals**: Category spending thresholds (`ON_TRACK`, `WARNING`, `EXCEEDED`) and savings goal targets with incremental deposit tracking.
7. **Audit & Activity Trail**: Immutable activity logs tracking creations, updates, and deletions across all financial domains.

---

## ⚖ Financial Invariants & Calculation Rules

All monetary operations strictly adhere to [docs/financial-rules.md](docs/financial-rules.md):

* **Exact Arithmetic**: Stored in PostgreSQL as `DECIMAL(18,2)` to eliminate floating-point rounding errors.
* **Transfer Neutrality**:
  $$\text{Income} = \sum_{\text{type} = \text{INCOME}} \text{amount}, \quad \text{Expense} = \sum_{\text{type} = \text{EXPENSE}} \text{amount}$$
  $$\text{Net Savings} = \text{Income} - \text{Expense} \quad (\text{Transfers strictly excluded})$$
* **Atomic Consistency**: Any financial transaction modifying multiple accounts (transfers, deletions, CSV batches) runs inside a database transaction (`prisma.$transaction`).

---

## 📱 Responsive Design System (Zero Horizontal Overflow)

Unlike naive fixes using `overflow-x: hidden`, FinTrack solves horizontal overflow structurally:
* **Adaptive Desktop Navigation**: Core routes stay visible on top, while secondary navigation automatically collapses into an accessible **"More"** dropdown on screens $< 1536\text{px}$.
* **Thumb-Friendly Mobile Experience**: Bottom navigation bar provides instant one-touch access to Dashboard, Transactions, Budgets, Reports, and Menu.
* **Automated Matrix Verification**: Verified with Playwright across 9 screen resolutions (`1920x1080`, `1536x864`, `1440x900`, `1366x768`, `1280x720`, `1024x768`, `768x1024`, `390x844`, `375x812`), guaranteeing `scrollWidth <= innerWidth`.

---

## 📥 CSV Ingestion Pipeline

1. **Upload & Auto-Detection**: Accepts drag-and-drop or text paste; detects `,`, `;`, or `\t` delimiters automatically.
2. **Column Mapping**: Auto-recognizes Indonesian and English column headers (`Tanggal/Date`, `Nominal/Amount`, `Keterangan/Description`, `Tipe/Type`).
3. **Normalization**: Handles negative amounts in accounting parentheses `(50.000)` and trailing minus signs; standardizes ISO and `DD/MM/YYYY` date formats.
4. **Duplicate Protection**: Identifies existing records matching `(userId, accountId, date, amount, description, type)` with optional skip toggling.
5. **Batch Transaction**: Inserts approved records while simultaneously recalculating account balances.

---

## 🧪 Testing & Quality Assurance

FinTrack employs a layered automated testing suite:

```bash
# Run unit, integration, and security tests (35 tests)
pnpm -r test -- --run

# Run Playwright E2E & responsive smoke tests (26 test scenarios)
pnpm --filter @fintrack/web test:e2e
```

* **Unit Tests**: Formatter precision, CSV parser resilience, date/amount normalizers.
* **Service Integration Tests**: Atomic increment/decrement balances, batch import calculations, transfer neutrality.
* **Cross-User Security Tests (`security-cross-user.spec.ts`)**: Confirms that unauthorized read/write/delete attempts across different tenant IDs are strictly blocked (`403 Forbidden` / `404 Not Found`).
* **E2E Playwright Flows**: Validates full 12-step user journeys from registration to report exports.

---

## 🔒 Security & Multi-Tenant Isolation

* **Stateless JWT with Token Rotation**: Access tokens valid for 15 minutes; rotating refresh tokens stored securely in HTTP-only cookies.
* **Hardened Multi-Tenancy**: All database queries are explicitly scoped to the authenticated user's ID; request-body `userId` overrides are disallowed.
* **Rate Limiting & Security Headers**: Integrated Helmet protection, CORS lockdown, and NestJS Throttler guards (100 req/min).

---

## 🚀 Local Development Setup

### Prerequisites
* Node.js 20+
* pnpm 9+
* PostgreSQL 16 (local or Docker)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/Mordddd/fintrack.git
cd fintrack

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env

# 4. Generate Prisma client & Push database schema
pnpm db:generate
pnpm db:push
pnpm db:seed

# 5. Start development servers
pnpm dev
```

* Web Application: `http://localhost:3000`
* Backend API: `http://localhost:3001`
* Swagger API Docs: `http://localhost:3001/docs`
* Health Endpoint: `http://localhost:3001/api/v1/health`

---

## 📖 Documentation Index
* [Product Requirements Document (PRD)](docs/PRD.md)
* [Financial Calculation Rules](docs/financial-rules.md)
* [Testing Architecture & Commands](docs/testing.md)
* [Production Deployment Guide](docs/deployment.md)
* [Contributing Guidelines](CONTRIBUTING.md)
* [Visual Design System](DESIGN.md)

---

## 📄 License
Released under the [MIT License](LICENSE). Built with dedication by [Muhamad Qeisha](https://github.com/Mordddd).
