// ── Enums ──

export const TransactionType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  TRANSFER: "TRANSFER",
} as const;
export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export const AccountType = {
  CASH: "CASH",
  BANK: "BANK",
  E_WALLET: "E_WALLET",
  CREDIT_CARD: "CREDIT_CARD",
  SAVINGS: "SAVINGS",
  INVESTMENT: "INVESTMENT",
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const CategoryType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export const Frequency = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const;
export type Frequency = (typeof Frequency)[keyof typeof Frequency];

// ── API Response ──

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Pagination Query ──

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── Auth ──

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  currency: string;
  timezone: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// ── Phase 3 Models ──

export interface AccountResponse {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummaryResponse {
  totalBalance: number;
  accountCount: number;
  byType: Record<string, number>;
}

export interface CategoryResponse {
  id: string;
  userId: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: string;
    name: string;
    type: AccountType;
    color: string;
    icon: string;
  };
  category?: {
    id: string;
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
  };
}

export interface TransferResponse {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  fromAccount?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  toAccount?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

export interface DashboardSummaryResponse {
  totalBalance: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  savings: number;
  recentTransactions: TransactionResponse[];
}
