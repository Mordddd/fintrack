import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

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
}
