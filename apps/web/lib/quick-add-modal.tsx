"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { Modal } from "@/lib/modal";
import {
  getAccounts,
  getCategories,
  createTransaction,
} from "@/lib/api";
import { formatCurrency, getSavedCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import type {
  AccountResponse,
  CategoryResponse,
} from "@fintrack/shared";
import { TransactionType, CategoryType } from "@fintrack/shared";
import { X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export interface QuickAddInitialData {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  amount?: number | string;
  description?: string;
  notes?: string;
  date?: string;
}

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: QuickAddInitialData | null;
  onSuccess?: () => void;
}

export function QuickAddModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: QuickAddModalProps) {
  const { user } = useAuth();
  const activeCurrency = user?.currency || getSavedCurrency();

  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Load accounts and categories when opened
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setLoadingOptions(true);
      try {
        const [accs, cats] = await Promise.all([getAccounts(), getCategories()]);
        if (cancelled) return;
        setAccounts(accs);
        setCategories(cats);

        // Smart defaults
        const defaultType =
          initialData?.type ||
          (localStorage.getItem("fintrack_last_type") as TransactionType) ||
          TransactionType.EXPENSE;
        setTxType(defaultType);

        const lastAcc = localStorage.getItem("fintrack_last_account");
        const matchedAcc = accs.find((a) => a.id === (initialData?.accountId || lastAcc));
        setAccountId(matchedAcc?.id || accs[0]?.id || "");

        const matchingCats = cats.filter((c) =>
          defaultType === TransactionType.INCOME
            ? c.type === CategoryType.INCOME
            : c.type === CategoryType.EXPENSE
        );
        const lastCat = localStorage.getItem("fintrack_last_category");
        const matchedCat = matchingCats.find(
          (c) => c.id === (initialData?.categoryId || lastCat)
        );
        setCategoryId(matchedCat?.id || matchingCats[0]?.id || cats[0]?.id || "");

        setAmount(initialData?.amount ? String(initialData.amount) : "");
        setDescription(initialData?.description || "");
        setDate(initialData?.date || new Date().toISOString().split("T")[0]);
        setNotes(initialData?.notes || "");
        setShowOptional(Boolean(initialData?.notes));
        setFormError(null);
      } catch (err) {
        console.error("Failed to load options for quick add", err);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, initialData]);

  // Autofocus amount on modal open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Switch category list when type changes
  const handleTypeChange = (newType: TransactionType) => {
    setTxType(newType);
    const filtered = categories.filter((c) =>
      newType === TransactionType.INCOME
        ? c.type === CategoryType.INCOME
        : c.type === CategoryType.EXPENSE
    );
    if (filtered.length > 0) {
      setCategoryId(filtered[0].id);
    }
  };

  const filteredCategories = categories.filter((c) =>
    txType === TransactionType.INCOME
      ? c.type === CategoryType.INCOME
      : c.type === CategoryType.EXPENSE
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Amount must be greater than 0");
      amountInputRef.current?.focus();
      return;
    }
    if (!accountId) {
      setFormError("Please select an account");
      return;
    }
    if (!categoryId) {
      setFormError("Please select a category");
      return;
    }

    startTransition(async () => {
      try {
        const payloadDate = date
          ? new Date(date).toISOString()
          : new Date().toISOString();

        await createTransaction({
          accountId,
          categoryId,
          type: txType,
          amount: numAmount,
          description: description.trim() || undefined,
          date: payloadDate,
          notes: notes.trim() || undefined,
        });

        // ponytail: persists smart defaults in localStorage; upgrade to server user preferences if synced across devices is requested.
        try {
          localStorage.setItem("fintrack_last_type", txType);
          localStorage.setItem("fintrack_last_account", accountId);
          localStorage.setItem("fintrack_last_category", categoryId);
        } catch {
          // ignore
        }

        toast.success(
          txType === TransactionType.INCOME
            ? "✓ Income added"
            : "✓ Expense added"
        );

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("fintrack:transaction-created"));
        }

        onSuccess?.();
        onClose();
      } catch (err: any) {
        setFormError(err?.message || "Failed to save transaction");
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div>
          <h2 className="text-base font-semibold text-[#1C1917]">
            {initialData?.description ? `Repeat: ${initialData.description}` : "Quick Add Transaction"}
          </h2>
          <p className="text-xs text-stone-500">Record a new income or expense</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Type Toggle: Expense / Income */}
        <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange(TransactionType.EXPENSE)}
            className={cn(
              "py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
              txType === TransactionType.EXPENSE
                ? "bg-rose-600 text-white shadow-sm"
                : "text-stone-600 hover:text-[#1C1917]"
            )}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange(TransactionType.INCOME)}
            className={cn(
              "py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
              txType === TransactionType.INCOME
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-stone-600 hover:text-[#1C1917]"
            )}
          >
            Income
          </button>
        </div>

        {/* Amount Input with Live Formatted Currency Preview */}
        <div>
          <label
            htmlFor="quick-add-amount"
            className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5"
          >
            Amount ({activeCurrency}) *
          </label>
          <input
            id="quick-add-amount"
            ref={amountInputRef}
            type="number"
            min="0.01"
            step="any"
            required
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full font-mono bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-base font-semibold text-[#1C1917] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
            <div className="mt-1 text-xs font-mono font-medium text-emerald-600">
              ≈ {formatCurrency(parseFloat(amount), activeCurrency)}
            </div>
          )}
        </div>

        {/* Category & Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="quick-add-category"
              className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5"
            >
              Category *
            </label>
            <select
              id="quick-add-category"
              required
              disabled={loadingOptions || filteredCategories.length === 0}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-[#1C1917] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="quick-add-account"
              className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5"
            >
              Account *
            </label>
            <select
              id="quick-add-account"
              required
              disabled={loadingOptions || accounts.length === 0}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-[#1C1917] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.currentBalance, activeCurrency)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="quick-add-desc"
            className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5"
          >
            Description
          </label>
          <input
            id="quick-add-desc"
            type="text"
            placeholder="e.g. Lunch, Coffee, Groceries"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-[#1C1917] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
        </div>

        {/* Optional Collapsible Details */}
        {!showOptional ? (
          <button
            type="button"
            onClick={() => setShowOptional(true)}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            + Add date or notes
          </button>
        ) : (
          <div className="space-y-3 pt-1 border-t border-stone-100 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="quick-add-date"
                  className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  Date
                </label>
                <input
                  id="quick-add-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-[#1C1917] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="quick-add-notes"
                  className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  Notes
                </label>
                <input
                  id="quick-add-notes"
                  type="text"
                  placeholder="Optional details"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-[#1C1917] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5",
              txType === TransactionType.EXPENSE
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {isPending
              ? "Saving..."
              : txType === TransactionType.EXPENSE
              ? "Add Expense"
              : "Add Income"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
