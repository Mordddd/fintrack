"use client";

import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ReceiptText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Accounts", href: "/dashboard/accounts", icon: Wallet },
  { label: "Transactions", href: "/dashboard/transactions", icon: ReceiptText },
  { label: "Transfers", href: "/dashboard/transfers", icon: ArrowLeftRight },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

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
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-[#1C1917] leading-none">
                {user.name}
              </span>
              <span className="text-xs text-stone-500 mt-1 leading-none font-mono">
                {user.email}
              </span>
            </div>

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
