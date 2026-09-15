"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getTransfers,
  createTransfer,
  deleteTransfer,
  getAccounts,
} from "@/lib/api";
import { formatIDR, formatDate, getSavedCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Modal } from "@/lib/modal";
import type { TransferResponse, AccountResponse } from "@fintrack/shared";
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  X,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function TransfersPage() {
  const { user } = useAuth();
  const activeCurrency = user?.currency || getSavedCurrency();
  const [transfers, setTransfers] = useState<TransferResponse[]>([]);
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form Fields
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [trfs, accs] = await Promise.all([getTransfers(), getAccounts()]);
      setTransfers(trfs);
      setAccounts(accs);
    } catch (err) {
      console.error("Failed to load transfers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    if (accounts.length < 2) {
      alert("You need at least 2 accounts to make a transfer.");
      return;
    }
    setFromAccountId(accounts[0]?.id || "");
    setToAccountId(accounts[1]?.id || "");
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fromAccountId || !toAccountId) {
      setFormError("Please select both source and destination accounts");
      return;
    }
    if (fromAccountId === toAccountId) {
      setFormError("Source and destination accounts must be different");
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError("Amount must be greater than 0");
      return;
    }

    startTransition(async () => {
      try {
        const payloadDate = date ? new Date(date).toISOString() : new Date().toISOString();
        await createTransfer({
          fromAccountId,
          toAccountId,
          amount: amountNum,
          description: description.trim() || undefined,
          date: payloadDate,
        });
        setIsModalOpen(false);
        await loadData();
      } catch (err: any) {
        setFormError(err?.message || "Failed to execute transfer");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this transfer? Saldo kedua akun akan dikembalikan.",
      )
    )
      return;

    try {
      await deleteTransfer(id);
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete transfer");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & New Transfer Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">
            Transfers
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Move money between your accounts seamlessly
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New Transfer
        </button>
      </div>

      {/* Transfer List Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : transfers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-3">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-[#1C1917]">
              No transfers yet
            </h3>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              Transfer funds between your bank, cash, and e-wallets to keep balances accurate.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-5 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Make First Transfer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50 text-stone-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Route</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transfers.map((tr) => (
                  <tr
                    key={tr.id}
                    className="hover:bg-stone-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-stone-500 font-mono text-xs">
                      {formatDate(tr.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 font-medium text-[#1C1917]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-xs text-stone-700">
                          {tr.fromAccount?.name || "Source"}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-xs text-stone-700">
                          {tr.toAccount?.name || "Destination"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {tr.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-semibold text-[#1C1917]">
                      {formatIDR(tr.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(tr.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-80 group-hover:opacity-100"
                        title="Delete transfer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transfer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-[#1C1917]">
            Transfer Between Accounts
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

          {/* From Account */}
          <div>
            <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
              From Account (Source)
            </label>
            <select
              required
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatIDR(acc.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          {/* To Account */}
          <div>
            <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
              To Account (Destination)
            </label>
            <select
              required
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatIDR(acc.currentBalance)})
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
              placeholder="e.g. 250000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full font-mono bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Description & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g. Savings deposit"
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
              {isPending ? "Transferring..." : "Complete Transfer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
