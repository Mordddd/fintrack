"use client";

import { useEffect, useState } from "react";
import {
  getRecurringTransactions,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  pauseRecurring,
  resumeRecurring,
  processRecurring,
  getAccounts,
  getCategories,
} from "@/lib/api";
import type { CreateRecurringInput, UpdateRecurringInput } from "@/lib/api";
import { formatIDR, formatDate, cn } from "@/lib/utils";
import type {
  RecurringTransactionResponse,
  AccountResponse,
  CategoryResponse,
} from "@fintrack/shared";
import { TransactionType, Frequency } from "@fintrack/shared";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Pause,
  Play,
  X,
  Calendar,
  Zap,
} from "lucide-react";

const FREQ_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringTransactionResponse[]>([]);
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form state
  const [formType, setFormType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFrequency, setFormFrequency] = useState<string>("MONTHLY");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formNoEndDate, setFormNoEndDate] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [r, a, c] = await Promise.all([
        getRecurringTransactions(),
        getAccounts(),
        getCategories(),
      ]);
      setItems(r);
      setAccounts(a);
      setCategories(c);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditId(null);
    setFormType("EXPENSE");
    setFormAccountId(accounts[0]?.id ?? "");
    setFormCategoryId("");
    setFormAmount("");
    setFormDescription("");
    setFormFrequency("MONTHLY");
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate("");
    setFormNoEndDate(true);
    setModalOpen(true);
  }

  function openEdit(item: RecurringTransactionResponse) {
    setEditId(item.id);
    setFormType(item.type as "INCOME" | "EXPENSE");
    setFormAccountId(item.accountId);
    setFormCategoryId(item.categoryId);
    setFormAmount(String(item.amount));
    setFormDescription(item.description ?? "");
    setFormFrequency(item.frequency);
    setFormStartDate(item.startDate.slice(0, 10));
    setFormEndDate(item.endDate?.slice(0, 10) ?? "");
    setFormNoEndDate(!item.endDate);
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!formAccountId || !formCategoryId || !formAmount) return;
    setSaving(true);
    try {
      if (editId) {
        const dto: UpdateRecurringInput = {
          amount: parseFloat(formAmount),
          description: formDescription || undefined,
          frequency: formFrequency as typeof Frequency[keyof typeof Frequency],
          endDate: formNoEndDate ? undefined : formEndDate || undefined,
        };
        await updateRecurring(editId, dto);
        toast.success("Recurring transaction updated");
      } else {
        const dto: CreateRecurringInput = {
          accountId: formAccountId,
          categoryId: formCategoryId,
          type: formType as typeof TransactionType[keyof typeof TransactionType],
          amount: parseFloat(formAmount),
          description: formDescription || undefined,
          frequency: formFrequency as typeof Frequency[keyof typeof Frequency],
          startDate: formStartDate,
          endDate: formNoEndDate ? undefined : formEndDate || undefined,
        };
        await createRecurring(dto);
        toast.success("Recurring transaction created");
      }
      setModalOpen(false);
      load();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this recurring transaction?")) return;
    try {
      await deleteRecurring(id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function handleToggle(item: RecurringTransactionResponse) {
    try {
      if (item.isActive) {
        await pauseRecurring(item.id);
        toast.success("Paused");
      } else {
        await resumeRecurring(item.id);
        toast.success("Resumed");
      }
      load();
    } catch {
      toast.error("Failed to toggle");
    }
  }

  async function handleProcess() {
    setProcessing(true);
    try {
      const result = await processRecurring();
      toast.success(`Processed ${result.processed} transaction(s)`);
      load();
    } catch {
      toast.error("Processing failed");
    } finally {
      setProcessing(false);
    }
  }

  const filteredCategories = categories.filter(
    (c) => c.type === formType,
  );

  const isOverdue = (d: string) => new Date(d) < new Date(new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">
            Recurring Transactions
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Automated repeating income and expenses
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleProcess}
            disabled={processing}
            className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-[#1C1917] border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            {processing ? "Processing..." : "Process Due"}
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Recurring
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 p-12 text-center">
          <RefreshCw className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">
            No recurring transactions yet
          </p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Create your first recurring transaction
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const isIncome = item.type === "INCOME";
            const overdue = item.isActive && isOverdue(item.nextRunDate);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        isIncome
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600",
                      )}
                    >
                      {item.type}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                      {FREQ_LABELS[item.frequency] ?? item.frequency}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        item.isActive ? "bg-emerald-500" : "bg-stone-300",
                      )}
                    />
                    <span className="text-[10px] font-medium text-stone-400">
                      {item.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-medium text-[#1C1917] truncate">
                  {item.description || "Untitled"}
                </p>
                <p
                  className={cn(
                    "font-mono text-lg font-bold mt-1",
                    isIncome ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {isIncome ? "+" : "-"}
                  {formatIDR(item.amount)}
                </p>

                <div className="mt-3 flex items-center gap-3 text-xs text-stone-500">
                  <span>{item.account?.name ?? "Account"}</span>
                  <span>•</span>
                  <span>{item.category?.name ?? "Category"}</span>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3 w-3 text-stone-400" />
                  <span className="text-stone-500">Next: {formatDate(item.nextRunDate)}</span>
                  {overdue && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 ml-1">
                      Overdue
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-3">
                  <button
                    onClick={() => handleToggle(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-[#1C1917] transition-colors"
                  >
                    {item.isActive ? (
                      <>
                        <Pause className="h-3.5 w-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" /> Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-[#1C1917] transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-rose-600 transition-colors ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
              <h2 className="text-base font-semibold text-[#1C1917]">
                {editId ? "Edit Recurring" : "New Recurring Transaction"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type Toggle */}
              <div className="flex gap-2">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setFormType(t);
                      setFormCategoryId("");
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-medium transition-colors",
                      formType === t
                        ? t === "INCOME"
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200",
                    )}
                  >
                    {t === "INCOME" ? "Income" : "Expense"}
                  </button>
                ))}
              </div>

              {/* Account */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">
                  Account
                </label>
                <select
                  value={formAccountId}
                  onChange={(e) => setFormAccountId(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">
                  Category
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Select category</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">
                  Amount (IDR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Monthly rent"
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">
                  Frequency
                </label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {Object.entries(FREQ_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-1.5">
                  <input
                    type="checkbox"
                    checked={formNoEndDate}
                    onChange={(e) => setFormNoEndDate(e.target.checked)}
                    className="rounded border-stone-300"
                  />
                  No end date
                </label>
                {!formNoEndDate && (
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !formAccountId || !formCategoryId || !formAmount}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
