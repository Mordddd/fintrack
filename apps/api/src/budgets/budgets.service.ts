import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../activity/activity.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private activity: ActivityService,
  ) {}

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

    const budget = await this.prisma.budget.upsert({
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

    // compute spent and notify if warning/exceeded
    const startOfMonth = new Date(dto.year, dto.month - 1, 1);
    const startOfNextMonth = new Date(dto.year, dto.month, 1);
    const agg = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: dto.categoryId,
        type: 'EXPENSE',
        date: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { amount: true },
    });
    const limit = budget.limitAmount;
    const spent = agg._sum.amount ?? new Prisma.Decimal(0);
    const percentage = limit.toNumber() > 0
      ? Math.round((spent.toNumber() / limit.toNumber()) * 100)
      : 0;

    if (percentage > 100) {
      await this.notifications.create(userId, 'BUDGET_EXCEEDED', 'Budget exceeded!',
        `${category.name} budget for ${dto.month}/${dto.year} exceeded (${percentage}%)`);
    } else if (percentage >= 80) {
      await this.notifications.create(userId, 'BUDGET_WARNING', 'Budget warning',
        `${category.name} budget for ${dto.month}/${dto.year} at ${percentage}%`);
    }

    await this.activity.log(userId, 'CREATE_OR_UPDATE', 'BUDGET', budget.id, {
      categoryId: dto.categoryId,
      limitAmount: dto.limitAmount,
      month: dto.month,
      year: dto.year,
    });

    return budget;
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
    const deleted = await this.prisma.budget.delete({ where: { id } });
    await this.activity.log(userId, 'DELETE', 'BUDGET', id, {
      categoryId: budget.categoryId,
    });
    return deleted;
  }
}
