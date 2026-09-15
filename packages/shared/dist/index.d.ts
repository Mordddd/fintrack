export declare const TransactionType: {
    readonly INCOME: "INCOME";
    readonly EXPENSE: "EXPENSE";
    readonly TRANSFER: "TRANSFER";
};
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];
export declare const AccountType: {
    readonly CASH: "CASH";
    readonly BANK: "BANK";
    readonly E_WALLET: "E_WALLET";
    readonly CREDIT_CARD: "CREDIT_CARD";
    readonly SAVINGS: "SAVINGS";
    readonly INVESTMENT: "INVESTMENT";
};
export type AccountType = (typeof AccountType)[keyof typeof AccountType];
export declare const CategoryType: {
    readonly INCOME: "INCOME";
    readonly EXPENSE: "EXPENSE";
};
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];
export declare const Frequency: {
    readonly DAILY: "DAILY";
    readonly WEEKLY: "WEEKLY";
    readonly MONTHLY: "MONTHLY";
    readonly YEARLY: "YEARLY";
};
export type Frequency = (typeof Frequency)[keyof typeof Frequency];
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
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
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
export interface BudgetResponse {
    id: string;
    userId: string;
    categoryId: string;
    month: number;
    year: number;
    limitAmount: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: "ON_TRACK" | "WARNING" | "EXCEEDED";
    category?: {
        id: string;
        name: string;
        icon: string;
        color: string;
    };
}
export interface BudgetSummaryResponse {
    totalBudgeted: number;
    totalSpent: number;
    remaining: number;
    overallPercentage: number;
}
export interface SavingsGoalResponse {
    id: string;
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    remainingAmount: number;
    percentage: number;
    isCompleted: boolean;
    deadline: string | null;
    description: string | null;
    icon: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface CashFlowPoint {
    month: string;
    income: number;
    expense: number;
    net: number;
}
export interface CategoryBreakdownItem {
    categoryId: string;
    categoryName: string;
    color: string;
    icon: string;
    amount: number;
    percentage: number;
}
export interface FinancialOverviewResponse {
    ytdIncome: number;
    ytdExpense: number;
    ytdNet: number;
    savingsRate: number;
}
export interface RecurringTransactionResponse {
    id: string;
    userId: string;
    accountId: string;
    categoryId: string;
    type: TransactionType;
    amount: number;
    description: string | null;
    frequency: Frequency;
    startDate: string;
    endDate: string | null;
    nextRunDate: string;
    isActive: boolean;
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
export interface NotificationResponse {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}
export interface ActivityLogResponse {
    id: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, any> | null;
    createdAt: string;
}
export interface UpdateProfileInput {
    name?: string;
    avatarUrl?: string | null;
    currency?: string;
    timezone?: string;
}
export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}
export interface CsvColumnMapping {
    date: string;
    description: string;
    amount: string;
    type?: string;
    category?: string;
    account?: string;
    notes?: string;
}
export interface CsvImportItemInput {
    date: string;
    description?: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    accountId: string;
    notes?: string;
}
export interface CsvImportPayload {
    items: CsvImportItemInput[];
    skipDuplicates?: boolean;
}
export interface CsvImportResult {
    imported: number;
    skipped: number;
    duplicate: number;
    failed: number;
    errors: Array<{
        row: number;
        message: string;
    }>;
}
export interface ReportSummary {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    savingsRate: number;
    totalTransactions: number;
    avgDailyExpense: number;
    avgMonthlyExpense: number;
}
export interface ReportCategoryItem {
    categoryId: string;
    categoryName: string;
    type: CategoryType;
    icon: string;
    color: string;
    amount: number;
    percentage: number;
    transactionCount: number;
}
export interface ReportAccountItem {
    accountId: string;
    accountName: string;
    type: AccountType;
    color: string;
    income: number;
    expense: number;
    net: number;
}
export interface ReportBudgetPerformance {
    categoryId: string;
    categoryName: string;
    budgeted: number;
    actualSpent: number;
    percentage: number;
    status: "ON_TRACK" | "WARNING" | "EXCEEDED";
}
export interface ReportCashFlowPoint {
    period: string;
    income: number;
    expense: number;
    net: number;
}
export interface FinancialReportResponse {
    period: string;
    startDate: string;
    endDate: string;
    summary: ReportSummary;
    categories: ReportCategoryItem[];
    accounts: ReportAccountItem[];
    budgetPerformance: ReportBudgetPerformance[];
    cashFlow: ReportCashFlowPoint[];
}
//# sourceMappingURL=index.d.ts.map