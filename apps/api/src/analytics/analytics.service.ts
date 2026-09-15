import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  TransactionType,
  CategoryType,
  AccountType,
  FinancialReportResponse,
} from '@fintrack/shared';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getCashFlow(userId: string, months = 6) {
    const now = new Date();
    const results: {
      month: string;
      income: number;
      expense: number;
      net: number;
    }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const label = start.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      const agg = await this.prisma.transaction.groupBy({
        by: ['type'],
        where: { userId, date: { gte: start, lt: end } },
        _sum: { amount: true },
      });

      let income = new Prisma.Decimal(0);
      let expense = new Prisma.Decimal(0);

      for (const row of agg) {
        if (row.type === 'INCOME') income = row._sum.amount ?? new Prisma.Decimal(0);
        if (row.type === 'EXPENSE') expense = row._sum.amount ?? new Prisma.Decimal(0);
      }

      results.push({
        month: label,
        income: income.toNumber(),
        expense: expense.toNumber(),
        net: income.minus(expense).toNumber(),
      });
    }

    return results;
  }

  async getCategoryBreakdown(userId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    const groups = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    let total = new Prisma.Decimal(0);
    for (const g of groups) {
      total = total.plus(g._sum.amount ?? new Prisma.Decimal(0));
    }

    const categoryIds = groups.map((g) => g.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const catMap = new Map(categories.map((c) => [c.id, c]));

    return groups.map((g) => {
      const amount = (g._sum.amount ?? new Prisma.Decimal(0)).toNumber();
      const cat = catMap.get(g.categoryId);
      return {
        categoryId: g.categoryId,
        categoryName: cat?.name ?? 'Unknown',
        color: cat?.color ?? '#999',
        icon: cat?.icon ?? 'tag',
        amount,
        percentage: total.toNumber() > 0
          ? Math.round((amount / total.toNumber()) * 100)
          : 0,
      };
    });
  }

  async getIncomeVsExpenseSummary(userId: string) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const agg = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: { gte: startOfYear, lte: now } },
      _sum: { amount: true },
    });

    let income = new Prisma.Decimal(0);
    let expense = new Prisma.Decimal(0);

    for (const row of agg) {
      if (row.type === 'INCOME') income = row._sum.amount ?? new Prisma.Decimal(0);
      if (row.type === 'EXPENSE') expense = row._sum.amount ?? new Prisma.Decimal(0);
    }

    const net = income.minus(expense);
    const savingsRate =
      income.toNumber() > 0
        ? Math.round((net.toNumber() / income.toNumber()) * 100)
        : 0;

    return {
      ytdIncome: income.toNumber(),
      ytdExpense: expense.toNumber(),
      ytdNet: net.toNumber(),
      savingsRate,
    };
  }

  async getFinancialReport(
    userId: string,
    periodStr?: string,
    startDateStr?: string,
    endDateStr?: string,
  ): Promise<FinancialReportResponse> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    const period = periodStr ?? "this_month";

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
    } else {
      switch (period) {
        case "last_month": {
          const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          startDate = new Date(y, m, 1);
          endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
          break;
        }
        case "last_3_months": {
          startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        }
        case "last_6_months": {
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        }
        case "this_year": {
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        }
        case "this_month":
        default: {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        }
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: "asc" },
    });

    let totalIncome = new Prisma.Decimal(0);
    let totalExpense = new Prisma.Decimal(0);
    const categoryTotals = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        type: CategoryType;
        icon: string;
        color: string;
        amount: Prisma.Decimal;
        count: number;
      }
    >();

    const accountTotals = new Map<
      string,
      {
        accountId: string;
        accountName: string;
        type: AccountType;
        color: string;
        income: Prisma.Decimal;
        expense: Prisma.Decimal;
      }
    >();

    const monthlyBuckets = new Map<
      string,
      { period: string; income: Prisma.Decimal; expense: Prisma.Decimal }
    >();

    for (const tx of transactions) {
      const monthKey = tx.date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyBuckets.has(monthKey)) {
        monthlyBuckets.set(monthKey, {
          period: monthKey,
          income: new Prisma.Decimal(0),
          expense: new Prisma.Decimal(0),
        });
      }
      const mb = monthlyBuckets.get(monthKey)!;

      // STRICT FINANCIAL RULE: Transfers are not income or expense!
      if (tx.type === TransactionType.INCOME) {
        totalIncome = totalIncome.plus(tx.amount);
        mb.income = mb.income.plus(tx.amount);
      } else if (tx.type === TransactionType.EXPENSE) {
        totalExpense = totalExpense.plus(tx.amount);
        mb.expense = mb.expense.plus(tx.amount);
      }

      if (tx.category && (tx.type === TransactionType.EXPENSE || tx.type === TransactionType.INCOME)) {
        const catId = tx.category.id;
        const existing = categoryTotals.get(catId) ?? {
          categoryId: catId,
          categoryName: tx.category.name,
          type: tx.category.type as CategoryType,
          icon: tx.category.icon ?? "tag",
          color: tx.category.color ?? "#999",
          amount: new Prisma.Decimal(0),
          count: 0,
        };
        existing.amount = existing.amount.plus(tx.amount);
        existing.count++;
        categoryTotals.set(catId, existing);
      }

      if (tx.account) {
        const accId = tx.account.id;
        const existingAcc = accountTotals.get(accId) ?? {
          accountId: accId,
          accountName: tx.account.name,
          type: tx.account.type as AccountType,
          color: tx.account.color ?? "#999",
          income: new Prisma.Decimal(0),
          expense: new Prisma.Decimal(0),
        };
        if (tx.type === TransactionType.INCOME) {
          existingAcc.income = existingAcc.income.plus(tx.amount);
        } else if (tx.type === TransactionType.EXPENSE) {
          existingAcc.expense = existingAcc.expense.plus(tx.amount);
        }
        accountTotals.set(accId, existingAcc);
      }
    }

    const allUserAccounts = await this.prisma.account.findMany({
      where: { userId, isActive: true },
    });
    for (const a of allUserAccounts) {
      if (!accountTotals.has(a.id)) {
        accountTotals.set(a.id, {
          accountId: a.id,
          accountName: a.name,
          type: a.type as AccountType,
          color: a.color ?? "#999",
          income: new Prisma.Decimal(0),
          expense: new Prisma.Decimal(0),
        });
      }
    }

    const netSavings = totalIncome.minus(totalExpense);
    const savingsRate =
      totalIncome.toNumber() > 0
        ? Math.round((netSavings.toNumber() / totalIncome.toNumber()) * 100)
        : 0;

    const diffDays = Math.max(
      1,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const diffMonths = Math.max(1, Math.round(diffDays / 30));

    const categories = Array.from(categoryTotals.values())
      .map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        type: c.type,
        icon: c.icon,
        color: c.color,
        amount: c.amount.toNumber(),
        percentage:
          c.type === TransactionType.EXPENSE && totalExpense.toNumber() > 0
            ? Math.round((c.amount.toNumber() / totalExpense.toNumber()) * 100)
            : c.type === TransactionType.INCOME && totalIncome.toNumber() > 0
              ? Math.round((c.amount.toNumber() / totalIncome.toNumber()) * 100)
              : 0,
        transactionCount: c.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    const accounts = Array.from(accountTotals.values()).map((a) => ({
      accountId: a.accountId,
      accountName: a.accountName,
      type: a.type,
      color: a.color,
      income: a.income.toNumber(),
      expense: a.expense.toNumber(),
      net: a.income.minus(a.expense).toNumber(),
    }));

    const userBudgets = await this.prisma.budget.findMany({
      where: {
        userId,
        year: { gte: startDate.getFullYear(), lte: endDate.getFullYear() },
      },
      include: { category: true },
    });

    const budgetPerformance = userBudgets.map((b) => {
      const catSpent = categoryTotals.get(b.categoryId)?.amount.toNumber() ?? 0;
      const limit = Number(b.limitAmount);
      const pct = limit > 0 ? Math.round((catSpent / limit) * 100) : 0;
      const status: "ON_TRACK" | "WARNING" | "EXCEEDED" =
        pct > 100 ? "EXCEEDED" : pct >= 80 ? "WARNING" : "ON_TRACK";

      return {
        categoryId: b.categoryId,
        categoryName: b.category.name,
        budgeted: limit,
        actualSpent: catSpent,
        percentage: pct,
        status,
      };
    });

    const cashFlow = Array.from(monthlyBuckets.values()).map((mb) => ({
      period: mb.period,
      income: mb.income.toNumber(),
      expense: mb.expense.toNumber(),
      net: mb.income.minus(mb.expense).toNumber(),
    }));

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalIncome: totalIncome.toNumber(),
        totalExpense: totalExpense.toNumber(),
        netSavings: netSavings.toNumber(),
        savingsRate,
        totalTransactions: transactions.length,
        avgDailyExpense: Math.round(totalExpense.toNumber() / diffDays),
        avgMonthlyExpense: Math.round(totalExpense.toNumber() / diffMonths),
      },
      categories,
      accounts,
      budgetPerformance,
      cashFlow,
    };
  }
}
