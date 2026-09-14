"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import type { NotificationResponse, PaginatedResponse } from "@fintrack/shared";
import { toast } from "sonner";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ICON_MAP: Record<string, typeof Bell> = {
  BUDGET_WARNING: AlertTriangle,
  BUDGET_EXCEEDED: AlertTriangle,
  GOAL_COMPLETED: CheckCircle,
  RECURRING_PROCESSED: RefreshCw,
};

const COLOR_MAP: Record<string, string> = {
  BUDGET_WARNING: "text-amber-500 bg-amber-50",
  BUDGET_EXCEEDED: "text-rose-500 bg-rose-50",
  GOAL_COMPLETED: "text-emerald-500 bg-emerald-50",
  RECURRING_PROCESSED: "text-blue-500 bg-blue-50",
};

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

export default function NotificationsPage() {
  const [data, setData] = useState<PaginatedResponse<NotificationResponse> | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const query: { page: number; limit: number; isRead?: boolean } = { page, limit: 20 };
      if (filter === "unread") query.isRead = false;
      const res = await getNotifications(query);
      setData(res);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      load();
    } catch {
      toast.error("Failed to mark as read");
    }
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
      toast.success("All marked as read");
      load();
    } catch {
      toast.error("Failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotification(id);
      toast.success("Notification deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">
            Notifications
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Budget alerts, goal milestones, and processed transactions
          </p>
        </div>
        <button
          onClick={handleMarkAll}
          className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-[#1C1917] border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-sm"
        >
          <CheckCheck className="h-4 w-4 text-stone-400" />
          Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              filter === f
                ? "bg-white text-[#1C1917] shadow-sm border border-stone-200/60"
                : "text-stone-500 hover:text-[#1C1917] hover:bg-stone-100",
            )}
          >
            {f === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-10 w-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-stone-600">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {data.data.map((n) => {
              const Icon = ICON_MAP[n.type] ?? Bell;
              const colorClass = COLOR_MAP[n.type] ?? "text-stone-400 bg-stone-100";
              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={cn(
                    "flex items-start gap-4 px-6 py-4 transition-colors cursor-pointer hover:bg-stone-50/70",
                    !n.isRead && "border-l-2 border-l-emerald-500 bg-emerald-50/20",
                  )}
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                      colorClass,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-sm font-medium", !n.isRead ? "text-[#1C1917]" : "text-stone-600")}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-stone-400 ml-2 flex-shrink-0">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-500 flex-shrink-0 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-stone-100">
            <span className="text-xs text-stone-500">
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-500 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-500 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
