"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getAccounts,
  getAccountSummary,
  createAccount,
  updateAccount,
  deleteAccount,
  type CreateAccountInput,
} from "@/lib/api";
import { formatIDR, cn } from "@/lib/utils";
import type { AccountResponse, AccountSummaryResponse } from "@fintrack/shared";
import { AccountType } from "@fintrack/shared";
import {
  Wallet,
  Plus,
  Landmark,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Banknote,
  Pencil,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";

const ACCOUNT_ICONS: Record<string, any> = {
  CASH: Banknote,
  BANK: Landmark,
  E_WALLET: Wallet,
  CREDIT_CARD: CreditCard,
  SAVINGS: PiggyBank,
  INVESTMENT: TrendingUp,
};

const PRESET_COLORS = [
  "#059669", // Emerald
  "#0284C7", // Sky
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#475569", // Slate
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [summary, setSummary] = useState<AccountSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>(AccountType.BANK);
  const [initialBalance, setInitialBalance] = useState<string>("0");
  const [color, setColor] = useState("#059669");

  const loadData = async () => {
    try {
      setLoading(true);
      const [accs, sum] = await Promise.all([getAccounts(), getAccountSummary()]);
      setAccounts(accs);
      setSummary(sum);
    } catch (err: any) {
      console.error("Failed to load accounts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setName("");
    setType(AccountType.BANK);
    setInitialBalance("0");
    setColor("#059669");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: AccountResponse) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setInitialBalance(acc.initialBalance.toString());
    setColor(acc.color || "#059669");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const balanceNum = parseFloat(initialBalance);
    if (!name.trim()) {
      setFormError("Account name is required");
      return;
    }
    if (isNaN(balanceNum) || balanceNum < 0) {
      setFormError("Initial balance must be a valid non-negative number");
      return;
    }

    startTransition(async () => {
      try {
        if (editingAccount) {
          await updateAccount(editingAccount.id, {
            name: name.trim(),
            type,
            initialBalance: balanceNum,
            color,
          });
        } else {
          await createAccount({
            name: name.trim(),
            type,
            initialBalance: balanceNum,
            color,
            icon: type.toLowerCase(),
          });
        }
        setIsModalOpen(false);
        await loadData();
      } catch (err: any) {
        setFormError(err?.message || "Failed to save account");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this account?")) return;
    try {
      await deleteAccount(id);
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete account");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">
            Accounts
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage your bank accounts, wallets, and cash reserves
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Total Active Balance
            </span>
            <div className="mt-2 font-mono text-3xl font-semibold text-[#1C1917]">
              {loading ? "..." : formatIDR(summary?.totalBalance ?? 0)}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-stone-100 font-mono text-xs font-medium text-stone-700">
              {accounts.length} Active {accounts.length === 1 ? "Account" : "Accounts"}
            </span>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-stone-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] animate-pulse space-y-4"
            >
              <div className="h-10 w-10 bg-stone-100 rounded-xl" />
              <div className="h-5 w-32 bg-stone-100 rounded" />
              <div className="h-7 w-40 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-4">
            <Wallet className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-[#1C1917]">No accounts yet</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            Get started by adding your primary bank account, cash wallet, or savings.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-6 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add First Account
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const IconComponent = ACCOUNT_ICONS[acc.type] || Wallet;

            return (
              <div
                key={acc.id}
                className="bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 flex flex-col justify-between transition-all duration-200 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm"
                      style={{ backgroundColor: acc.color || "#059669" }}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide uppercase bg-stone-100 text-stone-600 font-mono">
                      {acc.type.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-[#1C1917] mt-4 line-clamp-1">
                    {acc.name}
                  </h3>
                  <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-[#1C1917]">
                    {formatIDR(acc.currentBalance)}
                  </div>
                  <div className="mt-1 text-xs text-stone-400 font-mono">
                    Initial: {formatIDR(acc.initialBalance)}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    title="Edit account"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Deactivate account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200/80 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="text-lg font-semibold text-[#1C1917]">
                {editingAccount ? "Edit Account" : "Add New Account"}
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

              <div>
                <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCA Primary, Cash Wallet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                  Account Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value={AccountType.BANK}>Bank Account</option>
                  <option value={AccountType.CASH}>Cash</option>
                  <option value={AccountType.E_WALLET}>E-Wallet (GoPay, OVO, etc.)</option>
                  <option value={AccountType.CREDIT_CARD}>Credit Card</option>
                  <option value={AccountType.SAVINGS}>Savings</option>
                  <option value={AccountType.INVESTMENT}>Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                  Initial Balance (IDR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full font-mono bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        "h-7 w-7 rounded-full transition-transform",
                        color === c ? "ring-2 ring-offset-2 ring-emerald-600 scale-110" : "hover:scale-105",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
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
                  {isPending ? "Saving..." : editingAccount ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
