import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  private buildWhere(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    return where;
  }

  private async getTransactions(userId: string, startDate?: string, endDate?: string) {
    return this.prisma.transaction.findMany({
      where: this.buildWhere(userId, startDate, endDate),
      include: { account: true, category: true },
      orderBy: { date: 'desc' },
    });
  }

  private escapeCSV(value: string): string {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async exportTransactionsCSV(userId: string, startDate?: string, endDate?: string): Promise<string> {
    const txns = await this.getTransactions(userId, startDate, endDate);

    const header = 'Date,Type,Category,Account,Description,Amount,Notes';
    const rows = txns.map((t) =>
      [
        this.escapeCSV(t.date.toISOString().split('T')[0]),
        this.escapeCSV(t.type),
        this.escapeCSV(t.category.name),
        this.escapeCSV(t.account.name),
        this.escapeCSV(t.description ?? ''),
        this.escapeCSV(t.amount.toString()),
        this.escapeCSV(t.notes ?? ''),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  async exportTransactionsJSON(userId: string, startDate?: string, endDate?: string) {
    const txns = await this.getTransactions(userId, startDate, endDate);

    return txns.map((t) => ({
      date: t.date.toISOString().split('T')[0],
      type: t.type,
      category: t.category.name,
      account: t.account.name,
      description: t.description ?? '',
      amount: t.amount.toNumber(),
      notes: t.notes ?? '',
    }));
  }
}
