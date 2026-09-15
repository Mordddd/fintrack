"use client";

import { useEffect, useState } from "react";

export type Language = "id" | "en";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "id", label: "Bahasa Indonesia (ID)" },
  { code: "en", label: "English (US)" },
];

export const DICTIONARY = {
  id: {
    // Navigation
    nav_home: "Beranda",
    nav_transactions: "Transaksi",
    nav_accounts: "Akun & Rekening",
    nav_transfers: "Transfer Saldo",
    nav_budgets: "Anggaran",
    nav_goals: "Target Tabungan",
    nav_reports: "Laporan Keuangan",
    nav_analytics: "Analitik",
    nav_recurring: "Rutin / Berkala",
    nav_activity: "Log Aktivitas",
    nav_settings: "Pengaturan",
    nav_more: "Menu Lain",

    // Common
    cancel: "Batal",
    save: "Simpan",
    save_changes: "Simpan Perubahan",
    saving: "Menyimpan...",
    delete: "Hapus",
    edit: "Ubah",
    amount: "Jumlah Nominal",
    status: "Status",
    date: "Tanggal",
    category: "Kategori",
    account: "Akun",
    notes: "Catatan",

    // Accounts Page & Modal
    accounts_title: "Akun & Rekening",
    accounts_subtitle: "Kelola saldo dompet fisik, bank, dan e-wallet kamu",
    add_new_account: "Tambah Akun Baru",
    edit_account: "Edit Akun",
    account_name: "Nama Akun",
    account_name_placeholder: "contoh: BCA Prioritas, Dompet Tunai",
    account_type: "Jenis Akun",
    account_currency: "Mata Uang Akun",
    initial_balance: "Saldo Awal",
    color_tag: "Warna Tag",
    create_account: "Buat Akun",
    total_balance: "Total Saldo Bersih",
    active_accounts: "Akun Aktif",

    // Account Types
    type_bank: "Rekening Bank",
    type_cash: "Uang Tunai (Cash)",
    type_ewallet: "Dompet Digital (E-Wallet)",
    type_credit_card: "Kartu Kredit",
    type_savings: "Tabungan",
    type_investment: "Investasi",

    // Settings
    settings_title: "Pengaturan Akun",
    settings_subtitle: "Kelola profil pengguna, preferensi mata uang, dan bahasa",
    display_language: "Bahasa Tampilan",
    primary_currency: "Mata Uang Utama",
    timezone: "Zona Waktu",
    profile_tab: "Profil",
    security_tab: "Keamanan",
    language_saved: "Bahasa tampilan berhasil diperbarui",
    profile_saved: "Perubahan profil berhasil disimpan",
  },
  en: {
    // Navigation
    nav_home: "Home",
    nav_transactions: "Transactions",
    nav_accounts: "Accounts",
    nav_transfers: "Transfers",
    nav_budgets: "Budgets",
    nav_goals: "Savings Goals",
    nav_reports: "Financial Reports",
    nav_analytics: "Analytics",
    nav_recurring: "Recurring",
    nav_activity: "Activity Log",
    nav_settings: "Settings",
    nav_more: "More",

    // Common
    cancel: "Cancel",
    save: "Save",
    save_changes: "Save Changes",
    saving: "Saving...",
    delete: "Delete",
    edit: "Edit",
    amount: "Amount",
    status: "Status",
    date: "Date",
    category: "Category",
    account: "Account",
    notes: "Notes",

    // Accounts Page & Modal
    accounts_title: "Accounts",
    accounts_subtitle: "Manage your physical wallets, bank accounts, and e-wallets",
    add_new_account: "Add New Account",
    edit_account: "Edit Account",
    account_name: "Account Name",
    account_name_placeholder: "e.g. BCA Primary, Cash Wallet",
    account_type: "Account Type",
    account_currency: "Account Currency",
    initial_balance: "Initial Balance",
    color_tag: "Color Tag",
    create_account: "Create Account",
    total_balance: "Total Net Balance",
    active_accounts: "Active Accounts",

    // Account Types
    type_bank: "Bank Account",
    type_cash: "Cash",
    type_ewallet: "E-Wallet (GoPay, OVO, etc.)",
    type_credit_card: "Credit Card",
    type_savings: "Savings",
    type_investment: "Investment",

    // Settings
    settings_title: "Account Settings",
    settings_subtitle: "Manage your profile, currency preferences, and language",
    display_language: "Display Language",
    primary_currency: "Primary Currency",
    timezone: "Timezone",
    profile_tab: "Profile",
    security_tab: "Security",
    language_saved: "Display language updated successfully",
    profile_saved: "Profile changes saved successfully",
  },
} as const;

export type TranslationKey = keyof typeof DICTIONARY["en"];

export function getSavedLanguage(): Language {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("fintrack_lang");
      if (saved === "en" || saved === "id") return saved;
    } catch {
      // fallback
    }
  }
  return "id";
}

export function setSavedLanguage(lang: Language): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("fintrack_lang", lang);
      window.dispatchEvent(new CustomEvent("fintrack:lang-changed", { detail: lang }));
    } catch {
      // ignore
    }
  }
}

export function useLanguage() {
  const [lang, setLang] = useState<Language>("id");

  useEffect(() => {
    setLang(getSavedLanguage());

    const handleLangChange = (e: CustomEvent<Language>) => {
      setLang(e.detail);
    };

    window.addEventListener("fintrack:lang-changed" as any, handleLangChange);
    return () => {
      window.removeEventListener("fintrack:lang-changed" as any, handleLangChange);
    };
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    setSavedLanguage(newLang);
  };

  const t = (key: TranslationKey): string => {
    return DICTIONARY[lang]?.[key] || DICTIONARY.en[key] || key;
  };

  return { lang, setLanguage: changeLanguage, t };
}
