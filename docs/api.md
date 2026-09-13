# FinTrack API Reference

Full interactive documentation available at `/docs` when the API is running.

## Base URL
```
http://localhost:3001/api/v1
```

## Authentication
All endpoints except `/auth/register`, `/auth/login`, and `/health` require a Bearer token.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/logout` | Logout |
| `POST` | `/auth/refresh` | Refresh token |
| `GET` | `/auth/me` | Current user |
| `GET` | `/accounts` | List accounts |
| `POST` | `/accounts` | Create account |
| `GET` | `/accounts/:id` | Get account |
| `PATCH` | `/accounts/:id` | Update account |
| `DELETE` | `/accounts/:id` | Delete account |
| `GET` | `/transactions` | List (filterable) |
| `POST` | `/transactions` | Create |
| `GET` | `/transactions/:id` | Get |
| `PATCH` | `/transactions/:id` | Update |
| `DELETE` | `/transactions/:id` | Delete |
| `GET` | `/transfers` | List transfers |
| `POST` | `/transfers` | Create transfer |
| `GET` | `/categories` | List categories |
| `POST` | `/categories` | Create category |
| `PATCH` | `/categories/:id` | Update category |
| `DELETE` | `/categories/:id` | Delete category |
| `GET` | `/budgets` | List budgets |
| `POST` | `/budgets` | Create budget |
| `PATCH` | `/budgets/:id` | Update budget |
| `DELETE` | `/budgets/:id` | Delete budget |
| `GET` | `/goals` | List goals |
| `POST` | `/goals` | Create goal |
| `PATCH` | `/goals/:id` | Update goal |
| `DELETE` | `/goals/:id` | Delete goal |
| `GET` | `/recurring` | List recurring |
| `POST` | `/recurring` | Create recurring |
| `PATCH` | `/recurring/:id` | Update recurring |
| `DELETE` | `/recurring/:id` | Delete recurring |
| `GET` | `/analytics/overview` | Dashboard summary |
| `GET` | `/analytics/monthly` | Monthly breakdown |
| `GET` | `/analytics/categories` | Category breakdown |
| `GET` | `/analytics/cashflow` | Cash flow chart |
| `GET` | `/analytics/net-worth` | Net worth over time |
| `GET` | `/notifications` | List notifications |
| `PATCH` | `/notifications/:id/read` | Mark read |
| `PATCH` | `/notifications/read-all` | Mark all read |
| `GET` | `/activity` | Activity log |

## Response Format
```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 125, "totalPages": 7 }
}
```

## Error Format
```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Invalid request", "fields": {} }
}
```
