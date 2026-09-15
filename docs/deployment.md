# FinTrack Deployment & Operations Guide

This guide describes production containerization, environment variable configurations, database migration procedures, health check monitoring, and continuous deployment workflows for FinTrack.

---

## 1. Architecture & Infrastructure Overview

* **Frontend**: Next.js 14 Standalone Node container / Vercel deployment.
* **Backend**: NestJS 10 container listening on port `3001` (prefixed with `/api/v1`).
* **Database**: PostgreSQL 16 managed instance (Supabase / AWS RDS / local Docker).
* **Reverse Proxy / Ingress**: Nginx or Cloudflare with SSL termination and WebSocket/HMR forwarding.

---

## 2. Environment Variables

### Backend (`apps/api/.env`)
```env
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://fintrack:YOUR_SECURE_PASSWORD@postgres:5432/fintrack?schema=public"
JWT_SECRET="YOUR_LONG_RANDOM_JWT_SECRET_KEY"
JWT_REFRESH_SECRET="YOUR_LONG_RANDOM_REFRESH_SECRET_KEY"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="https://fintrack.yourdomain.com"
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### Frontend (`apps/web/.env`)
```env
NEXT_PUBLIC_API_URL="https://api.fintrack.yourdomain.com/api/v1"
```

---

## 3. Production Health Check & Monitoring

The API exposes a comprehensive health endpoint that actively validates database connectivity:

```http
GET /api/v1/health
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-09-15T07:36:12.833Z",
    "uptime": 1420.5
  }
}
```

If PostgreSQL becomes unreachable, the endpoint automatically returns `HTTP 503 Service Unavailable` with `database: "disconnected"`.

---

## 4. Docker Deployment

### Docker Compose
```bash
# Build and start all services in production mode
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker compose exec api pnpm prisma migrate deploy
```

---

## 5. Continuous Deployment Checklist
- [ ] Database backups scheduled and retention configured.
- [ ] Strong random strings for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- [ ] SSL/TLS certificates active with HSTS headers.
- [ ] Health check endpoint monitored by external uptime ping (e.g. BetterStack, UptimeRobot).
- [ ] Database connection pool limits configured according to host memory.
