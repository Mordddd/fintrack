# FinTrack

Personal finance management application built with modern full-stack engineering practices.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, TanStack Query, Recharts |
| Backend | NestJS, TypeScript, Prisma, PostgreSQL |
| Auth | JWT with refresh token rotation |
| Testing | Vitest, Supertest, Playwright |
| Infra | Docker, GitHub Actions |

## Features

- Multi-account financial tracking (bank, cash, e-wallet, credit card)
- Income & expense management with categories
- Inter-account transfers
- Monthly budgets with spending alerts
- Savings goals with progress tracking
- Recurring transactions (auto-generation)
- Financial analytics & charts
- CSV import/export
- Notification system
- Activity audit log
- Dark mode
- Fully responsive

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup

```bash
# Clone
git clone https://github.com/your-username/fintrack.git
cd fintrack

# Environment
cp .env.example .env

# Start database
docker compose up -d

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed

# Start development
pnpm dev
```

Frontend: http://localhost:3000
API: http://localhost:3001
Swagger: http://localhost:3001/docs

### Demo Account
```
Email: demo@fintrack.local
Password: DemoPassword123!
```

## Project Structure

```
fintrack/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── shared/       # Shared types & utilities
│   ├── eslint-config/
│   └── typescript-config/
├── prisma/           # Database schema & migrations
├── docs/             # Architecture documentation
├── docker/           # Dockerfiles
└── .github/          # CI/CD workflows
```

## Documentation

- [Architecture](docs/architecture.md)
- [Database Design](docs/database.md)
- [API Reference](docs/api.md)

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all services |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run unit tests |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm docker:up` | Start PostgreSQL |

## Future Improvements

- Bank API integrations (Plaid/GoCardless)
- AI financial assistant
- Investment portfolio tracking
- Mobile application (React Native)
- Email notifications
- Multi-currency support with exchange rates
- Receipt scanning (OCR)

## License

MIT
