"use client";

import { useEffect, useState } from "react";
import {
  getBudgets,
  getBudgetSummary,
  createOrUpdateBudget,
  updateBudget,
  deleteBudget,
  getCategories,
} from "@/lib/api";
import { formatIDR, cn } from "@/lib/utils";
import { Modal } from "@/lib/modal";
import { toast } from "sonner";
import type {
  BudgetResponse,
  BudgetSummaryResponse,
  CategoryResponse,
} from "@fintrack/shared";
import {
  PiggyBank,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [summary, setSummary] = useState<BudgetSummaryResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formLimit, setFormLimit] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([
        getBudgets(month, year),
        getBudgetSummary(month, year),
      ]);
      setBudgets(b);
      setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [month, year]);

  useEffect(() => {
    getCategories("EXPENSE").then(setCategories).catch(console.error);
  }, []);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  }

  function openCreate() {
    setEditId(null);
    setFormCategoryId(categories[0]?.id ?? "");
    setFormLimit("");
    setShowModal(true);
  }

  function openEdit(b: BudgetResponse) {
    setEditId(b.id);
    setFormCategoryId(b.categoryId);
    setFormLimit(b.limitAmount.toString());
    setShowModal(true);
  }

  async function handleSave() {
    const limit = parseFloat(formLimit);
    if (!limit || limit <= 0) return;
    setSaving(true);
    try {
      if (editId) {
        await updateBudget(editId, { limitAmount: limit });
        toast.success("Budget updated successfully");
      } else {
        await createOrUpdateBudget({ categoryId: formCategoryId, month, year, limitAmount: limit });
        toast.success("Budget set successfully");
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save budget");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget?")) return;
    try {
      await deleteBudget(id);
      toast.success("Budget deleted successfully");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete budget");
      console.error(e);
    }
  }

  function statusColor(status: string) {
    if (status === "EXCEEDED") return "bg-rose-500";
    if (status === "WARNING") return "bg-amber-500";
    return "bg-emerald-500";
  }

  function statusLabel(b: BudgetResponse) {
    if (b.status === "EXCEEDED") return `Exceeded by ${formatIDR(b.spent - b.limitAmount)}`;
    if (b.status === "WARNING") return "Near Limit";
    return "On Track";
  }

  function statusBadgeClass(status: string) {
    if (status === "EXCEEDED") return "bg-rose-50 text-rose-700 border-rose-200";
    if (status === "WARNING") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">Budgets</h1>
          <p className="text-sm text-stone-500 mt-1">Track spending limits by category</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white rounded-xl border border-stone-200 shadow-sm px-1">
            <button onClick={prevMonth} className="p-2 hover:bg-stone-50 rounded-lg transition-colors">
              <ChevronLeft className="h-4 w-4 text-stone-500" />
            </button>
            <span className="px-3 py-2 text-sm font-medium text-[#1C1917] min-w-[140px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-stone-50 rounded-lg transition-colors">
              <ChevronRight className="h-4 w-4 text-stone-500" />
            </button>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Set Budget
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Budgeted", value: formatIDR(summary.totalBudgeted), color: "text-[#1C1917]" },
            { label: "Total Spent", value: formatIDR(summary.totalSpent), color: "text-rose-600" },
            { label: "Remaining", value: formatIDR(summary.remaining), color: summary.remaining >= 0 ? "text-emerald-600" : "text-rose-600" },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">{c.label}</span>
              <div className={cn("mt-2 font-mono text-2xl font-bold tracking-tight", c.color)}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Budget Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-stone-200/60 animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
          <PiggyBank className="h-10 w-10 mx-auto text-stone-300 mb-3" />
          <p className="text-sm font-medium text-stone-600">No budgets set for this month</p>
          <button onClick={openCreate} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700">
            <Plus className="h-3.5 w-3.5" /> Set your first budget
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${b.category?.color ?? "#059669"}20` }}>
                    <span className="text-sm" style={{ color: b.category?.color ?? "#059669" }}>●</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1C1917]">{b.category?.name ?? "Category"}</p>
                    <span className={cn("inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full border", statusBadgeClass(b.status))}>
                      {statusLabel(b)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <span className="font-mono text-sm font-semibold text-[#1C1917]">{formatIDR(b.spent)}</span>
                <span className="font-mono text-xs text-stone-400">/ {formatIDR(b.limitAmount)}</span>
              </div>

              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", statusColor(b.status))}
                  style={{ width: `${Math.min(b.percentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs mt-2 font-mono">
                <span className={cn(b.limitAmount - b.spent >= 0 ? "text-stone-600 font-medium" : "text-rose-600 font-semibold")}>
                  {b.limitAmount - b.spent >= 0
                    ? `${formatIDR(b.limitAmount - b.spent)} remaining`
                    : `${formatIDR(Math.abs(b.limitAmount - b.spent))} over limit`}
                </span>
                <span className="text-stone-400">{b.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
          <h2 className="text-lg font-semibold text-[#1C1917]">{editId ? "Edit Budget" : "Set Budget"}</h2>
          <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {!editId && (
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Category (Expense)</label>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Limit Amount</label>
            <input
              type="number"
              value={formLimit}
              onChange={(e) => setFormLimit(e.target.value)}
              placeholder="500000"
              min="1"
              className="w-full rounded-xl border border-stone-200 bg-[#FAFAF9] px-3 py-2.5 text-sm font-mono text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {formLimit && parseFloat(formLimit) > 0 && (
              <p className="text-xs text-stone-400 mt-1 font-mono">{formatIDR(parseFloat(formLimit))}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-stone-100">
          <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !formLimit || parseFloat(formLimit) <= 0} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm">
            {saving ? "Saving..." : editId ? "Update" : "Set Budget"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
