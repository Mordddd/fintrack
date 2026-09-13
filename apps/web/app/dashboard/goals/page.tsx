"use client";

import { useEffect, useState } from "react";
import {
  getGoals,
  createGoal,
  updateGoal,
  depositGoal,
  deleteGoal,
} from "@/lib/api";
import { formatIDR, formatDate, cn } from "@/lib/utils";
import type { SavingsGoalResponse } from "@fintrack/shared";
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  CheckCircle2,
} from "lucide-react";

const ICONS = [
  { value: "target", label: "Target" },
  { value: "car", label: "Car" },
  { value: "home", label: "Home" },
  { value: "plane", label: "Travel" },
  { value: "graduation-cap", label: "Education" },
  { value: "laptop", label: "Tech" },
  { value: "heart", label: "Health" },
  { value: "gift", label: "Gift" },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDeposit, setShowDeposit] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState<SavingsGoalResponse | null>(null);
  const [saving, setSaving] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [targetAmt, setTargetAmt] = useState("");
  const [initAmt, setInitAmt] = useState("");
  const [deadline, setDeadline] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("target");

  // Deposit form
  const [depositAmt, setDepositAmt] = useState("");
  const [depositMode, setDepositMode] = useState<"deposit" | "withdraw">("deposit");

  async function load() {
    setLoading(true);
    try {
      setGoals(await getGoals());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setName(""); setTargetAmt(""); setInitAmt(""); setDeadline(""); setDesc(""); setIcon("target");
    setShowCreate(true);
  }

  function openEdit(g: SavingsGoalResponse) {
    setName(g.name);
    setTargetAmt(g.targetAmount.toString());
    setDeadline(g.deadline ? g.deadline.split("T")[0] : "");
    setDesc(g.description ?? "");
    setIcon(g.icon ?? "target");
    setShowEdit(g);
  }

  async function handleCreate() {
    const target = parseFloat(targetAmt);
    if (!name.trim() || !target || target <= 0) return;
    setSaving(true);
    try {
      await createGoal({
        name: name.trim(),
        targetAmount: target,
        currentAmount: parseFloat(initAmt) || 0,
        deadline: deadline || undefined,
        description: desc.trim() || undefined,
        icon,
      });
      setShowCreate(false);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!showEdit) return;
    const target = parseFloat(targetAmt);
    if (!name.trim() || !target || target <= 0) return;
    setSaving(true);
    try {
      await updateGoal(showEdit.id, {
        name: name.trim(),
        targetAmount: target,
        deadline: deadline || undefined,
        description: desc.trim() || undefined,
        icon,
      });
      setShowEdit(null);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeposit() {
    if (!showDeposit) return;
    const amt = parseFloat(depositAmt);
    if (!amt || amt <= 0) return;
    setSaving(true);
    try {
      await depositGoal(showDeposit, depositMode === "withdraw" ? -amt : amt);
      setShowDeposit(null);
      setDepositAmt("");
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this savings goal?")) return;
    try {
      await deleteGoal(id);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  function daysLeft(deadline: string | null) {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    return diff;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">Savings Goals</h1>
          <p className="text-sm text-stone-500 mt-1">Track progress toward your financial targets</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Goal
        </button>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-stone-200/60 animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
          <Target className="h-10 w-10 mx-auto text-stone-300 mb-3" />
          <p className="text-sm font-medium text-stone-600">No savings goals yet</p>
          <button onClick={openCreate} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700">
            <Plus className="h-3.5 w-3.5" /> Create your first goal
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const days = daysLeft(g.deadline);
            return (
              <div key={g.id} className="bg-white rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Target className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1C1917]">{g.name}</p>
                      {g.description && <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{g.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="font-mono text-lg font-bold text-[#1C1917]">{formatIDR(g.currentAmount)}</span>
                  <span className="font-mono text-xs text-stone-400">of {formatIDR(g.targetAmount)}</span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", g.isCompleted ? "bg-emerald-500" : "bg-emerald-400")}
                    style={{ width: `${g.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-emerald-600">{g.percentage}%</span>
                  {g.isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Target reached!
                    </span>
                  ) : days !== null ? (
                    <span className={cn("inline-flex items-center gap-1 text-xs", days <= 7 ? "text-rose-500" : days <= 30 ? "text-amber-600" : "text-stone-400")}>
                      <Calendar className="h-3 w-3" />
                      {days > 0 ? `${days}d left` : "Past deadline"}
                    </span>
                  ) : null}
                </div>

                {/* Add Funds button */}
                <button
                  onClick={() => { setShowDeposit(g.id); setDepositAmt(""); setDepositMode("deposit"); }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAFAF9] px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" /> Add Funds
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Goal Modal */}
      {(showCreate || showEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { setShowCreate(false); setShowEdit(null); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-stone-200/60 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1C1917]">{showEdit ? "Edit Goal" : "New Goal"}</h2>
              <button onClick={() => { setShowCreate(false); setShowEdit(null); }} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Goal Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Fund" className="w-full rounded-xl border border-stone-200 bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1.5">Target Amount</label>
                  <input type="number" value={targetAmt} onChange={(e) => setTargetAmt(e.target.value)} placeholder="50000000" min="1" className="w-full rounded-xl border border-stone-200 bg-[#FAFAF9] px-3 py-2.5 text-sm font-mono text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                </div>
                {!showEdit && (
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5">Initial Saved</label>
                    <input type="number" value={initAmt} onChange={(e) => setInitAmt(e.target.value)} placeholder="0" min="0" className="w-full rounded-xl border border-stone-200 bg-[#FAFAF9] px-3 py-2.5 text-sm font-mono text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Deadline (optional)</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full rounded-xl border border-stone-200 bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Description (optional)</label>
                <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What are you saving for?" className="w-full rounded-xl border border-stone-200 bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((ic) => (
                    <button
                      key={ic.value}
                      onClick={() => setIcon(ic.value)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors", icon === ic.value ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-stone-200 text-stone-500 hover:bg-stone-50")}
                    >
                      {ic.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCreate(false); setShowEdit(null); }} className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
              <button onClick={showEdit ? handleEdit : handleCreate} disabled={saving || !name.trim() || !targetAmt || parseFloat(targetAmt) <= 0} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm">
                {saving ? "Saving..." : showEdit ? "Update" : "Create Goal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit/Withdraw Modal */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowDeposit(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-stone-200/60 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1C1917]">Add / Withdraw Funds</h2>
              <button onClick={() => setShowDeposit(null)} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDepositMode("deposit")}
                className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium border transition-colors",
                  depositMode === "deposit" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-stone-200 text-stone-500 hover:bg-stone-50")}
              >
                <ArrowDownToLine className="h-3.5 w-3.5" /> Deposit
              </button>
              <button
                onClick={() => setDepositMode("withdraw")}
                className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium border transition-colors",
                  depositMode === "withdraw" ? "bg-rose-50 border-rose-300 text-rose-700" : "border-stone-200 text-stone-500 hover:bg-stone-50")}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5" /> Withdraw
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Amount</label>
              <input type="number" value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} placeholder="100000" min="1" className="w-full rounded-xl border border-stone-200 bg-[#FAFAF9] px-3 py-2.5 text-sm font-mono text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              {depositAmt && parseFloat(depositAmt) > 0 && (
                <p className="text-xs text-stone-400 mt-1 font-mono">{formatIDR(parseFloat(depositAmt))}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeposit(null)} className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
              <button
                onClick={handleDeposit}
                disabled={saving || !depositAmt || parseFloat(depositAmt) <= 0}
                className={cn("flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 shadow-sm",
                  depositMode === "withdraw" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700")}
              >
                {saving ? "Processing..." : depositMode === "withdraw" ? "Withdraw" : "Deposit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
