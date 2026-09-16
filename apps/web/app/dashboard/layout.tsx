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
  Plus,
  PiggyBank,
  Target,
  BarChart3,
  RefreshCw,
  Bell,
  AlertTriangle,
  CheckCircle,
  History,
  Settings,
  ChevronDown,
  FileSpreadsheet,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUnreadCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api";
import type { NotificationResponse } from "@fintrack/shared";
import { QuickAddModal, type QuickAddInitialData } from "@/lib/quick-add-modal";

// Primary navigation links (always in top bar on desktop >= 1024px)
const PRIMARY_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Accounts", href: "/dashboard/accounts", icon: Wallet },
  { label: "Transactions", href: "/dashboard/transactions", icon: ReceiptText },
  { label: "Transfers", href: "/dashboard/transfers", icon: ArrowLeftRight },
  { label: "Budgets", href: "/dashboard/budgets", icon: PiggyBank },
  { label: "Reports", href: "/dashboard/reports", icon: FileSpreadsheet },
];

// Secondary navigation links (in 'More' dropdown or spacious bar on ultra-wide)
const SECONDARY_NAV = [
  { label: "Goals", href: "/dashboard/goals", icon: Target },
  { label: "Recurring", href: "/dashboard/recurring", icon: RefreshCw },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Activity", href: "/dashboard/activity", icon: History },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Notification state
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<NotificationResponse[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Global Quick Add state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState<QuickAddInitialData | null>(null);

  const bellRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        const tag = target?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        setQuickAddData(null);
        setQuickAddOpen(true);
      }
    }

    function handleQuickAddEvent(e: Event) {
      const customEvent = e as CustomEvent<QuickAddInitialData>;
      setQuickAddData(customEvent.detail || null);
      setQuickAddOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("fintrack:quick-add", handleQuickAddEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("fintrack:quick-add", handleQuickAddEvent);
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  }, [pathname]);

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
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnread]);

  // Load notifications when bell opened
  useEffect(() => {
    if (!bellOpen) return;
    let cancelled = false;
    (async () => {
      setNotifLoading(true);
      try {
        const res = await getNotifications({ limit: 10 });
        if (!cancelled) setNotifItems(res.data ?? []);
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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  const isSecondaryActive = SECONDARY_NAV.some((item) =>
    pathname.startsWith(item.href),
  );

  return (
    <div className="min-h-[100dvh] w-full bg-[#FAFAF9] text-[#1C1917] flex flex-col">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/70 bg-[#FAFAF9]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl 2xl:max-w-[1536px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand & Desktop Navigation */}
          <div className="flex items-center gap-4 xl:gap-6 min-w-0">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 font-semibold tracking-tight text-[#1C1917] flex-shrink-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <span className="font-mono text-base font-bold">F</span>
              </div>
              <span className="text-lg hidden sm:inline-block">FinTrack</span>
            </Link>

            {/* Desktop Navigation (lg: >= 1024px) */}
            <nav className="hidden lg:flex items-center gap-1 min-w-0">
              {PRIMARY_NAV.map((item) => {
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
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-medium transition-all duration-150 whitespace-nowrap",
                      isActive
                        ? "bg-white text-emerald-700 shadow-sm border border-stone-200/70 font-semibold"
                        : "text-stone-600 hover:text-[#1C1917] hover:bg-stone-100/70",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 xl:h-4 xl:w-4",
                        isActive ? "text-emerald-600" : "text-stone-400",
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* More Dropdown for secondary items */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-medium transition-all duration-150 whitespace-nowrap",
                    isSecondaryActive
                      ? "bg-white text-emerald-700 shadow-sm border border-stone-200/70 font-semibold"
                      : "text-stone-600 hover:text-[#1C1917] hover:bg-stone-100/70",
                  )}
                >
                  <MoreHorizontalIcon className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-stone-400" />
                  <span>More</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-150 text-stone-400",
                      moreMenuOpen && "rotate-180",
                    )}
                  />
                </button>

                {moreMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-52 rounded-2xl bg-white p-1.5 shadow-xl border border-stone-200/80 z-50 animate-slide-up">
                    {SECONDARY_NAV.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs xl:text-sm font-medium transition-colors",
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
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Notifications, User Controls, Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Quick Add Action Button */}
            <button
              onClick={() => {
                setQuickAddData(null);
                setQuickAddOpen(true);
              }}
              title="Quick Add Transaction (Press N)"
              aria-label="Quick Add Transaction"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add</span>
              <kbd className="hidden md:inline-block px-1 py-0.5 bg-emerald-700/80 text-[10px] text-emerald-100 rounded font-mono leading-none">
                N
              </kbd>
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen(!bellOpen)}
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-[#1C1917] hover:border-stone-300 transition-colors shadow-sm"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {bellOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                    <span className="text-sm font-semibold text-[#1C1917]">
                      Notifications
                    </span>
                    <button
                      onClick={handleMarkAll}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="p-4 space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-12 bg-stone-100 rounded-xl animate-pulse"
                          />
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
                          const nColor =
                            NOTIF_COLOR_MAP[n.type] ?? "text-stone-400 bg-stone-100";
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
                                <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                                  {n.message}
                                </p>
                                <span className="text-[10px] text-stone-400 mt-1 block">
                                  {timeAgo(n.createdAt)}
                                </span>
                              </div>
                              {!n.isRead && (
                                <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 border-t border-stone-100 bg-stone-50/50 text-center">
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setBellOpen(false)}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      View all notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge (Desktop) */}
            <Link
              href="/dashboard/settings"
              className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl hover:bg-stone-100/70 transition-colors border border-transparent hover:border-stone-200/60"
            >
              <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <span className="text-xs font-medium text-stone-700 max-w-[120px] truncate hidden md:inline-block">
                {user.name}
              </span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-rose-600 hover:border-stone-300 transition-colors shadow-sm"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Mobile / Tablet Menu Button (lg:hidden) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open navigation menu"
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition-colors shadow-sm"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Full Drawer Panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200/70 bg-white px-4 py-4 space-y-1 shadow-xl max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <div className="pb-3 mb-2 border-b border-stone-100 px-2 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1C1917] truncate">{user.name}</p>
                <p className="text-xs text-stone-400 truncate">{user.email}</p>
              </div>
            </div>

            <p className="px-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1 mt-2">
              Main Menu
            </p>
            {ALL_NAV.map((item) => {
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
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area (Strictly Responsive & No Overflow) */}
      <main className="w-full flex-1 min-w-0">
        <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1536px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors",
            pathname === "/dashboard"
              ? "text-emerald-600 font-semibold"
              : "text-stone-500 hover:text-stone-800",
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Home</span>
        </Link>

        <Link
          href="/dashboard/transactions"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors",
            pathname.startsWith("/dashboard/transactions")
              ? "text-emerald-600 font-semibold"
              : "text-stone-500 hover:text-stone-800",
          )}
        >
          <ReceiptText className="h-4 w-4" />
          <span>Transactions</span>
        </Link>

        {/* Center Quick Add Floating Button */}
        <button
          onClick={() => {
            setQuickAddData(null);
            setQuickAddOpen(true);
          }}
          aria-label="Quick Add Transaction"
          className="flex flex-col items-center justify-center -mt-4 group focus:outline-none"
        >
          <div className="h-10 w-10 rounded-2xl bg-emerald-600 group-active:scale-95 text-white flex items-center justify-center shadow-md border-2 border-white transition-transform">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 mt-0.5">Add</span>
        </button>

        <Link
          href="/dashboard/budgets"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors",
            pathname.startsWith("/dashboard/budgets")
              ? "text-emerald-600 font-semibold"
              : "text-stone-500 hover:text-stone-800",
          )}
        >
          <PiggyBank className="h-4 w-4" />
          <span>Budgets</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-medium text-stone-500 hover:text-stone-800"
        >
          <Menu className="h-4 w-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Global Quick Add Transaction Modal */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        initialData={quickAddData}
      />
    </div>
  );
}

function MoreHorizontalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <circle cx={12} cy={12} r={1} />
      <circle cx={19} cy={12} r={1} />
      <circle cx={5} cy={12} r={1} />
    </svg>
  );
}
