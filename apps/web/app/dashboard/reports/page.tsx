"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  ReceiptText,
  Building,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatIDR, cn } from "@/lib/utils";
import { getFinancialReports } from "@/lib/api";
import type { FinancialReportResponse } from "@fintrack/shared";

const PERIOD_OPTIONS = [
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "Last 3 Months", value: "last_3_months" },
  { label: "Last 6 Months", value: "last_6_months" },
  { label: "This Year", value: "this_year" },
  { label: "Custom Range", value: "custom" },
];

const PIE_COLORS = [
  "#059669",
  "#2563EB",
  "#D97706",
  "#7C3AED",
  "#DB2777",
  "#0891B2",
  "#4F46E5",
  "#DC2626",
  "#65A30D",
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<FinancialReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [period]);

  async function loadReport() {
    setLoading(true);
    try {
      const params: { period?: string; startDate?: string; endDate?: string } = {
        period,
      };
      if (period === "custom" && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const data = await getFinancialReports(params);
      setReport(data);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  }

  function handleCustomFilter(e: React.FormEvent) {
    e.preventDefault();
    if (startDate && endDate) {
      loadReport();
    }
  }

  function handleExportCsv() {
    if (!report) return;

    const rows: string[][] = [
      ["FINANCIAL REPORT", `Period: ${report.period}`, `Generated: ${new Date().toISOString()}`],
      ["Date Range", `${report.startDate.split("T")[0]} to ${report.endDate.split("T")[0]}`],
      [],
      ["EXECUTIVE SUMMARY"],
      ["Total Income", report.summary.totalIncome.toString()],
      ["Total Expense", report.summary.totalExpense.toString()],
      ["Net Savings", report.summary.netSavings.toString()],
      ["Savings Rate (%)", `${report.summary.savingsRate}%`],
      ["Total Transactions", report.summary.totalTransactions.toString()],
      ["Avg Daily Expense", report.summary.avgDailyExpense.toString()],
      ["Avg Monthly Expense", report.summary.avgMonthlyExpense.toString()],
      [],
      ["CATEGORY BREAKDOWN"],
      ["Category", "Type", "Amount", "Percentage", "Transactions"],
      ...report.categories.map((c) => [
        c.categoryName,
        c.type,
        c.amount.toString(),
        `${c.percentage}%`,
        c.transactionCount.toString(),
      ]),
      [],
      ["ACCOUNT SUMMARY"],
      ["Account", "Type", "Income", "Expense", "Net Change"],
      ...report.accounts.map((a) => [
        a.accountName,
        a.type,
        a.income.toString(),
        a.expense.toString(),
        a.net.toString(),
      ]),
      [],
      ["CASH FLOW TREND"],
      ["Period", "Income", "Expense", "Net"],
      ...report.cashFlow.map((cf) => [
        cf.period,
        cf.income.toString(),
        cf.expense.toString(),
        cf.net.toString(),
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows
        .map((r) =>
          r
            .map((field) =>
              field.includes(",") ? `"${field.replace(/"/g, '""')}"` : field,
            )
            .join(","),
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fintrack-report-${report.period}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrint() {
    window.print();
  }

  const summary = report?.summary;

  return (
    <div className="space-y-6 animate-fade-in w-full min-w-0">
      {/* Header and Print/Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">
            Financial Reports
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Comprehensive financial performance, cash flow trends, and budget analysis.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleExportCsv}
            disabled={!report || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 hover:bg-stone-50 shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-stone-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={!report || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Hidden when printing) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200/70 shadow-sm print:hidden">
        {/* Period Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors",
                period === opt.value
                  ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60"
                  : "text-stone-600 hover:bg-stone-100/70",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom Range Picker */}
        {period === "custom" && (
          <form
            onSubmit={handleCustomFilter}
            className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap"
          >
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700 outline-none"
              required
            />
            <span className="text-xs text-stone-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700 outline-none"
              required
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* Print-only Report Header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-black">FinTrack — Financial Statement</h2>
        <p className="text-sm text-stone-600">
          Report Period: {report ? `${report.startDate.split("T")[0]} to ${report.endDate.split("T")[0]}` : ""}
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-stone-200/60 animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-2xl border border-stone-200/60 animate-pulse" />
        </div>
      ) : !report ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/60">
          <FileSpreadsheet className="h-10 w-10 text-stone-300 mx-auto mb-2" />
          <p className="text-sm text-stone-500">No report data found for this period.</p>
        </div>
      ) : (
        <>
          {/* Executive Summary Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Income */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Total Income
                </span>
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 font-mono text-xl sm:text-2xl font-bold tracking-tight text-emerald-600">
                {formatIDR(summary?.totalIncome ?? 0)}
              </p>
              <div className="mt-2 flex items-center text-[11px] text-stone-400">
                <span>Verified cash inflows</span>
              </div>
            </div>

            {/* Total Expense */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Total Expenses
                </span>
                <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 font-mono text-xl sm:text-2xl font-bold tracking-tight text-rose-600">
                {formatIDR(summary?.totalExpense ?? 0)}
              </p>
              <div className="mt-2 flex items-center text-[11px] text-stone-400">
                <span>Avg {formatIDR(summary?.avgDailyExpense ?? 0)} / day</span>
              </div>
            </div>

            {/* Net Savings */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Net Savings
                </span>
                <div
                  className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center",
                    (summary?.netSavings ?? 0) >= 0
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600",
                  )}
                >
                  <PiggyBank className="h-4 w-4" />
                </div>
              </div>
              <p
                className={cn(
                  "mt-2 font-mono text-xl sm:text-2xl font-bold tracking-tight",
                  (summary?.netSavings ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {formatIDR(summary?.netSavings ?? 0)}
              </p>
              <div className="mt-2 flex items-center text-[11px] text-stone-400">
                <span>Net bottom-line savings</span>
              </div>
            </div>

            {/* Savings Rate */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Savings Rate
                </span>
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 font-mono text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
                {summary?.savingsRate ?? 0}%
              </p>
              <div className="mt-2 flex items-center text-[11px] text-stone-400">
                <span>{summary?.totalTransactions ?? 0} total transactions</span>
              </div>
            </div>
          </div>

          {/* Transfer Notice (Financial Integrity Rule) */}
          <div className="rounded-xl bg-stone-100/70 border border-stone-200/60 px-4 py-2.5 flex items-center gap-2 text-xs text-stone-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Financial Integrity Guaranteed:</strong> Internal transfers between your
              accounts are strictly excluded from income and expenses to avoid inflating savings.
            </span>
          </div>

          {/* Charts Section (Cash Flow & Category Breakdown) */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cash Flow Trend (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-stone-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] min-w-0">
              <h2 className="text-sm font-semibold text-[#1C1917] mb-4">
                Cash Flow Trend (Income vs Expenses)
              </h2>
              {report.cashFlow.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-stone-400">
                  No trend data available for this range
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.cashFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#78716C" }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#78716C" }}
                        tickFormatter={(v) => `${v / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: "12px",
                          border: "1px solid #E7E5E4",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          fontSize: "12px",
                        }}
                        formatter={(val: number) => [formatIDR(val), ""]}
                      />
                      <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Expense Distribution Donut (1 col) */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] min-w-0">
              <h2 className="text-sm font-semibold text-[#1C1917] mb-4">
                Expense Distribution
              </h2>
              {report.categories.filter((c) => c.type === "EXPENSE").length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-stone-400">
                  No expense categories recorded
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.categories.filter((c) => c.type === "EXPENSE")}
                        dataKey="amount"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {report.categories
                          .filter((c) => c.type === "EXPENSE")
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [formatIDR(val), "Amount"]}
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: "12px",
                          border: "1px solid #E7E5E4",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Top Spending Categories Table */}
          <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden min-w-0">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1C1917]">
                Spending by Category
              </h2>
              <span className="text-xs text-stone-400">
                {report.categories.length} categories active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/60 text-stone-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 text-right">Transactions</th>
                    <th className="px-5 py-3 text-right">% of Total</th>
                    <th className="px-5 py-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {report.categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-stone-400">
                        No category records found for this period.
                      </td>
                    </tr>
                  ) : (
                    report.categories.map((cat) => (
                      <tr key={cat.categoryId} className="hover:bg-stone-50/70 transition-colors">
                        <td className="px-5 py-3 font-medium text-stone-800 flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span>{cat.categoryName}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                              cat.type === "INCOME"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-stone-100 text-stone-600",
                            )}
                          >
                            {cat.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-stone-600">
                          {cat.transactionCount}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-stone-600">
                          {cat.percentage}%
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3 text-right font-mono font-semibold",
                            cat.type === "INCOME" ? "text-emerald-600" : "text-[#1C1917]",
                          )}
                        >
                          {formatIDR(cat.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Account Breakdown & Budget Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Account Breakdown */}
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden min-w-0">
              <div className="px-5 py-4 border-b border-stone-100">
                <h2 className="text-sm font-semibold text-[#1C1917]">
                  Account Activity Breakdown
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/60 text-stone-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-5 py-3">Account</th>
                      <th className="px-5 py-3 text-right">Income</th>
                      <th className="px-5 py-3 text-right">Expenses</th>
                      <th className="px-5 py-3 text-right">Net Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {report.accounts.map((acc) => (
                      <tr key={acc.accountId} className="hover:bg-stone-50/70 transition-colors">
                        <td className="px-5 py-3 font-medium text-stone-800">
                          {acc.accountName}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-emerald-600">
                          {formatIDR(acc.income)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-rose-600">
                          {formatIDR(acc.expense)}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3 text-right font-mono font-semibold",
                            acc.net >= 0 ? "text-emerald-600" : "text-rose-600",
                          )}
                        >
                          {acc.net >= 0 ? "+" : ""}
                          {formatIDR(acc.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Budget Performance Comparison */}
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 min-w-0">
              <h2 className="text-sm font-semibold text-[#1C1917] mb-4">
                Budget Adherence Performance
              </h2>
              {report.budgetPerformance.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-stone-400 text-center">
                  No budgets configured for this date range.
                </div>
              ) : (
                <div className="space-y-4">
                  {report.budgetPerformance.map((b) => (
                    <div key={b.categoryId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-800">
                          {b.categoryName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-stone-500">
                            {formatIDR(b.actualSpent)} / {formatIDR(b.budgeted)}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              b.status === "ON_TRACK" && "bg-emerald-100 text-emerald-700",
                              b.status === "WARNING" && "bg-amber-100 text-amber-700",
                              b.status === "EXCEEDED" && "bg-rose-100 text-rose-700",
                            )}
                          >
                            {b.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            b.status === "ON_TRACK" && "bg-emerald-500",
                            b.status === "WARNING" && "bg-amber-500",
                            b.status === "EXCEEDED" && "bg-rose-500",
                          )}
                          style={{ width: `${Math.min(100, b.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
