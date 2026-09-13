import type {
  ApiResponse,
  AuthResponse,
  AuthTokens,
  AuthUser,
  AccountResponse,
  AccountSummaryResponse,
  CategoryResponse,
  TransactionResponse,
  TransferResponse,
  PaginatedResponse,
  DashboardSummaryResponse,
  AccountType,
  CategoryType,
  TransactionType,
} from "@fintrack/shared";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
  }

  async fetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) ?? {}),
    };
    if (this.accessToken) headers["Authorization"] = `Bearer ${this.accessToken}`;

    const res = await fetch(`${API}${path}`, { ...init, headers });
    const json = await res.json();
    if (!res.ok) throw json;
    return json;
  }
}

export const api = new ApiClient();

// ── Auth API ──

export async function registerUser(name: string, email: string, password: string) {
  const res = await api.fetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  return res.data!;
}

export async function loginUser(email: string, password: string) {
  const res = await api.fetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return res.data!;
}

export async function refreshTokens(refreshToken: string) {
  const res = await api.fetch<{ tokens: AuthTokens }>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  return res.data!.tokens;
}

export async function getProfile() {
  const res = await api.fetch<{ user: AuthUser }>("/auth/profile");
  return res.data!.user;
}

// ── Accounts API ──

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  initialBalance: number;
  currency?: string;
  color?: string;
  icon?: string;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  initialBalance?: number;
  currency?: string;
  color?: string;
  icon?: string;
}

export async function getAccounts(): Promise<AccountResponse[]> {
  const res = await api.fetch<AccountResponse[]>("/accounts");
  return res.data ?? [];
}

export async function getAccountSummary(): Promise<AccountSummaryResponse> {
  const res = await api.fetch<AccountSummaryResponse>("/accounts/summary");
  return res.data!;
}

export async function createAccount(dto: CreateAccountInput): Promise<AccountResponse> {
  const res = await api.fetch<AccountResponse>("/accounts", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  return res.data!;
}

export async function updateAccount(id: string, dto: UpdateAccountInput): Promise<AccountResponse> {
  const res = await api.fetch<AccountResponse>(`/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
  return res.data!;
}

export async function deleteAccount(id: string): Promise<AccountResponse> {
  const res = await api.fetch<AccountResponse>(`/accounts/${id}`, {
    method: "DELETE",
  });
  return res.data!;
}

// ── Categories API ──

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: CategoryType;
  icon?: string;
  color?: string;
}

export async function getCategories(type?: CategoryType): Promise<CategoryResponse[]> {
  const path = type ? `/categories?type=${type}` : "/categories";
  const res = await api.fetch<CategoryResponse[]>(path);
  return res.data ?? [];
}

export async function createCategory(dto: CreateCategoryInput): Promise<CategoryResponse> {
  const res = await api.fetch<CategoryResponse>("/categories", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  return res.data!;
}

export async function updateCategory(id: string, dto: UpdateCategoryInput): Promise<CategoryResponse> {
  const res = await api.fetch<CategoryResponse>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
  return res.data!;
}

export async function deleteCategory(id: string): Promise<CategoryResponse> {
  const res = await api.fetch<CategoryResponse>(`/categories/${id}`, {
    method: "DELETE",
  });
  return res.data!;
}

// ── Transactions API ──

export interface CreateTransactionInput {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  date?: string;
  notes?: string;
}

export interface UpdateTransactionInput {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  amount?: number;
  description?: string;
  date?: string;
  notes?: string;
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getTransactions(
  query?: TransactionQueryParams,
): Promise<PaginatedResponse<TransactionResponse>> {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", query.page.toString());
  if (query?.limit) params.set("limit", query.limit.toString());
  if (query?.type) params.set("type", query.type);
  if (query?.accountId) params.set("accountId", query.accountId);
  if (query?.categoryId) params.set("categoryId", query.categoryId);
  if (query?.startDate) params.set("startDate", query.startDate);
  if (query?.endDate) params.set("endDate", query.endDate);
  if (query?.sortBy) params.set("sortBy", query.sortBy);
  if (query?.sortOrder) params.set("sortOrder", query.sortOrder);

  const qs = params.toString();
  const path = qs ? `/transactions?${qs}` : "/transactions";
  const res = await api.fetch<PaginatedResponse<TransactionResponse>>(path);
  return res.data!;
}

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  const res = await api.fetch<DashboardSummaryResponse>("/transactions/summary");
  return res.data!;
}

export async function createTransaction(
  dto: CreateTransactionInput,
): Promise<TransactionResponse> {
  const res = await api.fetch<TransactionResponse>("/transactions", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  return res.data!;
}

export async function updateTransaction(
  id: string,
  dto: UpdateTransactionInput,
): Promise<TransactionResponse> {
  const res = await api.fetch<TransactionResponse>(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
  return res.data!;
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.fetch(`/transactions/${id}`, {
    method: "DELETE",
  });
}

// ── Transfers API ──

export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  date?: string;
}

export async function getTransfers(): Promise<TransferResponse[]> {
  const res = await api.fetch<TransferResponse[]>("/transfers");
  return res.data ?? [];
}

export async function createTransfer(dto: CreateTransferInput): Promise<TransferResponse> {
  const res = await api.fetch<TransferResponse>("/transfers", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  return res.data!;
}

export async function deleteTransfer(id: string): Promise<void> {
  await api.fetch(`/transfers/${id}`, {
    method: "DELETE",
  });
}
