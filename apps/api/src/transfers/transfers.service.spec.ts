import { describe, it, expect, beforeEach, vi } from "vitest";
import { TransfersService } from "./transfers.service";
import { PrismaService } from "../database/prisma.service";
import { ActivityService } from "../activity/activity.service";
import { Prisma } from "@prisma/client";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("TransfersService Unit Tests", () => {
  let service: TransfersService;
  let prisma: any;
  let activity: any;

  beforeEach(() => {
    prisma = {
      transfer: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      account: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(prisma)),
    };

    activity = {
      log: vi.fn(),
    };

    service = new TransfersService(prisma as unknown as PrismaService);
  });

  it("throws BadRequestException if fromAccountId and toAccountId are identical", async () => {
    await expect(
      service.create("user-1", {
        fromAccountId: "acc-1",
        toAccountId: "acc-1",
        amount: 100000,
        date: "2026-09-15",
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("atomically decrements source account and increments destination account", async () => {
    prisma.account.findUnique
      .mockResolvedValueOnce({ id: "acc-from", userId: "user-1", isActive: true })
      .mockResolvedValueOnce({ id: "acc-to", userId: "user-1", isActive: true });

    prisma.transfer.create.mockResolvedValue({
      id: "tr-1",
      userId: "user-1",
      fromAccountId: "acc-from",
      toAccountId: "acc-to",
      amount: new Prisma.Decimal(250000),
      date: new Date("2026-09-15"),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      fromAccount: { id: "acc-from", name: "BCA" },
      toAccount: { id: "acc-to", name: "GoPay" },
    });

    const res = await service.create("user-1", {
      fromAccountId: "acc-from",
      toAccountId: "acc-to",
      amount: 250000,
      date: "2026-09-15",
    });

    expect(res.id).toBe("tr-1");
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: "acc-from" },
      data: { currentBalance: { decrement: expect.any(Object) } },
    });
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: "acc-to" },
      data: { currentBalance: { increment: expect.any(Object) } },
    });
  });
});
