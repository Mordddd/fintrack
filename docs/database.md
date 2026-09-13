# FinTrack Database Design

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ accounts : has
    users ||--o{ categories : has
    users ||--o{ transactions : has
    users ||--o{ transfers : has
    users ||--o{ budgets : has
    users ||--o{ savings_goals : has
    users ||--o{ recurring_transactions : has
    users ||--o{ notifications : has
    users ||--o{ activity_logs : has

    accounts ||--o{ transactions : contains
    categories ||--o{ transactions : categorizes
    categories ||--o{ budgets : tracks
    categories ||--o{ recurring_transactions : categorizes
    accounts ||--o{ recurring_transactions : uses
    accounts ||--o{ transfers : from
    accounts ||--o{ transfers : to

    users {
        string id PK
        string name
        string email UK
        string password_hash
        string currency
        string timezone
        datetime created_at
    }

    accounts {
        string id PK
        string user_id FK
        string name
        enum type
        decimal initial_balance
        decimal current_balance
        boolean is_active
    }

    categories {
        string id PK
        string user_id FK
        string name
        enum type
        string icon
        string color
        boolean is_default
    }

    transactions {
        string id PK
        string user_id FK
        string account_id FK
        string category_id FK
        enum type
        decimal amount
        string description
        date transaction_date
    }

    transfers {
        string id PK
        string user_id FK
        string from_account_id FK
        string to_account_id FK
        decimal amount
        date transfer_date
    }

    budgets {
        string id PK
        string user_id FK
        string category_id FK
        int month
        int year
        decimal limit_amount
    }

    savings_goals {
        string id PK
        string user_id FK
        string name
        decimal target_amount
        decimal current_amount
        date deadline
    }

    recurring_transactions {
        string id PK
        string user_id FK
        string account_id FK
        string category_id FK
        enum type
        decimal amount
        enum frequency
        date next_run_date
        boolean is_active
    }

    notifications {
        string id PK
        string user_id FK
        string type
        string title
        string message
        boolean is_read
    }

    activity_logs {
        string id PK
        string user_id FK
        string action
        string entity_type
        string entity_id
        json metadata
    }
```

## Indexes

| Table | Index | Purpose |
|---|---|---|
| transactions | `(user_id, transaction_date)` | Date-range queries per user |
| transactions | `(user_id, type)` | Income/expense filtering |
| transactions | `(user_id, category_id)` | Category analytics |
| budgets | `(user_id, year, month)` | Monthly budget lookup |
| notifications | `(user_id, is_read)` | Unread notification count |
| recurring_transactions | `(next_run_date, is_active)` | Due transaction processing |

## Constraints
- `users.email` — unique
- `categories(user_id, name, type)` — unique per user
- `budgets(user_id, category_id, month, year)` — one budget per category per month
- All monetary fields use `DECIMAL(18,2)`
- All foreign keys cascade on user deletion
