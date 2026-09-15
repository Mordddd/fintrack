import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "../database/prisma.service";
import { TransactionType, CategoryType, AccountType } from "@fintrack/shared";
import { Prisma } from "@prisma/client";

describe("AnalyticsService & Financial Report Calculations", () => {
  let service: AnalyticsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      transaction: {
        findMany: vi.fn(),
        aggregate: vi.fn(),
      },
      account: {
        findMany: vi.fn(),
      },
      budget: {
        findMany: vi.fn(),
      },
    };

    service = new AnalyticsService(prisma as unknown as PrismaService);
  });

  it("strictly excludes transfers from total income, total expense, and net savings", async () => {
    prisma.account.findMany.mockResolvedValue([
      { id: "acc-1", name: "BCA", type: AccountType.BANK, color: "#10b981", isActive: true },
    ]);

    prisma.budget.findMany.mockResolvedValue([]);

    prisma.transaction.findMany.mockResolvedValue([
      {
        id: "tx-1",
        amount: new Prisma.Decimal(10000000),
        type: TransactionType.INCOME,
        date: new Date("2026-09-05"),
        category: { id: "cat-sal", name: "Salary", type: CategoryType.INCOME, icon: "briefcase", color: "#10b981" },
        account: { id: "acc-1", name: "BCA", type: AccountType.BANK, color: "#10b981" },
      },
      {
        id: "tx-2",
        amount: new Prisma.Decimal(2500000),
        type: TransactionType.EXPENSE,
        date: new Date("2026-09-10"),
        category: { id: "cat-rent", name: "Rent", type: CategoryType.EXPENSE, icon: "home", color: "#f43f5e" },
        account: { id: "acc-1", name: "BCA", type: AccountType.BANK, color: "#10b981" },
      },
      {
        // STRICT RULE: This transfer MUST NOT inflate income or expense
        id: "tx-3",
        amount: new Prisma.Decimal(5000000),
        type: TransactionType.TRANSFER,
        date: new Date("2026-09-12"),
        category: null,
        account: { id: "acc-1", name: "BCA", type: AccountType.BANK, color: "#10b981" },
      },
    ]);

    const report = await service.getFinancialReport("user-1", "this_month");

    // Income should be exactly 10,000,000 (transfer excluded)
    expect(report.summary.totalIncome).toBe(10000000);
    // Expense should be exactly 2,500,000 (transfer excluded)
    expect(report.summary.totalExpense).toBe(2500000);
    // Net savings = 10,000,000 - 2,500,000 = 7,500,000
    expect(report.summary.netSavings).toBe(7500000);
    // Savings rate = (7,500,000 / 10,000,000) * 100 = 75%
    expect(report.summary.savingsRate).toBe(75);
    // Categories should only have the expense and income, not transfer
    expect(report.categories).toHaveLength(2);
  });

  it("evaluates budget performance states (ON_TRACK, WARNING, EXCEEDED)", async () => {
    prisma.account.findMany.mockResolvedValue([]);
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: "tx-1",
        amount: new Prisma.Decimal(900000),
        type: TransactionType.EXPENSE,
        date: new Date("2026-09-02"),
        category: { id: "cat-food", name: "Food", type: CategoryType.EXPENSE, icon: "utensils", color: "#eab308" },
        account: null,
      },
      {
        id: "tx-2",
        amount: new Prisma.Decimal(1200000),
        type: TransactionType.EXPENSE,
        date: new Date("2026-09-03"),
        category: { id: "cat-shop", name: "Shopping", type: CategoryType.EXPENSE, icon: "shopping-bag", color: "#f43f5e" },
        account: null,
      },
    ]);

    prisma.budget.findMany.mockResolvedValue([
      {
        categoryId: "cat-food",
        limitAmount: new Prisma.Decimal(1000000),
        category: { name: "Food" },
      },
      {
        categoryId: "cat-shop",
        limitAmount: new Prisma.Decimal(1000000),
        category: { name: "Shopping" },
      },
    ]);

    const report = await service.getFinancialReport("user-1", "this_month");
    const foodBudget = report.budgetPerformance.find((b) => b.categoryId === "cat-food");
    const shopBudget = report.budgetPerformance.find((b) => b.categoryId === "cat-shop");

    // Food: 900,000 / 1,000,000 = 90% -> WARNING
    expect(foodBudget?.status).toBe("WARNING");
    // Shopping: 1,200,000 / 1,000,000 = 120% -> EXCEEDED
    expect(shopBudget?.status).toBe("EXCEEDED");
  });
});
