"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getAccounts,
  getCategories,
  exportTransactionsCSV,
  exportTransactionsJSON,
} from "@/lib/api";
import { formatIDR, formatCurrency, formatDate, getSavedCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Modal } from "@/lib/modal";
import type {
  TransactionResponse,
  AccountResponse,
  CategoryResponse,
} from "@fintrack/shared";
import { TransactionType, CategoryType } from "@fintrack/shared";
import {
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Upload,
  Search,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export default function TransactionsPage() {
  const { user } = useAuth();
  const activeCurrency = user?.currency || getSavedCurrency();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter & Form Data
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [exportOpen, setExportOpen] = useState(false);

  // Delete Candidate State
  const [deleteCandidate, setDeleteCandidate] = useState<TransactionResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const loadDependencies = async () => {
    try {
      const [accs, cats] = await Promise.all([getAccounts(), getCategories()]);
      setAccounts(accs);
      setCategories(cats);
      if (accs.length > 0 && !accountId) setAccountId(accs[0].id);
    } catch (err) {
      console.error("Failed to load options", err);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await getTransactions({
        page,
        limit: 15,
        type: selectedType !== "ALL" ? (selectedType as TransactionType) : undefined,
        accountId: selectedAccountId || undefined,
        categoryId: selectedCategoryId || undefined,
        search: debouncedSearch || undefined,
        sortBy: "date",
        sortOrder: "desc",
      });
      const txList = Array.isArray(res) ? res : (res?.data ?? []);
      setTransactions(txList);
      setTotal(res?.total ?? txList.length);
      setTotalPages(res?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [page, selectedType, selectedAccountId, selectedCategoryId, debouncedSearch]);

  // Reload when transaction is created globally via quick-add
  useEffect(() => {
    const handleTxCreated = () => {
      loadTransactions();
    };
    window.addEventListener("fintrack:transaction-created", handleTxCreated);
    return () => window.removeEventListener("fintrack:transaction-created", handleTxCreated);
  }, []);

  const handleOpenAdd = () => {
    setEditingTx(null);
    setTxType(TransactionType.EXPENSE);
    setAccountId(accounts[0]?.id || "");
    const matchingCats = categories.filter((c) => c.type === CategoryType.EXPENSE);
    setCategoryId(matchingCats[0]?.id || categories[0]?.id || "");
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: TransactionResponse) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setAccountId(tx.accountId);
    setCategoryId(tx.categoryId);
    setAmount(tx.amount.toString());
    setDescription(tx.description || "");
    setDate(tx.date ? new Date(tx.date).toISOString().split("T")[0] : "");
    setNotes(tx.notes || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError("Amount must be greater than 0");
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
        const payloadDate = date ? new Date(date).toISOString() : new Date().toISOString();

        if (editingTx) {
          await updateTransaction(editingTx.id, {
            accountId,
            categoryId,
            type: txType,
            amount: amountNum,
            description: description.trim() || undefined,
            date: payloadDate,
            notes: notes.trim() || undefined,
          });
          toast.success("Transaction updated successfully");
        } else {
          await createTransaction({
            accountId,
            categoryId,
            type: txType,
            amount: amountNum,
            description: description.trim() || undefined,
            date: payloadDate,
            notes: notes.trim() || undefined,
          });
          toast.success("Transaction created successfully");
          try {
            localStorage.setItem("fintrack_last_type", txType);
            localStorage.setItem("fintrack_last_account", accountId);
            localStorage.setItem("fintrack_last_category", categoryId);
          } catch {
            // ignore
          }
          window.dispatchEvent(new CustomEvent("fintrack:transaction-created"));
        }
        setIsModalOpen(false);
        await loadTransactions();
      } catch (err: any) {
        const msg = err?.message || "Failed to save transaction";
        setFormError(msg);
        toast.error(msg);
      }
    });
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deleteCandidate.id);
      toast.success("Transaction deleted successfully");
      setDeleteCandidate(null);
      await loadTransactions();
      window.dispatchEvent(new CustomEvent("fintrack:transaction-created"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete transaction");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRepeat = (tx: TransactionResponse) => {
    window.dispatchEvent(
      new CustomEvent("fintrack:quick-add", {
        detail: {
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          categoryId: tx.categoryId,
          accountId: tx.accountId,
        },
      }),
    );
  };

  const isFiltered =
    selectedType !== "ALL" ||
    Boolean(selectedAccountId) ||
    Boolean(selectedCategoryId) ||
    Boolean(search.trim());

  const handleClearFilters = () => {
    setSelectedType("ALL");
    setSelectedAccountId("");
    setSelectedCategoryId("");
    setSearch("");
    setPage(1);
  };

  const filteredCategoriesForForm = categories.filter((c) =>
    txType === TransactionType.INCOME
      ? c.type === CategoryType.INCOME
      : c.type === CategoryType.EXPENSE,
  );

  const handleExport = async (format: "csv" | "json") => {
    setExportOpen(false);
    try {
      const blob = format === "csv"
        ? await exportTransactionsCSV()
        : await exportTransactionsJSON();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fintrack-transactions-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">
            Transactions
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Track and filter every income and expense across your accounts
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 bg-white hover:bg-stone-50 text-[#1C1917] border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 text-stone-400" />
              Export
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-11 w-40 bg-white rounded-xl shadow-xl border border-stone-200/60 overflow-hidden z-50">
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-100"
                >
                  Export JSON
                </button>
              </div>
            )}
          </div>

          <Link
            href="/dashboard/transactions/import"
            className="flex items-center gap-2 bg-white hover:bg-stone-50 text-[#1C1917] border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4 text-stone-400" />
            Import CSV
          </Link>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description or notes..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-8 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Type Toggle Tabs */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl w-full sm:w-auto">
              {["ALL", "INCOME", "EXPENSE"].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedType(t);
                    setPage(1);
                  }}
                  className={cn(
                    "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                    selectedType === t
                      ? "bg-white text-[#1C1917] shadow-sm"
                      : "text-stone-500 hover:text-[#1C1917]",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Dropdowns */}
            <select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value);
                setPage(1);
              }}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none w-full sm:w-auto"
            >
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setPage(1);
              }}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none w-full sm:w-auto"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>

            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors whitespace-nowrap"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-3">
              <ReceiptText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-[#1C1917]">
              {isFiltered ? "No matching transactions" : "No transactions found"}
            </h3>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              {isFiltered
                ? "Try adjusting your search terms or filters to find what you are looking for."
                : "No transactions match your current filters. Add your first income or expense!"}
            </p>
            {isFiltered ? (
              <button
                onClick={handleClearFilters}
                className="mt-5 inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            ) : (
              <button
                onClick={handleOpenAdd}
                className="mt-5 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Transaction
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View (< sm) */}
            <div className="divide-y divide-stone-100 sm:hidden">
              {transactions.map((t) => {
                const isIncome = t.type === TransactionType.INCOME;
                return (
                  <div key={t.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-stone-900 text-sm truncate">
                          {t.description || "Untitled Transaction"}
                        </div>
                        <div className="text-xs text-stone-400 font-mono mt-0.5">
                          {formatDate(t.date)} • {t.account?.name || "No Account"}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "font-mono font-bold text-sm whitespace-nowrap",
                          isIncome ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        {isIncome ? "+" : "-"}
                        {formatIDR(t.amount)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-700">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: t.category?.color || "#059669" }}
                        />
                        {t.category?.name || "Uncategorized"}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRepeat(t)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Repeat transaction"
                          aria-label="Repeat transaction"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          title="Edit"
                          aria-label="Edit transaction"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(t)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50 text-stone-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Description</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Account</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {transactions.map((t) => {
                    const isIncome = t.type === TransactionType.INCOME;

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-stone-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-stone-500 font-mono text-xs">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#1C1917]">
                            {t.description || "Untitled Transaction"}
                          </div>
                          {t.notes && (
                            <div className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                              {t.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: t.category?.color || "#059669" }}
                            />
                            {t.category?.name || "Uncategorized"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-stone-600 font-medium">
                          {t.account?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-semibold">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1",
                              isIncome ? "text-emerald-600" : "text-rose-600",
                            )}
                          >
                            {isIncome ? "+" : "-"}
                            {formatIDR(t.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleRepeat(t)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Repeat transaction"
                              aria-label="Repeat transaction"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(t)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                              title="Edit"
                              aria-label="Edit transaction"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteCandidate(t)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete"
                              aria-label="Delete transaction"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50/50">
            <span className="text-xs text-stone-500 font-mono">
              Page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-[#1C1917]">
            {editingTx ? "Edit Transaction" : "New Transaction"}
          </h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="rounded-lg p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type Segment Control */}
              <div>
                <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType(TransactionType.EXPENSE);
                      const exps = categories.filter((c) => c.type === CategoryType.EXPENSE);
                      if (exps.length > 0) setCategoryId(exps[0].id);
                    }}
                    className={cn(
                      "py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                      txType === TransactionType.EXPENSE
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-stone-600 hover:text-[#1C1917]",
                    )}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType(TransactionType.INCOME);
                      const incs = categories.filter((c) => c.type === CategoryType.INCOME);
                      if (incs.length > 0) setCategoryId(incs[0].id);
                    }}
                    className={cn(
                      "py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                      txType === TransactionType.INCOME
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-stone-600 hover:text-[#1C1917]",
                    )}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Account Dropdown */}
              <div>
                <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                  Account
                </label>
                <select
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="" disabled>
                    Select an account
                  </option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatIDR(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {filteredCategoriesForForm.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                  Amount ({activeCurrency})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full font-mono bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
                {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
                  <p className="mt-1 text-xs text-stone-500 font-mono">
                    ≈ {formatCurrency(Number(amount), activeCurrency)}
                  </p>
                )}
              </div>

              {/* Description & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lunch, Coffee"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional details"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isPending ? "Saving..." : editingTx ? "Save Changes" : "Create Transaction"}
                </button>
              </div>
            </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteCandidate} onClose={() => setDeleteCandidate(null)}>
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-[#1C1917]">Delete Transaction</h2>
          <button
            onClick={() => setDeleteCandidate(null)}
            className="rounded-lg p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="py-4 space-y-3">
          <p className="text-sm text-stone-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-stone-900">
              {deleteCandidate?.description || "this transaction"}
            </span>{" "}
            ({deleteCandidate ? formatIDR(deleteCandidate.amount) : ""})?
          </p>
          <p className="text-xs text-stone-500 bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl text-amber-800">
            Note: The account balance will be automatically adjusted.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={() => setDeleteCandidate(null)}
            className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={confirmDelete}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Transaction"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
