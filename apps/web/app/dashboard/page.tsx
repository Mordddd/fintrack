"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/api";
import { formatIDR, formatDate, cn } from "@/lib/utils";
import type { DashboardSummaryResponse } from "@fintrack/shared";
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
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const res = await getDashboardSummary();
        setData(res);
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

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
          <Link
            href="/dashboard/transactions"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Link>
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
            <Link
              href="/dashboard/transactions"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add your first transaction
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {data.recentTransactions.map((tx) => {
              const isIncome = tx.type === TransactionType.INCOME;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-stone-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tx.category?.color || "#059669" }}
                    />
                    <div>
                      <p className="text-sm font-medium text-[#1C1917]">
                        {tx.description || "Untitled Transaction"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span>{tx.category?.name || "General"}</span>
                        <span>•</span>
                        <span>{tx.account?.name || "Account"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
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
    </div>
  );
}
