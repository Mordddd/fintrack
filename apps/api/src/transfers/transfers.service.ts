import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateTransferDto } from "./dto";

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException("Source and destination accounts must be different");
    }

    // Verify fromAccount
    const fromAcc = await this.prisma.account.findUnique({
      where: { id: dto.fromAccountId },
    });
    if (!fromAcc || !fromAcc.isActive) {
      throw new NotFoundException("Source account not found or inactive");
    }
    if (fromAcc.userId !== userId) {
      throw new ForbiddenException("Source account does not belong to user");
    }

    // Verify toAccount
    const toAcc = await this.prisma.account.findUnique({
      where: { id: dto.toAccountId },
    });
    if (!toAcc || !toAcc.isActive) {
      throw new NotFoundException("Destination account not found or inactive");
    }
    if (toAcc.userId !== userId) {
      throw new ForbiddenException("Destination account does not belong to user");
    }

    const amountDecimal = new Prisma.Decimal(dto.amount);
    const transferDate = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Deduct from source
      await tx.account.update({
        where: { id: dto.fromAccountId },
        data: { currentBalance: { decrement: amountDecimal } },
      });

      // 2. Add to destination
      await tx.account.update({
        where: { id: dto.toAccountId },
        data: { currentBalance: { increment: amountDecimal } },
      });

      // 3. Create transfer record
      const transfer = await tx.transfer.create({
        data: {
          userId,
          fromAccountId: dto.fromAccountId,
          toAccountId: dto.toAccountId,
          amount: amountDecimal,
          description: dto.description ?? null,
          date: transferDate,
        },
        include: {
          fromAccount: {
            select: { id: true, name: true, color: true, icon: true },
          },
          toAccount: {
            select: { id: true, name: true, color: true, icon: true },
          },
        },
      });

      return this.mapTransfer(transfer);
    });
  }

  async findAll(userId: string) {
    const transfers = await this.prisma.transfer.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: {
        fromAccount: {
          select: { id: true, name: true, color: true, icon: true },
        },
        toAccount: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
    });

    return transfers.map((t) => this.mapTransfer(t));
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.transfer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Transfer not found");
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied to this transfer");
    }

    return this.prisma.$transaction(async (tx) => {
      // Revert balances: refund source, deduct destination
      await tx.account.update({
        where: { id: existing.fromAccountId },
        data: { currentBalance: { increment: existing.amount } },
      });

      await tx.account.update({
        where: { id: existing.toAccountId },
        data: { currentBalance: { decrement: existing.amount } },
      });

      await tx.transfer.delete({
        where: { id },
      });

      return { success: true, message: "Transfer deleted and balances reverted" };
    });
  }

  private mapTransfer(t: any) {
    return {
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
