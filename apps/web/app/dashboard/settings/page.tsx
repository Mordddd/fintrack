"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  deleteUserAccount,
  getActivityLogs,
} from "@/lib/api";
import { formatIDR, formatDate, cn, setSavedCurrency } from "@/lib/utils";
import { LANGUAGES, useLanguage, type Language } from "@/lib/i18n";
import { Modal } from "@/lib/modal";
import { toast } from "sonner";
import {
  User,
  Shield,
  Sliders,
  AlertOctagon,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Globe,
  Coins,
  Languages,
  Monitor,
  Calendar,
  Sun,
  Moon,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";

const CURRENCIES = [
  { code: "IDR", label: "IDR (Rp)", symbol: "Rp" },
  { code: "USD", label: "USD ($)", symbol: "$" },
  { code: "EUR", label: "EUR (€)", symbol: "€" },
  { code: "SGD", label: "SGD (S$)", symbol: "S$" },
];

const TIMEZONES = [
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB, UTC+7)" },
  { value: "Asia/Makassar", label: "Asia/Makassar (WITA, UTC+8)" },
  { value: "Asia/Jayapura", label: "Asia/Jayapura (WIT, UTC+9)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST, UTC+9)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
];

type SettingsTab = "profile" | "security" | "preferences" | "danger";

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const { lang, setLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile Form State
  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [currency, setCurrency] = useState(user?.currency ?? "IDR");
  const [timezone, setTimezone] = useState(user?.timezone ?? "Asia/Jakarta");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState<string | null>(null);

  // Preferences State (persisted in localStorage)
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<"monday" | "sunday">("monday");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  // Danger Zone State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmEmailInput, setConfirmEmailInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl ?? "");
      setCurrency(user.currency ?? "IDR");
      setTimezone(user.timezone ?? "Asia/Jakarta");
    }
  }, [user]);

  // Load preferences and last login on mount
  useEffect(() => {
    const savedFirstDay = localStorage.getItem("fintrack_first_day");
    if (savedFirstDay === "sunday" || savedFirstDay === "monday") {
      setFirstDayOfWeek(savedFirstDay);
    }
    const savedTheme = localStorage.getItem("fintrack_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setThemeMode(savedTheme);
    }

    // Load last login
    (async () => {
      try {
        const logs = await getActivityLogs({ action: "LOGIN", limit: 1 });
        if (logs.data.length > 0) {
          setLastLoginTime(logs.data[0].createdAt);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateUserProfile({
        name: name.trim(),
        avatarUrl: avatarUrl.trim() || null,
        currency,
        timezone,
      });
      updateUser(updated);
      setSavedCurrency(currency);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    try {
      await changeUserPassword({
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to change password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSavePreferences = (newFirstDay: "monday" | "sunday", newTheme: "light" | "dark") => {
    setFirstDayOfWeek(newFirstDay);
    localStorage.setItem("fintrack_first_day", newFirstDay);

    setThemeMode(newTheme);
    localStorage.setItem("fintrack_theme", newTheme);

    toast.success("Preferences updated");
  };

  const handleDeleteAccount = async () => {
    if (confirmEmailInput.toLowerCase().trim() !== (user?.email ?? "").toLowerCase().trim()) {
      toast.error("Confirmation email does not match");
      return;
    }

    setDeleting(true);
    try {
      await deleteUserAccount(confirmEmailInput);
      toast.success("Account deleted. Farewell!");
      logout();
      router.replace("/register");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  const getInitials = (n: string) => {
    return n
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">
          Account & Preferences
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage your personal profile, security credentials, and application preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-stone-200/80 pb-px overflow-x-auto">
        {[
          { id: "profile", label: "Profile", icon: User },
          { id: "security", label: "Security", icon: Shield },
          { id: "preferences", label: "Preferences", icon: Sliders },
          { id: "danger", label: "Danger Zone", icon: AlertOctagon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDanger = tab.id === "danger";

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2 -mb-px whitespace-nowrap",
                isActive
                  ? isDanger
                    ? "border-rose-600 text-rose-600 bg-rose-50/40"
                    : "border-emerald-600 text-emerald-700 bg-white shadow-sm font-semibold"
                  : isDanger
                  ? "border-transparent text-stone-500 hover:text-rose-600 hover:bg-rose-50/20"
                  : "border-transparent text-stone-500 hover:text-[#1C1917] hover:bg-stone-100/60",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-semibold text-[#1C1917] border-b border-stone-100 pb-3">
              Personal Information
            </h2>

            {/* Avatar Preview & URL */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-sm"
                    onError={() => {
                      toast.error("Unable to load avatar image from URL");
                    }}
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xl shadow-sm border border-emerald-200/60">
                    {getInitials(name || "FT")}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="block text-xs font-medium text-stone-600">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
                <p className="text-[11px] text-stone-400">
                  Provide a direct HTTPS link to an image (PNG, JPG, WebP)
                </p>
              </div>
            </div>

            {/* Name and Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-600">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-stone-600">
                    Email Address
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                </div>
                <input
                  type="email"
                  disabled
                  value={user?.email ?? ""}
                  className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-500 cursor-not-allowed font-mono"
                />
              </div>
            </div>

            {/* Language, Currency and Timezone */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                  <Languages className="h-3.5 w-3.5 text-stone-400" />
                  {t("display_language")}
                </label>
                <select
                  value={lang}
                  onChange={(e) => {
                    const newLang = e.target.value as Language;
                    setLanguage(newLang);
                    toast.success(newLang === "id" ? "Bahasa tampilan diubah ke Bahasa Indonesia" : "Display language switched to English");
                  }}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                  <Coins className="h-3.5 w-3.5 text-stone-400" />
                  {t("primary_currency")}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                  <Globe className="h-3.5 w-3.5 text-stone-400" />
                  {t("timezone")}
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                {savingProfile ? "Saving changes..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Security */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 p-6 sm:p-8 space-y-5">
              <h2 className="text-base font-semibold text-[#1C1917] border-b border-stone-100 pb-3">
                Change Password
              </h2>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-600">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-600">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-400">Minimum 8 characters</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-600">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-rose-500">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {updatingPassword ? "Updating password..." : "Update Password"}
                </button>
              </div>
            </div>
          </form>

          {/* Active Sessions Info */}
          <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-semibold text-[#1C1917] border-b border-stone-100 pb-3">
              Active Session
            </h2>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200/60">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Monitor className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#1C1917]">Current Browser Session</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                    Active Now
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Authenticated via JWT bearer token on this device
                </p>
                {lastLoginTime && (
                  <p className="text-[11px] text-stone-400 mt-1 font-mono">
                    Last login: {new Date(lastLoginTime).toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Preferences */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200/60 p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-semibold text-[#1C1917] border-b border-stone-100 pb-3">
              Display & Regional Preferences
            </h2>

            {/* Currency Format Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-600">
                Currency Display Format
              </label>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500">Live preview of format</p>
                  <p className="font-mono text-lg font-bold text-emerald-600 mt-0.5">
                    {formatIDR(1500000)}
                  </p>
                </div>
                <span className="text-xs text-stone-400 font-mono">
                  Dot separated, no decimals
                </span>
              </div>
            </div>

            {/* First Day of Week */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                First Day of the Week
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "monday", label: "Monday" },
                  { id: "sunday", label: "Sunday" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      handleSavePreferences(opt.id as "monday" | "sunday", themeMode)
                    }
                    className={cn(
                      "py-3 px-4 rounded-xl text-sm font-medium border text-center transition-all",
                      firstDayOfWeek === opt.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm font-semibold"
                        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Mode Toggle */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-600">
                Theme Appearance
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSavePreferences(firstDayOfWeek, "light")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium border transition-all",
                    themeMode === "light"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm font-semibold"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                  )}
                >
                  <Sun className="h-4 w-4" />
                  Light Mode
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePreferences(firstDayOfWeek, "dark")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium border transition-all",
                    themeMode === "dark"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm font-semibold"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                  )}
                >
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Danger Zone */}
      {activeTab === "danger" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] border border-rose-200/80 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-rose-900">
                  Delete Account & Erase All Financial Data
                </h2>
                <p className="text-xs text-rose-600/90 mt-0.5">
                  Permanent action. All transactions, accounts, budgets, goals, and history will be irreversibly erased.
                </p>
              </div>
            </div>

            <div className="bg-rose-50/60 rounded-xl p-4 text-xs text-rose-700 space-y-1.5 border border-rose-100">
              <p className="font-semibold">What happens when you delete your account:</p>
              <ul className="list-disc list-inside space-y-1 text-rose-600">
                <li>All linked bank, cash, and e-wallet accounts will be deleted</li>
                <li>All transaction records and historical statements will be permanently purged</li>
                <li>All recurring automation jobs and notifications will cease</li>
                <li>Your session will terminate immediately and cannot be recovered</li>
              </ul>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmEmailInput("");
                  setDeleteModalOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-stone-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-semibold">Confirm Deletion</h3>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-600">
                To confirm permanent deletion, please enter your registered email address:
              </p>
              <div className="p-2.5 rounded-xl bg-stone-100 text-center font-mono text-xs text-stone-700 font-semibold select-all">
                {user?.email}
              </div>

              <input
                type="email"
                value={confirmEmailInput}
                onChange={(e) => setConfirmEmailInput(e.target.value)}
                placeholder="Type your email to confirm"
                className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100 bg-stone-50/50">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={
                  deleting ||
                  confirmEmailInput.toLowerCase().trim() !==
                    (user?.email ?? "").toLowerCase().trim()
                }
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 py-2 text-sm font-medium transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
