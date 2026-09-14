import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRecurringDto, UpdateRecurringDto } from './dto';

function calculateNextDate(current: Date, frequency: string): Date {
  const d = new Date(current);
  switch (frequency) {
    case 'DAILY':
      d.setDate(d.getDate() + 1);
      break;
    case 'WEEKLY':
      d.setDate(d.getDate() + 7);
      break;
    case 'MONTHLY': {
      const day = d.getDate();
      d.setMonth(d.getMonth() + 1);
      // handle month-end: Jan 31 → Feb 28
      if (d.getDate() < day) d.setDate(0); // last day of prev month
      break;
    }
    case 'YEARLY': {
      const day2 = d.getDate();
      d.setFullYear(d.getFullYear() + 1);
      if (d.getDate() < day2) d.setDate(0);
      break;
    }
  }
  return d;
}

@Injectable()
export class RecurringService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private readonly include = { account: true, category: true } as const;

  async create(userId: string, dto: CreateRecurringDto) {
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId },
    });
    if (!account) throw new BadRequestException('Account not found');

    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, OR: [{ userId }, { isDefault: true }] },
    });
    if (!category) throw new BadRequestException('Category not found');

    return this.prisma.recurringTransaction.create({
      data: {
        userId,
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        type: dto.type as any,
        amount: new Prisma.Decimal(dto.amount),
        description: dto.description,
        frequency: dto.frequency as any,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        nextRunDate: new Date(dto.startDate),
      },
      include: this.include,
    });
  }

  async findAll(userId: string) {
    return this.prisma.recurringTransaction.findMany({
      where: { userId },
      include: this.include,
      orderBy: { nextRunDate: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const rec = await this.prisma.recurringTransaction.findUnique({
      where: { id },
      include: this.include,
    });
    if (!rec || rec.userId !== userId) throw new NotFoundException('Recurring transaction not found');
    return rec;
  }

  async update(userId: string, id: string, dto: UpdateRecurringDto) {
    const rec = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (!rec || rec.userId !== userId) throw new NotFoundException('Recurring transaction not found');

    const data: any = {};
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.frequency !== undefined) {
      data.frequency = dto.frequency as any;
      data.nextRunDate = calculateNextDate(rec.nextRunDate, dto.frequency);
    }

    return this.prisma.recurringTransaction.update({
      where: { id },
      data,
      include: this.include,
    });
  }

  async remove(userId: string, id: string) {
    const rec = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (!rec || rec.userId !== userId) throw new NotFoundException('Recurring transaction not found');
    return this.prisma.recurringTransaction.delete({ where: { id } });
  }

  async pause(userId: string, id: string) {
    const rec = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (!rec || rec.userId !== userId) throw new NotFoundException('Recurring transaction not found');
    return this.prisma.recurringTransaction.update({
      where: { id },
      data: { isActive: false },
      include: this.include,
    });
  }

  async resume(userId: string, id: string) {
    const rec = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (!rec || rec.userId !== userId) throw new NotFoundException('Recurring transaction not found');

    // calculate next future occurrence from today
    let next = new Date(rec.nextRunDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    while (next <= today) {
      next = calculateNextDate(next, rec.frequency);
    }

    return this.prisma.recurringTransaction.update({
      where: { id },
      data: { isActive: true, nextRunDate: next },
      include: this.include,
    });
  }

  async processDueRecurring(userId: string) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dueItems = await this.prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextRunDate: { lte: today },
        OR: [{ endDate: null }, { endDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }],
      },
      include: { account: true },
    });

    let processed = 0;

    for (const rec of dueItems) {
      const amount = rec.amount;

      await this.prisma.$transaction(async (tx) => {
        // create the real transaction
        await tx.transaction.create({
          data: {
            userId,
            accountId: rec.accountId,
            categoryId: rec.categoryId,
            type: rec.type,
            amount,
            description: rec.description,
            date: rec.nextRunDate,
          },
        });

        // update account balance
        const balanceChange =
          rec.type === 'INCOME'
            ? rec.account.currentBalance.plus(amount)
            : rec.account.currentBalance.minus(amount);

        await tx.account.update({
          where: { id: rec.accountId },
          data: { currentBalance: balanceChange },
        });

        // calculate next run date
        const nextDate = calculateNextDate(rec.nextRunDate, rec.frequency);
        const shouldDeactivate = rec.endDate && nextDate > rec.endDate;

        await tx.recurringTransaction.update({
          where: { id: rec.id },
          data: {
            nextRunDate: nextDate,
            ...(shouldDeactivate && { isActive: false }),
          },
        });
      });

      await this.notifications.create(
        userId,
        'RECURRING_PROCESSED',
        'Recurring transaction processed',
        `${rec.type} of ${amount.toNumber()} processed for ${rec.description ?? 'recurring transaction'}`,
      );

      processed++;
    }

    return { processed };
  }
}
