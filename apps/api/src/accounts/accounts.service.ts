import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ActivityService } from "../activity/activity.service";
import { CreateAccountDto, UpdateAccountDto } from "./dto";

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async create(userId: string, dto: CreateAccountDto) {
    const initialDecimal = new Prisma.Decimal(dto.initialBalance);
    const account = await this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        initialBalance: initialDecimal,
        currentBalance: initialDecimal,
        currency: dto.currency ?? "IDR",
        color: dto.color ?? "#059669",
        icon: dto.icon ?? "wallet",
        isActive: true,
      },
    });

    await this.activity.log(userId, "CREATE", "ACCOUNT", account.id, {
      name: account.name,
      type: account.type,
    });

    return this.mapAccount(account);
  }

  async findAll(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
    });
    return accounts.map((acc) => this.mapAccount(acc));
  }

  async findOne(userId: string, id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    if (account.userId !== userId) {
      throw new ForbiddenException("Access denied to this account");
    }

    return this.mapAccount(account);
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    const existing = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Account not found");
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied to this account");
    }

    return this.prisma.$transaction(async (tx) => {
      let newCurrentBalance = existing.currentBalance;

      if (
        dto.initialBalance !== undefined &&
        dto.initialBalance !== null &&
        Number(existing.initialBalance) !== dto.initialBalance
      ) {
        const newInitial = new Prisma.Decimal(dto.initialBalance);
        const delta = newInitial.minus(existing.initialBalance);
        newCurrentBalance = existing.currentBalance.plus(delta);
      }

      const updated = await tx.account.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.type ? { type: dto.type } : {}),
          ...(dto.initialBalance !== undefined
            ? {
                initialBalance: new Prisma.Decimal(dto.initialBalance),
                currentBalance: newCurrentBalance,
              }
            : {}),
          ...(dto.currency ? { currency: dto.currency } : {}),
          ...(dto.color !== undefined ? { color: dto.color } : {}),
          ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
        },
      });

      const res = this.mapAccount(updated);
      this.activity.log(userId, "UPDATE", "ACCOUNT", updated.id, {
        name: updated.name,
      });
      return res;
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Account not found");
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied to this account");
    }

    // Soft delete
    const updated = await this.prisma.account.update({
      where: { id },
      data: { isActive: false },
    });

    await this.activity.log(userId, "DELETE", "ACCOUNT", id, {
      name: existing.name,
    });

    return this.mapAccount(updated);
  }

  async getBalanceSummary(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, isActive: true },
    });

    let totalDecimal = new Prisma.Decimal(0);
    const byType: Record<string, number> = {};

    for (const acc of accounts) {
      totalDecimal = totalDecimal.plus(acc.currentBalance);
      const val = Number(acc.currentBalance);
      byType[acc.type] = (byType[acc.type] ?? 0) + val;
    }

    return {
      totalBalance: Number(totalDecimal),
      accountCount: accounts.length,
      byType,
    };
  }

  private mapAccount(acc: any) {
    return {
      ...acc,
      initialBalance: Number(acc.initialBalance),
      currentBalance: Number(acc.currentBalance),
      createdAt: acc.createdAt.toISOString(),
      updatedAt: acc.updatedAt.toISOString(),
    };
  }
}
