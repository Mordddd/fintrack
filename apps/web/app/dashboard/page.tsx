"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { getDashboardSummary, getBudgets, getGoals, getRecurringTransactions } from "@/lib/api";
import { formatIDR, formatDate, cn } from "@/lib/utils";
import type { DashboardSummaryResponse, BudgetResponse, SavingsGoalResponse, RecurringTransactionResponse } from "@fintrack/shared";
import { TransactionType } from "@fintrack/shared";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  Plus,
  ArrowLeftRight,
  ReceiptText,
  Target,
  BarChart3,
  RefreshCw,
  Calendar,
  RotateCcw,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [goals, setGoals] = useState<SavingsGoalResponse[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const [res, b, g, r] = await Promise.all([
        getDashboardSummary(),
        getBudgets(now.getMonth() + 1, now.getFullYear()).catch(() => []),
        getGoals().catch(() => []),
        getRecurringTransactions().catch(() => []),
      ]);
      setData(res);
      setBudgets(b);
      setGoals(g);
      setRecurring(r.filter((x: RecurringTransactionResponse) => x.isActive).slice(0, 3));
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();

    function handleTxCreated() {
      loadMetrics();
    }
    window.addEventListener("fintrack:transaction-created", handleTxCreated);
    return () => window.removeEventListener("fintrack:transaction-created", handleTxCreated);
  }, [loadMetrics]);

  function handleRepeatTransaction(tx: NonNullable<DashboardSummaryResponse["recentTransactions"]>[number]) {
    window.dispatchEvent(
      new CustomEvent("fintrack:quick-add", {
        detail: {
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          categoryId: tx.category?.id,
          accountId: tx.account?.id,
        },
      }),
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Here is your financial status for this month
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("fintrack:quick-add", {}))}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
          <Link
            href="/dashboard/transfers"
            className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-[#1C1917] border border-stone-200 rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm"
          >
            <ArrowLeftRight className="h-4 w-4 text-stone-500" />
            Transfer
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Total Balance
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tracking-tight text-[#1C1917]">
            {loading ? "..." : formatIDR(data?.totalBalance ?? 0)}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Across all active accounts
          </span>
        </div>

        {/* Income this Month */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Income this Month
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tracking-tight text-emerald-600">
            {loading ? "..." : `+${formatIDR(data?.incomeThisMonth ?? 0)}`}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            This calendar month
          </span>
        </div>

        {/* Expenses this Month */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Expenses this Month
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tracking-tight text-rose-600">
            {loading ? "..." : `-${formatIDR(data?.expensesThisMonth ?? 0)}`}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            This calendar month
          </span>
        </div>

        {/* Net Savings */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Net Savings
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tracking-tight text-[#1C1917]">
            {loading
              ? "..."
              : formatIDR((data?.incomeThisMonth ?? 0) - (data?.expensesThisMonth ?? 0))}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Income minus expenses
          </span>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2 className="text-base font-semibold text-[#1C1917]">
              Recent Transactions
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Latest financial activity recorded
            </p>
          </div>
          <Link
            href="/dashboard/transactions"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !data?.recentTransactions || data.recentTransactions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-400 mb-2">
              <ReceiptText className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-stone-600">
              No transactions recorded yet
            </p>
            <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
              Start tracking your income and expenses to see insights and patterns here.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("fintrack:quick-add", {}))}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add your first transaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {data.recentTransactions.map((tx) => {
              const isIncome = tx.type === TransactionType.INCOME;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-stone-50/70 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tx.category?.color || "#059669" }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1C1917] truncate">
                        {tx.description || "Untitled Transaction"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5 flex-wrap">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span>{tx.category?.name || "General"}</span>
                        <span>•</span>
                        <span>{tx.account?.name || "Account"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleRepeatTransaction(tx)}
                      title="Repeat this transaction"
                      aria-label="Repeat this transaction"
                      className="opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 text-stone-500 hover:text-emerald-700 text-xs flex items-center gap-1 font-medium"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span className="hidden md:inline">Repeat</span>
                    </button>
                    <span
                      className={cn(
                        "font-mono text-sm font-semibold",
                        isIncome ? "text-emerald-600" : "text-rose-600",
                      )}
                    >
                      {isIncome ? "+" : "-"}
                      {formatIDR(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget Status & Goals Preview */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Budget Status */}
        <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
            <div>
              <h2 className="text-base font-semibold text-[#1C1917]">Budget Status</h2>
              <p className="text-xs text-stone-500 mt-0.5">This month&apos;s spending limits</p>
            </div>
            <Link href="/dashboard/budgets" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {budgets.length === 0 ? (
            <div className="p-6 text-center">
              <PiggyBank className="h-8 w-8 mx-auto text-stone-300 mb-2" />
              <p className="text-xs text-stone-500">No budgets set</p>
              <Link href="/dashboard/budgets" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Plus className="h-3 w-3" /> Set budget
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 px-6">
              {budgets.slice(0, 3).map((b) => {
                const remaining = b.remaining;
                const isExceeded = b.status === "EXCEEDED";
                return (
                  <div key={b.id} className="py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.category?.color ?? "#059669" }} />
                        <span className="text-sm font-medium text-[#1C1917] truncate">{b.category?.name}</span>
                      </div>
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                        b.status === "EXCEEDED" ? "bg-rose-50 text-rose-600" :
                        b.status === "WARNING" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {b.percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={cn("h-full rounded-full transition-all duration-300",
                          b.status === "EXCEEDED" ? "bg-rose-500" :
                          b.status === "WARNING" ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                      <span>{formatIDR(b.spent)} spent of {formatIDR(b.limitAmount)}</span>
                      <span className={cn("font-medium", isExceeded ? "text-rose-600" : "text-stone-500")}>
                        {isExceeded
                          ? `Exceeded by ${formatIDR(Math.abs(remaining))}`
                          : `${formatIDR(remaining)} remaining`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Goals Preview */}
        <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
            <div>
              <h2 className="text-base font-semibold text-[#1C1917]">Savings Goals</h2>
              <p className="text-xs text-stone-500 mt-0.5">Progress toward your targets</p>
            </div>
            <Link href="/dashboard/goals" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {goals.length === 0 ? (
            <div className="p-6 text-center">
              <Target className="h-8 w-8 mx-auto text-stone-300 mb-2" />
              <p className="text-xs text-stone-500">No goals yet</p>
              <Link href="/dashboard/goals" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Plus className="h-3 w-3" /> Create goal
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 px-6">
              {goals.slice(0, 3).map((g) => {
                const remaining = Math.max(0, g.targetAmount - g.currentAmount);
                const isCompleted = g.percentage >= 100;
                return (
                  <div key={g.id} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#1C1917] truncate">{g.name}</span>
                      <span className="font-mono text-xs text-stone-500">
                        {formatIDR(g.currentAmount)} / {formatIDR(g.targetAmount)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(g.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                      <span>{g.percentage}% reached</span>
                      <span className={cn(isCompleted ? "text-emerald-600 font-semibold" : "text-stone-500")}>
                        {isCompleted ? "Goal achieved!" : `${formatIDR(remaining)} remaining`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Recurring */}
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2 className="text-base font-semibold text-[#1C1917]">Upcoming Recurring</h2>
            <p className="text-xs text-stone-500 mt-0.5">Next scheduled transactions</p>
          </div>
          <Link href="/dashboard/recurring" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recurring.length === 0 ? (
          <div className="p-6 text-center">
            <RefreshCw className="h-8 w-8 mx-auto text-stone-300 mb-2" />
            <p className="text-xs text-stone-500">No active recurring transactions</p>
            <Link href="/dashboard/recurring" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Plus className="h-3 w-3" /> Set up recurring
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-6 py-4 hover:bg-stone-50/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full flex-shrink-0",
                    r.type === "INCOME" ? "bg-emerald-500" : "bg-rose-500",
                  )} />
                  <div>
                    <p className="text-sm font-medium text-[#1C1917]">{r.description || "Untitled"}</p>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(r.nextRunDate)}</span>
                      <span>•</span>
                      <span>{r.account?.name ?? "Account"}</span>
                    </div>
                  </div>
                </div>
                <span className={cn(
                  "font-mono text-sm font-semibold",
                  r.type === "INCOME" ? "text-emerald-600" : "text-rose-600",
                )}>
                  {r.type === "INCOME" ? "+" : "-"}{formatIDR(r.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
