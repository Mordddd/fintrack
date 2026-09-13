"use client";

import { useEffect, useState } from "react";
import {
  getCashFlow,
  getCategoryBreakdown,
  getFinancialOverview,
} from "@/lib/api";
import { formatIDR, cn } from "@/lib/utils";
import type {
  CashFlowPoint,
  CategoryBreakdownItem,
  FinancialOverviewResponse,
} from "@fintrack/shared";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  BarChart3,
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

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<FinancialOverviewResponse | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowPoint[]>([]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [o, cf, cb] = await Promise.all([
          getFinancialOverview(),
          getCashFlow(months),
          getCategoryBreakdown(),
        ]);
        setOverview(o);
        setCashFlow(cf);
        setBreakdown(cb);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [months]);

  const metricCards = overview
    ? [
        { label: "YTD Income", value: formatIDR(overview.ytdIncome), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "YTD Expenses", value: formatIDR(overview.ytdExpense), icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-50" },
        { label: "Net Cash Flow", value: formatIDR(overview.ytdNet), icon: DollarSign, color: overview.ytdNet >= 0 ? "text-emerald-600" : "text-rose-600", bg: overview.ytdNet >= 0 ? "bg-emerald-50" : "bg-rose-50" },
        { label: "Savings Rate", value: `${overview.savingsRate}%`, icon: Percent, color: overview.savingsRate >= 20 ? "text-emerald-600" : overview.savingsRate >= 0 ? "text-amber-600" : "text-rose-600", bg: overview.savingsRate >= 20 ? "bg-emerald-50" : overview.savingsRate >= 0 ? "bg-amber-50" : "bg-rose-50" },
      ]
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
        <p className="text-xs font-medium text-stone-500 mb-1.5">{label}</p>
        {payload.map((p: { name: string; value: number; color: string }) => (
          <p key={p.name} className="text-xs font-mono" style={{ color: p.color }}>
            {p.name}: {formatIDR(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">Analytics</h1>
        <p className="text-sm text-stone-500 mt-1">Your financial health at a glance</p>
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-stone-200/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="bg-white rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">{c.label}</span>
                  <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", c.bg, c.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className={cn("mt-2 font-mono text-xl font-bold tracking-tight", c.color)}>{c.value}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cash Flow Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-[#1C1917]">Cash Flow Trend</h2>
            <p className="text-xs text-stone-500 mt-0.5">Income vs Expenses over time</p>
          </div>
          <div className="flex gap-1 bg-stone-100 rounded-lg p-0.5">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  months === m ? "bg-white text-[#1C1917] shadow-sm" : "text-stone-500 hover:text-stone-700")}
              >
                {m}M
              </button>
            ))}
          </div>
        </div>

        {mounted && cashFlow.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#78716C" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#78716C" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : !loading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto text-stone-300 mb-2" />
              <p className="text-sm text-stone-500">No transaction data yet</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-[#1C1917]">Spending by Category</h2>
          <p className="text-xs text-stone-500 mt-0.5">This month&apos;s expense distribution</p>
        </div>

        {mounted && breakdown.length > 0 ? (
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="amount"
                    nameKey="categoryName"
                    paddingAngle={2}
                  >
                    {breakdown.map((item) => (
                      <Cell key={item.categoryId} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatIDR(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2">
              <div className="space-y-2.5">
                {breakdown.map((item) => (
                  <div key={item.categoryId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-[#1C1917]">{item.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-[#1C1917]">{formatIDR(item.amount)}</span>
                      <span className="font-mono text-xs text-stone-400 w-10 text-right">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !loading ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-stone-500">No expense data this month</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
