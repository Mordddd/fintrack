import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the currently active currency from localStorage or defaults to IDR.
 */
export function getSavedCurrency(): string {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem("fintrack_currency") || "IDR";
    } catch {
      return "IDR";
    }
  }
  return "IDR";
}

/**
 * Persists the preferred currency to localStorage and notifies listeners.
 */
export function setSavedCurrency(currency: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("fintrack_currency", currency);
      window.dispatchEvent(new CustomEvent("fintrack:currency-changed", { detail: currency }));
    } catch {
      // ignore
    }
  }
}

/**
 * Formats a monetary amount into a clean, localized currency string.
 * Supports IDR, USD, EUR, SGD, GBP, JPY with graceful fallback.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode?: string
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  const curr = (currencyCode || getSavedCurrency() || "IDR").toUpperCase();

  if (isNaN(num)) {
    if (curr === "EUR") return "€ 0,00";
    if (curr === "USD") return "$0.00";
    if (curr === "SGD") return "S$ 0.00";
    if (curr === "GBP") return "£0.00";
    if (curr === "JPY") return "¥0";
    return "Rp 0";
  }

  // Indonesian Rupiah: Rp 1.000.000 (standard zero decimals)
  if (curr === "IDR") {
    const formatted = Math.abs(Math.round(num))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const sign = num < 0 ? "-" : "";
    return `${sign}Rp ${formatted}`;
  }

  // Euro: € 1.000,00 (dot thousand, comma decimal)
  if (curr === "EUR") {
    const sign = num < 0 ? "-" : "";
    const parts = Math.abs(num).toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decimalPart = parts[1];
    return `${sign}€ ${integerPart},${decimalPart}`;
  }

  // US Dollar: $1,000.00 (comma thousand, dot decimal)
  if (curr === "USD") {
    const sign = num < 0 ? "-" : "";
    const parts = Math.abs(num).toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const decimalPart = parts[1];
    return `${sign}$${integerPart}.${decimalPart}`;
  }

  // Singapore Dollar: S$ 1,000.00
  if (curr === "SGD") {
    const sign = num < 0 ? "-" : "";
    const parts = Math.abs(num).toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const decimalPart = parts[1];
    return `${sign}S$ ${integerPart}.${decimalPart}`;
  }

  // British Pound: £1,000.00
  if (curr === "GBP") {
    const sign = num < 0 ? "-" : "";
    const parts = Math.abs(num).toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const decimalPart = parts[1];
    return `${sign}£${integerPart}.${decimalPart}`;
  }

  // Japanese Yen: ¥1,000
  if (curr === "JPY") {
    const sign = num < 0 ? "-" : "";
    const formatted = Math.abs(Math.round(num))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${sign}¥${formatted}`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
    }).format(num);
  } catch {
    return `${curr} ${num.toLocaleString()}`;
  }
}

/**
 * Universal formatter defaulting to the user's active currency.
 * Backwards compatible with all existing formatIDR() call sites.
 */
export function formatIDR(
  amount: number | string | null | undefined,
  currencyCode?: string
): string {
  return formatCurrency(amount, currencyCode);
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
