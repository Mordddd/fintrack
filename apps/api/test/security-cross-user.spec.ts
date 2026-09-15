import { describe, it, expect, beforeEach, vi } from "vitest";
import { TransactionsService } from "../src/transactions/transactions.service";
import { AccountsService } from "../src/accounts/accounts.service";
import { BudgetsService } from "../src/budgets/budgets.service";
import { GoalsService } from "../src/goals/goals.service";
import { TransfersService } from "../src/transfers/transfers.service";
import { PrismaService } from "../src/database/prisma.service";
import { ActivityService } from "../src/activity/activity.service";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { TransactionType } from "@fintrack/shared";

describe("Security Hardening: Strict Cross-User Isolation Tests", () => {
  let prisma: any;
  let activity: any;
  let txService: TransactionsService;
  let accService: AccountsService;
  let budgetService: BudgetsService;
  let goalsService: GoalsService;
  let transfersService: TransfersService;

  const USER_A = "user-a-id";
  const USER_B = "user-b-attacker";

  beforeEach(() => {
    prisma = {
      transaction: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        create: vi.fn(),
      },
      account: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      category: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      budget: {
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      savingsGoal: {
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      transfer: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(prisma)),
    };

    activity = { log: vi.fn() };

    txService = new TransactionsService(prisma as unknown as PrismaService, activity as unknown as ActivityService);
    accService = new AccountsService(prisma as unknown as PrismaService, activity as unknown as ActivityService);
    budgetService = new BudgetsService(prisma as unknown as PrismaService, activity as unknown as ActivityService);
    goalsService = new GoalsService(prisma as unknown as PrismaService, activity as unknown as ActivityService);
    transfersService = new TransfersService(prisma as unknown as PrismaService);
  });

  describe("Transactions Isolation", () => {
    it("User B cannot fetch User A's transaction (throws ForbiddenException)", async () => {
      prisma.transaction.findUnique.mockResolvedValue({ id: "tx-user-a-1", userId: USER_A });

      await expect(txService.findOne(USER_B, "tx-user-a-1")).rejects.toThrow(ForbiddenException);
    });

    it("User B cannot update User A's transaction (throws ForbiddenException)", async () => {
      prisma.transaction.findUnique.mockResolvedValue({ id: "tx-user-a-1", userId: USER_A });

      await expect(
        txService.update(USER_B, "tx-user-a-1", { description: "Malicious update" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("User B cannot delete User A's transaction (throws ForbiddenException)", async () => {
      prisma.transaction.findUnique.mockResolvedValue({ id: "tx-user-a-1", userId: USER_A });

      await expect(txService.remove(USER_B, "tx-user-a-1")).rejects.toThrow(ForbiddenException);
    });

    it("User B cannot create a transaction using User A's account (throws ForbiddenException)", async () => {
      // Account belongs to USER_A
      prisma.account.findUnique.mockResolvedValue({ id: "acc-user-a", userId: USER_A, isActive: true });

      await expect(
        txService.create(USER_B, {
          accountId: "acc-user-a",
          categoryId: "cat-1",
          amount: 50000,
          type: TransactionType.EXPENSE,
          date: "2026-09-15",
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("User B cannot create a transaction using User A's custom category (throws ForbiddenException)", async () => {
      prisma.account.findUnique.mockResolvedValue({ id: "acc-user-b", userId: USER_B, isActive: true });
      // Category belongs to USER_A and is not default
      prisma.category.findUnique.mockResolvedValue({ id: "cat-user-a", userId: USER_A, isDefault: false });

      await expect(
        txService.create(USER_B, {
          accountId: "acc-user-b",
          categoryId: "cat-user-a",
          amount: 50000,
          type: TransactionType.EXPENSE,
          date: "2026-09-15",
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("Accounts Isolation", () => {
    it("User B cannot view User A's account (throws ForbiddenException)", async () => {
      prisma.account.findUnique.mockResolvedValue({ id: "acc-user-a", userId: USER_A });

      await expect(accService.findOne(USER_B, "acc-user-a")).rejects.toThrow(ForbiddenException);
    });

    it("User B cannot update User A's account (throws ForbiddenException)", async () => {
      prisma.account.findUnique.mockResolvedValue({ id: "acc-user-a", userId: USER_A });

      await expect(
        accService.update(USER_B, "acc-user-a", { name: "Hacked Account" }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("Budgets & Goals Isolation", () => {
    it("User B cannot modify User A's budget (throws NotFoundException)", async () => {
      prisma.budget.findUnique.mockResolvedValue({ id: "budget-user-a", userId: USER_A });

      await expect(
        budgetService.update(USER_B, "budget-user-a", { limitAmount: 9999999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it("User B cannot modify User A's savings goal (throws NotFoundException)", async () => {
      prisma.savingsGoal.findUnique.mockResolvedValue({ id: "goal-user-a", userId: USER_A });

      await expect(
        goalsService.update(USER_B, "goal-user-a", { targetAmount: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("Transfers Isolation", () => {
    it("User B cannot initiate transfer using User A's source account (throws ForbiddenException)", async () => {
      // Source account belongs to USER_A
      prisma.account.findUnique.mockResolvedValue({ id: "acc-user-a", userId: USER_A, isActive: true });

      await expect(
        transfersService.create(USER_B, {
          fromAccountId: "acc-user-a",
          toAccountId: "acc-user-b",
          amount: 1000000,
          date: "2026-09-15",
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
