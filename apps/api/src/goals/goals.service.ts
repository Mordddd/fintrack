import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGoalDto, UpdateGoalDto, DepositGoalDto } from './dto';

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private formatGoal(goal: any) {
    const current = goal.currentAmount instanceof Prisma.Decimal ? goal.currentAmount : new Prisma.Decimal(goal.currentAmount);
    const target = goal.targetAmount instanceof Prisma.Decimal ? goal.targetAmount : new Prisma.Decimal(goal.targetAmount);
    const remaining = target.minus(current);
    const percentage = target.toNumber() > 0
      ? Math.min(100, Math.round((current.toNumber() / target.toNumber()) * 100))
      : 0;

    return {
      ...goal,
      targetAmount: target.toNumber(),
      currentAmount: current.toNumber(),
      percentage,
      isCompleted: current.gte(target),
      remainingAmount: Math.max(0, remaining.toNumber()),
    };
  }

  async create(userId: string, dto: CreateGoalDto) {
    const goal = await this.prisma.savingsGoal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: new Prisma.Decimal(dto.targetAmount),
        currentAmount: new Prisma.Decimal(dto.currentAmount ?? 0),
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        description: dto.description,
        icon: dto.icon,
      },
    });
    return this.formatGoal(goal);
  }

  async findAll(userId: string) {
    const goals = await this.prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => this.formatGoal(g));
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal || goal.userId !== userId) {
      throw new NotFoundException('Goal not found');
    }

    return this.formatGoal(goal);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal || goal.userId !== userId) {
      throw new NotFoundException('Goal not found');
    }

    const updated = await this.prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.targetAmount !== undefined && {
          targetAmount: new Prisma.Decimal(dto.targetAmount),
        }),
        ...(dto.deadline !== undefined && { deadline: new Date(dto.deadline) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
    });
    return this.formatGoal(updated);
  }

  async deposit(userId: string, id: string, dto: DepositGoalDto) {
    const goal = await this.prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal || goal.userId !== userId) {
      throw new NotFoundException('Goal not found');
    }

    const newAmount = goal.currentAmount.plus(new Prisma.Decimal(dto.amount));
    const finalAmount = newAmount.lt(new Prisma.Decimal(0))
      ? new Prisma.Decimal(0)
      : newAmount;

    const updated = await this.prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: finalAmount },
    });

    if (finalAmount.gte(goal.targetAmount)) {
      await this.notifications.create(
        userId,
        'GOAL_COMPLETED',
        'Goal completed!',
        `${goal.name} target of Rp ${goal.targetAmount.toNumber()} reached!`,
      );
    }

    return this.formatGoal(updated);
  }

  async remove(userId: string, id: string) {
    const goal = await this.prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal || goal.userId !== userId) {
      throw new NotFoundException('Goal not found');
    }
    return this.prisma.savingsGoal.delete({ where: { id } });
  }
}
