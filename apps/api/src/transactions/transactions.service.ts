import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ActivityService } from "../activity/activity.service";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
} from "./dto";
import { TransactionType } from "@fintrack/shared";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    // 1. Verify account
    const account = await this.prisma.account.findUnique({
      where: { id: dto.accountId },
    });
    if (!account || !account.isActive) {
      throw new NotFoundException("Active account not found");
    }
    if (account.userId !== userId) {
      throw new ForbiddenException("Account does not belong to user");
    }

    // 2. Verify category
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    if (category.userId && category.userId !== userId && !category.isDefault) {
      throw new ForbiddenException("Category does not belong to user");
    }

    const amountDecimal = new Prisma.Decimal(dto.amount);
    const txDate = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          type: dto.type,
          amount: amountDecimal,
          description: dto.description ?? null,
          date: txDate,
          notes: dto.notes ?? null,
        },
        include: {
          account: {
            select: { id: true, name: true, type: true, color: true, icon: true },
          },
          category: {
            select: { id: true, name: true, type: true, icon: true, color: true },
          },
        },
      });

      // Update account balance
      const balanceDelta =
        dto.type === TransactionType.INCOME
          ? amountDecimal
          : amountDecimal.negated();

      await tx.account.update({
        where: { id: dto.accountId },
        data: {
          currentBalance: {
            increment: balanceDelta,
          },
        },
      });

      const res = this.mapTransaction(transaction);
      this.activity.log(userId, "CREATE", "TRANSACTION", transaction.id, {
        amount: dto.amount,
        type: dto.type,
        description: dto.description,
      });
      return res;
    });
  }

  async findAll(userId: string, query: TransactionQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    if (query.type) {
      where.type = query.type;
    }
    if (query.accountId) {
      where.accountId = query.accountId;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const sortBy = query.sortBy ?? "date";
    const sortOrder = query.sortOrder ?? "desc";

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          account: {
            select: { id: true, name: true, type: true, color: true, icon: true },
          },
          category: {
            select: { id: true, name: true, type: true, icon: true, color: true },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: transactions.map((t) => this.mapTransaction(t)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        account: {
          select: { id: true, name: true, type: true, color: true, icon: true },
        },
        category: {
          select: { id: true, name: true, type: true, icon: true, color: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException("Access denied to this transaction");
    }

    return this.mapTransaction(transaction);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Transaction not found");
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied to this transaction");
    }

    const targetAccountId = dto.accountId ?? existing.accountId;
    const targetCategoryId = dto.categoryId ?? existing.categoryId;

    // Verify target account & category
    if (dto.accountId && dto.accountId !== existing.accountId) {
      const acc = await this.prisma.account.findUnique({
        where: { id: dto.accountId },
      });
      if (!acc || !acc.isActive || acc.userId !== userId) {
        throw new BadRequestException("Invalid target account");
      }
    }

    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const cat = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!cat || (cat.userId && cat.userId !== userId && !cat.isDefault)) {
        throw new BadRequestException("Invalid target category");
      }
    }

    const newAmountDecimal =
      dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : existing.amount;
    const newType = dto.type ?? existing.type;

    return this.prisma.$transaction(async (tx) => {
      // 1. Revert effect of existing transaction on old account
      const oldRevertDelta =
        existing.type === TransactionType.INCOME
          ? existing.amount.negated() // Subtract old income
          : existing.amount; // Add back old expense

      await tx.account.update({
        where: { id: existing.accountId },
        data: { currentBalance: { increment: oldRevertDelta } },
      });

      // 2. Apply effect of new transaction on target account
      const newApplyDelta =
        newType === TransactionType.INCOME
          ? newAmountDecimal // Add new income
          : newAmountDecimal.negated(); // Deduct new expense

      await tx.account.update({
        where: { id: targetAccountId },
        data: { currentBalance: { increment: newApplyDelta } },
      });

      // 3. Update transaction record
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          accountId: targetAccountId,
          categoryId: targetCategoryId,
          type: newType,
          amount: newAmountDecimal,
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.date ? { date: new Date(dto.date) } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        },
        include: {
          account: {
            select: { id: true, name: true, type: true, color: true, icon: true },
          },
          category: {
            select: { id: true, name: true, type: true, icon: true, color: true },
          },
        },
      });

      const res = this.mapTransaction(updated);
      this.activity.log(userId, "UPDATE", "TRANSACTION", updated.id, {
        amount: dto.amount,
        type: newType,
        description: dto.description,
      });
      return res;
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Transaction not found");
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied to this transaction");
    }

    return this.prisma.$transaction(async (tx) => {
      // Reverse balance effect
      const revertDelta =
        existing.type === TransactionType.INCOME
          ? existing.amount.negated()
          : existing.amount;

      await tx.account.update({
        where: { id: existing.accountId },
        data: { currentBalance: { increment: revertDelta } },
      });

      await tx.transaction.delete({
        where: { id },
      });

      this.activity.log(userId, "DELETE", "TRANSACTION", id, {
        description: existing.description,
      });

      return { success: true, message: "Transaction deleted successfully" };
    });
  }

  async getDashboardMetrics(userId: string) {
    // Current month bounds
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Sum active accounts balance
    const accounts = await this.prisma.account.findMany({
      where: { userId, isActive: true },
      select: { currentBalance: true },
    });
    let totalBalance = new Prisma.Decimal(0);
    for (const a of accounts) {
      totalBalance = totalBalance.plus(a.currentBalance);
    }

    // Monthly transactions aggregate
    const monthlyTxs = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: { type: true, amount: true },
    });

    let incomeThisMonth = new Prisma.Decimal(0);
    let expensesThisMonth = new Prisma.Decimal(0);

    for (const tx of monthlyTxs) {
      if (tx.type === TransactionType.INCOME) {
        incomeThisMonth = incomeThisMonth.plus(tx.amount);
      } else if (tx.type === TransactionType.EXPENSE) {
        expensesThisMonth = expensesThisMonth.plus(tx.amount);
      }
    }

    // Recent 5 transactions
    const recent = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
      include: {
        account: {
          select: { id: true, name: true, type: true, color: true, icon: true },
        },
        category: {
          select: { id: true, name: true, type: true, icon: true, color: true },
        },
      },
    });

    return {
      totalBalance: Number(totalBalance),
      incomeThisMonth: Number(incomeThisMonth),
      expensesThisMonth: Number(expensesThisMonth),
      savings: Number(totalBalance),
      recentTransactions: recent.map((t) => this.mapTransaction(t)),
    };
  }

  private mapTransaction(t: any) {
    return {
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
