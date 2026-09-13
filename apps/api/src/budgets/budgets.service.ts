import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdate(userId: string, dto: CreateBudgetDto) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        type: 'EXPENSE',
        OR: [{ userId }, { isDefault: true }],
      },
    });
    if (!category) {
      throw new BadRequestException(
        'Category not found or not an expense category',
      );
    }

    return this.prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: dto.categoryId,
          month: dto.month,
          year: dto.year,
        },
      },
      update: { limitAmount: new Prisma.Decimal(dto.limitAmount) },
      create: {
        userId,
        categoryId: dto.categoryId,
        month: dto.month,
        year: dto.year,
        limitAmount: new Prisma.Decimal(dto.limitAmount),
      },
      include: { category: true },
    });
  }

  async findAll(userId: string, month: number, year: number) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const startOfNextMonth = new Date(year, month, 1);

    return Promise.all(
      budgets.map(async (budget) => {
        const agg = await this.prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: { gte: startOfMonth, lt: startOfNextMonth },
          },
          _sum: { amount: true },
        });

        const limit = budget.limitAmount;
        const spent = agg._sum.amount ?? new Prisma.Decimal(0);
        const remaining = limit.minus(spent);
        const percentage = limit.toNumber() > 0
          ? Math.round((spent.toNumber() / limit.toNumber()) * 100)
          : 0;
        const status =
          percentage > 100 ? 'EXCEEDED' : percentage >= 80 ? 'WARNING' : 'ON_TRACK';

        return {
          ...budget,
          spent: spent.toNumber(),
          remaining: remaining.toNumber(),
          percentage,
          status,
        };
      }),
    );
  }

  async getSummary(userId: string, month: number, year: number) {
    const budgets = await this.findAll(userId, month, year);

    let totalBudgeted = new Prisma.Decimal(0);
    let totalSpent = new Prisma.Decimal(0);

    for (const b of budgets) {
      totalBudgeted = totalBudgeted.plus(b.limitAmount);
      totalSpent = totalSpent.plus(b.spent);
    }

    const remaining = totalBudgeted.minus(totalSpent);
    const overallPercentage = totalBudgeted.toNumber() > 0
      ? Math.round((totalSpent.toNumber() / totalBudgeted.toNumber()) * 100)
      : 0;

    return {
      totalBudgeted: totalBudgeted.toNumber(),
      totalSpent: totalSpent.toNumber(),
      remaining: remaining.toNumber(),
      overallPercentage,
      budgetCount: budgets.length,
    };
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }
    return this.prisma.budget.update({
      where: { id },
      data: { limitAmount: new Prisma.Decimal(dto.limitAmount) },
      include: { category: true },
    });
  }

  async remove(userId: string, id: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }
    return this.prisma.budget.delete({ where: { id } });
  }
}
