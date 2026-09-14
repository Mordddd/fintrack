"use client";

import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ReceiptText,
  LogOut,
  Menu,
  X,
  PiggyBank,
  Target,
  BarChart3,
  RefreshCw,
  Bell,
  AlertTriangle,
  CheckCircle,
  History,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUnreadCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api";
import type { NotificationResponse } from "@fintrack/shared";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Accounts", href: "/dashboard/accounts", icon: Wallet },
  { label: "Transactions", href: "/dashboard/transactions", icon: ReceiptText },
  { label: "Transfers", href: "/dashboard/transfers", icon: ArrowLeftRight },
  { label: "Recurring", href: "/dashboard/recurring", icon: RefreshCw },
  { label: "Budgets", href: "/dashboard/budgets", icon: PiggyBank },
  { label: "Goals", href: "/dashboard/goals", icon: Target },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Activity", href: "/dashboard/activity", icon: History },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const NOTIF_ICON_MAP: Record<string, typeof Bell> = {
  BUDGET_WARNING: AlertTriangle,
  BUDGET_EXCEEDED: AlertTriangle,
  GOAL_COMPLETED: CheckCircle,
  RECURRING_PROCESSED: RefreshCw,
};

const NOTIF_COLOR_MAP: Record<string, string> = {
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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification state
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<NotificationResponse[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Poll unread count
  const fetchUnread = useCallback(async () => {
    try {
      const c = await getUnreadCount();
      setUnread(c);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchUnread();
    const iv = setInterval(fetchUnread, 30000);
    const onFocus = () => fetchUnread();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, fetchUnread]);

  // Load recent notifications when bell opens
  useEffect(() => {
    if (!bellOpen) return;
    let cancelled = false;
    (async () => {
      setNotifLoading(true);
      try {
        const res = await getNotifications({ limit: 8 });
        if (!cancelled) setNotifItems(res.data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setNotifLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bellOpen]);

  // Close bell dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return;
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [bellOpen]);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnread((p) => Math.max(0, p - 1));
    } catch {
      // ignore
    }
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
      setNotifItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF9]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-[#FAFAF9] text-[#1C1917]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#FAFAF9]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 font-semibold tracking-tight text-[#1C1917]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <span className="font-mono text-base font-bold">F</span>
              </div>
              <span className="text-lg">FinTrack</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-white text-emerald-700 shadow-sm border border-stone-200/60 font-semibold"
                        : "text-stone-600 hover:text-[#1C1917] hover:bg-stone-100/60",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-emerald-600" : "text-stone-400",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-[#1C1917] hover:border-stone-300 transition-colors shadow-sm"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>

              {/* Dropdown Panel */}
              {bellOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200/60 overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                    <span className="text-sm font-semibold text-[#1C1917]">Notifications</span>
                    <button
                      onClick={handleMarkAll}
                      className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="p-4 space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-12 bg-stone-100 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : notifItems.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                        <p className="text-xs text-stone-500">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-stone-100">
                        {notifItems.map((n) => {
                          const NIcon = NOTIF_ICON_MAP[n.type] ?? Bell;
                          const nColor = NOTIF_COLOR_MAP[n.type] ?? "text-stone-400 bg-stone-100";
                          return (
                            <button
                              key={n.id}
                              onClick={() => !n.isRead && handleMarkRead(n.id)}
                              className={cn(
                                "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-stone-50/70 transition-colors",
                                !n.isRead && "bg-emerald-50/20",
                              )}
                            >
                              <div
                                className={cn(
                                  "h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                  nColor,
                                )}
                              >
                                <NIcon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    "text-xs font-medium truncate",
                                    !n.isRead ? "text-[#1C1917]" : "text-stone-500",
                                  )}
                                >
                                  {n.title}
                                </p>
                                <p className="text-[10px] text-stone-400 truncate mt-0.5">
                                  {n.message}
                                </p>
                              </div>
                              <span className="text-[9px] text-stone-400 flex-shrink-0 mt-0.5">
                                {timeAgo(n.createdAt)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setBellOpen(false)}
                    className="block text-center text-xs font-medium text-emerald-600 hover:text-emerald-700 px-4 py-3 border-t border-stone-100"
                  >
                    View all
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/dashboard/settings"
              title="Account settings"
              className="hidden sm:flex flex-col text-right hover:opacity-80 transition-opacity"
            >
              <span className="text-sm font-medium text-[#1C1917] leading-none">
                {user.name}
              </span>
              <span className="text-xs text-stone-500 mt-1 leading-none font-mono">
                {user.email}
              </span>
            </Link>

            <Link
              href="/dashboard/settings"
              title="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-[#1C1917] hover:border-stone-300 hover:bg-stone-50 transition-colors shadow-sm"
            >
              <Settings className="h-4 w-4" />
            </Link>

            <button
              onClick={logout}
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors shadow-sm"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200/80 bg-white px-4 py-3 space-y-1 shadow-md">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-stone-600 hover:bg-stone-50 hover:text-[#1C1917]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-emerald-600" : "text-stone-400",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
