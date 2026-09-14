"use client";

import { useEffect, useState, useCallback } from "react";
import { getActivityLogs } from "@/lib/api";
import { formatIDR, formatDate, cn } from "@/lib/utils";
import type { ActivityLogResponse, PaginatedResponse } from "@fintrack/shared";
import { toast } from "sonner";
import {
  History,
  PlusCircle,
  Pencil,
  Trash2,
  KeyRound,
  ArrowDownToLine,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
} from "lucide-react";

const ENTITY_OPTIONS = [
  { label: "All Entities", value: "" },
  { label: "Transaction", value: "TRANSACTION" },
  { label: "Account", value: "ACCOUNT" },
  { label: "Budget", value: "BUDGET" },
  { label: "Goal", value: "GOAL" },
  { label: "User", value: "USER" },
];

const ACTION_OPTIONS = [
  { label: "All Actions", value: "" },
  { label: "Create", value: "CREATE" },
  { label: "Update", value: "UPDATE" },
  { label: "Delete", value: "DELETE" },
  { label: "Login", value: "LOGIN" },
  { label: "Deposit", value: "DEPOSIT" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getGroupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (itemDate.getTime() === today.getTime()) return "Today";
  if (itemDate.getTime() === yesterday.getTime()) return "Yesterday";
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
    return "Earlier this month";
  }
  return formatDate(dateStr);
}

function getActionDetails(log: ActivityLogResponse) {
  const action = log.action.toUpperCase();
  const meta = log.metadata;

  if (action === "LOGIN") {
    return {
      icon: KeyRound,
      color: "text-amber-600 bg-amber-50 border-amber-200/60",
      label: "Logged into account",
    };
  }

  if (action === "CREATE") {
    let summary = `Created ${log.entityType.toLowerCase()}`;
    if (meta?.description) summary = `Created transaction: ${meta.description}`;
    else if (meta?.name) summary = `Created ${log.entityType.toLowerCase()}: ${meta.name}`;
    return {
      icon: PlusCircle,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200/60",
      label: summary,
    };
  }

  if (action === "UPDATE" || action === "CREATE_OR_UPDATE") {
    let summary = `Updated ${log.entityType.toLowerCase()}`;
    if (meta?.name) summary = `Updated ${log.entityType.toLowerCase()}: ${meta.name}`;
    else if (meta?.description) summary = `Updated transaction: ${meta.description}`;
    else if (meta?.field === "password") summary = "Changed account password";
    return {
      icon: Pencil,
      color: "text-blue-600 bg-blue-50 border-blue-200/60",
      label: summary,
    };
  }

  if (action === "DEPOSIT") {
    const amountStr = meta?.amount ? ` (${formatIDR(meta.amount)})` : "";
    return {
      icon: ArrowDownToLine,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200/60",
      label: `Deposited funds into savings goal${amountStr}`,
    };
  }

  if (action === "DELETE") {
    let summary = `Deleted ${log.entityType.toLowerCase()}`;
    if (meta?.name) summary = `Deleted ${log.entityType.toLowerCase()}: ${meta.name}`;
    else if (meta?.description) summary = `Deleted transaction: ${meta.description}`;
    return {
      icon: Trash2,
      color: "text-rose-600 bg-rose-50 border-rose-200/60",
      label: summary,
    };
  }

  return {
    icon: Activity,
    color: "text-stone-600 bg-stone-50 border-stone-200/60",
    label: `${log.action} ${log.entityType}`,
  };
}

export default function ActivityLogPage() {
  const [data, setData] = useState<PaginatedResponse<ActivityLogResponse>>({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getActivityLogs({
        page,
        limit: 20,
        entityType: entityType || undefined,
        action: action || undefined,
      });
      setData(res);
    } catch {
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [page, entityType, action]);

  useEffect(() => {
    load();
  }, [load]);

  const hasFilters = Boolean(entityType || action);

  const resetFilters = () => {
    setEntityType("");
    setAction("");
    setPage(1);
  };

  // Group logs by timeline label
  const groupedLogs: Record<string, ActivityLogResponse[]> = {};
  for (const item of data.data) {
    const group = getGroupLabel(item.createdAt);
    if (!groupedLogs[group]) groupedLogs[group] = [];
    groupedLogs[group].push(item);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">
          Activity Log
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Audit trail of all actions and security events in your account
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none w-full sm:w-auto"
          >
            {ENTITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none w-full sm:w-auto"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>

        <div className="text-xs text-stone-400 font-mono self-end sm:self-auto">
          {data.total} record{data.total === 1 ? "" : "s"}
        </div>
      </div>

      {/* Timeline Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 p-12 text-center">
          <History className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600">
            No activity records found
          </p>
          <p className="text-xs text-stone-400 mt-1">
            {hasFilters
              ? "Try adjusting your filter settings above"
              : "Actions like transactions, account edits, and logins will appear here"}
          </p>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([groupTitle, logs]) => (
            <div key={groupTitle} className="space-y-3">
              <div className="px-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {groupTitle}
                </span>
              </div>

              <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 divide-y divide-stone-100 overflow-hidden">
                {logs.map((log) => {
                  const details = getActionDetails(log);
                  const Icon = details.icon;
                  const isExpanded = expandedId === log.id;
                  const hasMeta = log.metadata && Object.keys(log.metadata).length > 0;

                  return (
                    <div key={log.id} className="p-4 sm:p-5 hover:bg-stone-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 border mt-0.5",
                              details.color,
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1C1917] truncate">
                              {details.label}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                                {log.entityType}
                              </span>
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100/70 text-stone-500">
                                {log.action}
                              </span>
                              <span className="text-xs text-stone-400">
                                ID: <span className="font-mono">{log.entityId.slice(0, 8)}...</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            title={new Date(log.createdAt).toLocaleString("id-ID")}
                            className="text-xs text-stone-400 font-mono"
                          >
                            {timeAgo(log.createdAt)}
                          </span>

                          {hasMeta && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                              title="Toggle details"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Metadata Accordion */}
                      {hasMeta && isExpanded && (
                        <div className="mt-3.5 pt-3 border-t border-stone-100">
                          <div className="bg-stone-50 rounded-xl p-3 text-xs font-mono text-stone-600 overflow-x-auto">
                            <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2">
              <span className="text-xs text-stone-500 font-mono">
                Page {data.page} of {data.totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-sm"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-sm"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
