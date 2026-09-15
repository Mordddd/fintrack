import { describe, it, expect, beforeEach, vi } from "vitest";
import { TransactionsService } from "./transactions.service";
import { PrismaService } from "../database/prisma.service";
import { ActivityService } from "../activity/activity.service";
import { TransactionType } from "@fintrack/shared";
import { Prisma } from "@prisma/client";

describe("TransactionsService Unit Tests", () => {
  let service: TransactionsService;
  let prisma: any;
  let activity: any;

  beforeEach(() => {
    prisma = {
      transaction: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
      },
      account: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      category: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(prisma)),
    };

    activity = {
      log: vi.fn(),
    };

    service = new TransactionsService(prisma as unknown as PrismaService, activity as unknown as ActivityService);
  });

  describe("create", () => {
    it("creates an income transaction and atomically increments account balance", async () => {
      prisma.account.findUnique.mockResolvedValue({ id: "acc-1", userId: "user-1", isActive: true });
      prisma.category.findUnique.mockResolvedValue({ id: "cat-1", userId: "user-1", isDefault: false });
      prisma.transaction.create.mockResolvedValue({
        id: "tx-1",
        userId: "user-1",
        accountId: "acc-1",
        categoryId: "cat-1",
        amount: new Prisma.Decimal(500000),
        type: TransactionType.INCOME,
        date: new Date("2026-09-15"),
        description: "Freelance",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        account: { id: "acc-1", name: "BCA" },
        category: { id: "cat-1", name: "Salary" },
      });

      const res = await service.create("user-1", {
        accountId: "acc-1",
        categoryId: "cat-1",
        amount: 500000,
        type: TransactionType.INCOME,
        date: "2026-09-15",
        description: "Freelance",
      });

      expect(res.id).toBe("tx-1");
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: "acc-1" },
        data: { currentBalance: { increment: expect.any(Object) } },
      });
      expect(activity.log).toHaveBeenCalledWith("user-1", "CREATE", "TRANSACTION", "tx-1", expect.any(Object));
    });

    it("creates an expense transaction and atomically decrements account balance", async () => {
      prisma.account.findUnique.mockResolvedValue({ id: "acc-1", userId: "user-1", isActive: true });
      prisma.category.findUnique.mockResolvedValue({ id: "cat-1", userId: "user-1", isDefault: false });
      prisma.transaction.create.mockResolvedValue({
        id: "tx-2",
        userId: "user-1",
        accountId: "acc-1",
        categoryId: "cat-1",
        amount: new Prisma.Decimal(75000),
        type: TransactionType.EXPENSE,
        date: new Date("2026-09-15"),
        description: "Groceries",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        account: { id: "acc-1", name: "BCA" },
        category: { id: "cat-1", name: "Food" },
      });

      await service.create("user-1", {
        accountId: "acc-1",
        categoryId: "cat-1",
        amount: 75000,
        type: TransactionType.EXPENSE,
        date: "2026-09-15",
        description: "Groceries",
      });

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: "acc-1" },
        data: { currentBalance: { increment: expect.anything() } },
      });
    });
  });

  describe("importBatch", () => {
    it("imports valid rows, skips duplicates, and returns summary counts", async () => {
      prisma.account.findMany.mockResolvedValue([{ id: "acc-1" }]);
      prisma.category.findMany.mockResolvedValue([{ id: "cat-1" }]);
      prisma.transaction.findMany.mockResolvedValue([
        {
          accountId: "acc-1",
          categoryId: "cat-1",
          amount: new Prisma.Decimal(25000),
          date: new Date("2026-09-10"),
          description: "Lunch",
          type: TransactionType.EXPENSE,
        },
      ]);

      const result = await service.importBatch("user-1", {
        skipDuplicates: true,
        items: [
          {
            accountId: "acc-1",
            categoryId: "cat-1",
            amount: 50000,
            date: "2026-09-11",
            description: "Dinner",
            type: TransactionType.EXPENSE,
          },
          {
            // Duplicate
            accountId: "acc-1",
            categoryId: "cat-1",
            amount: 25000,
            date: "2026-09-10",
            description: "Lunch",
            type: TransactionType.EXPENSE,
          },
          {
            // Invalid account
            accountId: "foreign-acc",
            categoryId: "cat-1",
            amount: 10000,
            date: "2026-09-12",
            description: "Snack",
            type: TransactionType.EXPENSE,
          },
        ],
      });

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.duplicate).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("foreign-acc");
    });
  });
});
