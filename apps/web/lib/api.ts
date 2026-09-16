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
  BudgetResponse,
  BudgetSummaryResponse,
  SavingsGoalResponse,
  CashFlowPoint,
  CategoryBreakdownItem,
  FinancialOverviewResponse,
  RecurringTransactionResponse,
  NotificationResponse,
  ActivityLogResponse,
  UpdateProfileInput,
  ChangePasswordInput,
  CsvImportPayload,
  CsvImportResult,
  FinancialReportResponse,
} from "@fintrack/shared";
import type { Frequency } from "@fintrack/shared";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
  }

  getToken(): string | null {
    return this.accessToken;
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
    if (json && typeof json === "object" && !("data" in json)) {
      return { data: json } as ApiResponse<T>;
    }
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
  search?: string;
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
  if (query?.search) params.set("search", query.search);

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

// ── Budgets API ──

export async function getBudgets(
  month?: number,
  year?: number,
): Promise<BudgetResponse[]> {
  const params = new URLSearchParams();
  if (month) params.set("month", month.toString());
  if (year) params.set("year", year.toString());
  const qs = params.toString();
  const res = await api.fetch<BudgetResponse[]>(qs ? `/budgets?${qs}` : "/budgets");
  return res.data ?? [];
}

export async function getBudgetSummary(
  month?: number,
  year?: number,
): Promise<BudgetSummaryResponse> {
  const params = new URLSearchParams();
  if (month) params.set("month", month.toString());
  if (year) params.set("year", year.toString());
  const qs = params.toString();
  const res = await api.fetch<BudgetSummaryResponse>(
    qs ? `/budgets/summary?${qs}` : "/budgets/summary",
  );
  return res.data!;
}

export async function createOrUpdateBudget(data: {
  categoryId: string;
  month: number;
  year: number;
  limitAmount: number;
}): Promise<BudgetResponse> {
  const res = await api.fetch<BudgetResponse>("/budgets", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data!;
}

export async function updateBudget(
  id: string,
  data: { limitAmount: number },
): Promise<BudgetResponse> {
  const res = await api.fetch<BudgetResponse>(`/budgets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.data!;
}

export async function deleteBudget(id: string): Promise<void> {
  await api.fetch(`/budgets/${id}`, { method: "DELETE" });
}

// ── Goals API ──

export async function getGoals(): Promise<SavingsGoalResponse[]> {
  const res = await api.fetch<SavingsGoalResponse[]>("/goals");
  return res.data ?? [];
}

export async function getGoal(id: string): Promise<SavingsGoalResponse> {
  const res = await api.fetch<SavingsGoalResponse>(`/goals/${id}`);
  return res.data!;
}

export async function createGoal(data: {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  description?: string;
  icon?: string;
}): Promise<SavingsGoalResponse> {
  const res = await api.fetch<SavingsGoalResponse>("/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data!;
}

export async function updateGoal(
  id: string,
  data: {
    name?: string;
    targetAmount?: number;
    deadline?: string;
    description?: string;
    icon?: string;
  },
): Promise<SavingsGoalResponse> {
  const res = await api.fetch<SavingsGoalResponse>(`/goals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.data!;
}

export async function depositGoal(
  id: string,
  amount: number,
): Promise<SavingsGoalResponse> {
  const res = await api.fetch<SavingsGoalResponse>(`/goals/${id}/deposit`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
  return res.data!;
}

export async function deleteGoal(id: string): Promise<void> {
  await api.fetch(`/goals/${id}`, { method: "DELETE" });
}

// ── Analytics API ──

export async function getCashFlow(
  months?: number,
): Promise<CashFlowPoint[]> {
  const qs = months ? `?months=${months}` : "";
  const res = await api.fetch<CashFlowPoint[]>(`/analytics/cash-flow${qs}`);
  return res.data ?? [];
}

export async function getCategoryBreakdown(
  month?: number,
  year?: number,
): Promise<CategoryBreakdownItem[]> {
  const params = new URLSearchParams();
  if (month) params.set("month", month.toString());
  if (year) params.set("year", year.toString());
  const qs = params.toString();
  const res = await api.fetch<CategoryBreakdownItem[]>(
    qs ? `/analytics/category-breakdown?${qs}` : "/analytics/category-breakdown",
  );
  return res.data ?? [];
}

export async function getFinancialOverview(): Promise<FinancialOverviewResponse> {
  const res = await api.fetch<FinancialOverviewResponse>("/analytics/overview");
  return res.data!;
}

// ── Recurring Transactions API ──

export interface CreateRecurringInput {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  frequency: Frequency;
  startDate: string;
  endDate?: string;
}

export interface UpdateRecurringInput {
  amount?: number;
  description?: string;
  frequency?: Frequency;
  endDate?: string;
  isActive?: boolean;
}

export async function getRecurringTransactions(): Promise<RecurringTransactionResponse[]> {
  const res = await api.fetch<RecurringTransactionResponse[]>("/recurring");
  return res.data ?? [];
}

export async function createRecurring(dto: CreateRecurringInput): Promise<RecurringTransactionResponse> {
  const res = await api.fetch<RecurringTransactionResponse>("/recurring", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  return res.data!;
}

export async function updateRecurring(id: string, dto: UpdateRecurringInput): Promise<RecurringTransactionResponse> {
  const res = await api.fetch<RecurringTransactionResponse>(`/recurring/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
  return res.data!;
}

export async function deleteRecurring(id: string): Promise<void> {
  await api.fetch(`/recurring/${id}`, { method: "DELETE" });
}

export async function pauseRecurring(id: string): Promise<RecurringTransactionResponse> {
  const res = await api.fetch<RecurringTransactionResponse>(`/recurring/${id}/pause`, {
    method: "POST",
  });
  return res.data!;
}

export async function resumeRecurring(id: string): Promise<RecurringTransactionResponse> {
  const res = await api.fetch<RecurringTransactionResponse>(`/recurring/${id}/resume`, {
    method: "POST",
  });
  return res.data!;
}

export async function processRecurring(): Promise<{ processed: number }> {
  const res = await api.fetch<{ processed: number }>("/recurring/process", {
    method: "POST",
  });
  return res.data!;
}

// ── Notifications API ──

export async function getNotifications(query?: {
  isRead?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<NotificationResponse>> {
  const params = new URLSearchParams();
  if (query?.isRead !== undefined) params.set("isRead", String(query.isRead));
  if (query?.page) params.set("page", query.page.toString());
  if (query?.limit) params.set("limit", query.limit.toString());
  const qs = params.toString();
  const res = await api.fetch<PaginatedResponse<NotificationResponse>>(
    qs ? `/notifications?${qs}` : "/notifications",
  );
  return res.data!;
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.fetch<{ count: number }>("/notifications/unread-count");
  return res.data?.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.fetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.fetch("/notifications/mark-all-read", { method: "POST" });
}

export async function deleteNotification(id: string): Promise<void> {
  await api.fetch(`/notifications/${id}`, { method: "DELETE" });
}

// ── Export API ──

export async function exportTransactionsCSV(startDate?: string, endDate?: string): Promise<Blob> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();
  const url = `${API}/export/transactions/csv${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${api.getToken()}` },
  });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

export async function exportTransactionsJSON(startDate?: string, endDate?: string): Promise<Blob> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();
  const url = `${API}/export/transactions/json${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${api.getToken()}` },
  });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

// ── Activity Log API ──

export async function getActivityLogs(query?: {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<ActivityLogResponse>> {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", query.page.toString());
  if (query?.limit) params.set("limit", query.limit.toString());
  if (query?.entityType) params.set("entityType", query.entityType);
  if (query?.action) params.set("action", query.action);
  if (query?.startDate) params.set("startDate", query.startDate);
  if (query?.endDate) params.set("endDate", query.endDate);
  const qs = params.toString();
  const res = await api.fetch<PaginatedResponse<ActivityLogResponse>>(
    qs ? `/activity?${qs}` : "/activity",
  );
  return res.data!;
}

// ── User Settings API ──

export async function getUserProfile(): Promise<AuthUser> {
  const res = await api.fetch<AuthUser>("/users/profile");
  return res.data!;
}

export async function updateUserProfile(dto: UpdateProfileInput): Promise<AuthUser> {
  const res = await api.fetch<AuthUser>("/users/profile", {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
  return res.data!;
}

export async function changeUserPassword(dto: ChangePasswordInput): Promise<{ success: boolean; message: string }> {
  const res = await api.fetch<{ success: boolean; message: string }>("/users/password", {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
  return res.data!;
}

export async function deleteUserAccount(confirmationEmail: string): Promise<{ success: boolean }> {
  const res = await api.fetch<{ success: boolean }>("/users/account", {
    method: "DELETE",
    body: JSON.stringify({ confirmationEmail }),
  });
  return res.data!;
}

// ── CSV Import & Reports API ──

export async function importTransactionsCsv(payload: CsvImportPayload): Promise<CsvImportResult> {
  const res = await api.fetch<CsvImportResult>("/transactions/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data!;
}

export async function getFinancialReports(params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
}): Promise<FinancialReportResponse> {
  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  const res = await api.fetch<FinancialReportResponse>(`/analytics/reports${qStr}`);
  return res.data!;
}

