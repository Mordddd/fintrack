"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet,
  AlertTriangle,
  ReceiptText,
} from "lucide-react";
import {
  getAccounts,
  getCategories,
  importTransactionsCsv,
} from "@/lib/api";
import { formatIDR, cn } from "@/lib/utils";
import type {
  AccountResponse,
  CategoryResponse,
  CsvImportPayload,
  CsvImportResult,
} from "@fintrack/shared";
import { TransactionType } from "@fintrack/shared";

interface ParsedRawRow {
  [header: string]: string;
}

interface NormalizedRow {
  rowNumber: number;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  accountId: string;
  categoryId: string;
  notes?: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export default function CsvImportPage() {
  const router = useRouter();

  // Reference data
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Workflow steps: 1 = Upload, 2 = Mapping, 3 = Preview & Validate, 4 = Result
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Raw file state
  const [file, setFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<ParsedRawRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Column mappings
  const [dateCol, setDateCol] = useState("");
  const [descCol, setDescCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
  const [typeCol, setTypeCol] = useState("");
  const [categoryCol, setCategoryCol] = useState("");
  const [accountCol, setAccountCol] = useState("");

  // Default fallbacks if column is unmapped
  const [defaultAccountId, setDefaultAccountId] = useState("");
  const [defaultExpenseCatId, setDefaultExpenseCatId] = useState("");
  const [defaultIncomeCatId, setDefaultIncomeCatId] = useState("");

  // Duplicate settings
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Preview filtering
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "VALID" | "INVALID">("ALL");

  // Submitting & Results
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);

  // Load accounts and categories
  useEffect(() => {
    async function load() {
      try {
        const [accs, cats] = await Promise.all([getAccounts(), getCategories()]);
        setAccounts(accs);
        setCategories(cats);

        if (accs.length > 0) setDefaultAccountId(accs[0].id);

        const exp = cats.find((c) => c.type === "EXPENSE");
        if (exp) setDefaultExpenseCatId(exp.id);

        const inc = cats.find((c) => c.type === "INCOME");
        if (inc) setDefaultIncomeCatId(inc.id);
      } catch (err) {
        console.error("Failed to load reference data", err);
      } finally {
        setLoadingRefs(false);
      }
    }
    load();
  }, []);

  // Robust CSV Parser handling quotes, commas, semicolons, tabs
  function parseCSVText(text: string) {
    const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error("CSV file must contain at least a header and one data row.");
    }

    // Detect delimiter
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;

    let delimiter = ",";
    if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
    if (tabCount > commaCount && tabCount > semiCount) delimiter = "\t";

    function splitRow(line: string): string[] {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          if (inQuotes && line[i + 1] === char) {
            current += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }

    const headers = splitRow(lines[0]).map((h) => h.replace(/^["']|["']$/g, "").trim());
    const rows: ParsedRawRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = splitRow(lines[i]).map((v) => v.replace(/^["']|["']$/g, "").trim());
      if (values.length === headers.length || values.some((v) => v.length > 0)) {
        const rowObj: ParsedRawRow = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] ?? "";
        });
        rows.push(rowObj);
      }
    }

    return { headers, rows };
  }

  // Handle file drop/upload
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const { headers, rows } = parseCSVText(content);
        setRawHeaders(headers);
        setRawRows(rows);

        // Auto-detect columns (English & Indonesian support)
        headers.forEach((h) => {
          const lower = h.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (["date", "tanggal", "waktu", "txdate", "transactiondate"].includes(lower)) {
            setDateCol(h);
          } else if (
            ["description", "keterangan", "deskripsi", "memo", "narrative", "item"].includes(lower)
          ) {
            setDescCol(h);
          } else if (
            ["amount", "nominal", "jumlah", "total", "value", "debet", "kredit"].includes(lower)
          ) {
            setAmountCol(h);
          } else if (["type", "tipe", "jenis", "dc", "flow"].includes(lower)) {
            setTypeCol(h);
          } else if (["category", "kategori", "pos"].includes(lower)) {
            setCategoryCol(h);
          } else if (["account", "rekening", "akun", "wallet"].includes(lower)) {
            setAccountCol(h);
          }
        });

        setStep(2);
      } catch (err: any) {
        setParseError(err.message || "Failed to parse CSV file.");
      }
    };
    reader.readAsText(f);
  }

  // Parse numbers from various currencies and locale formats
  function parseAmount(val: string): { amount: number; isNegative: boolean } {
    let clean = val.replace(/[^\d.,-]/g, "").trim();
    if (!clean) return { amount: 0, isNegative: false };

    let isNegative = clean.startsWith("-") || clean.includes("(") || clean.includes("CR");
    clean = clean.replace(/[-()CR]/g, "").trim();

    // Check if format is 1.000,00 or 1,000.00
    const lastComma = clean.lastIndexOf(",");
    const lastDot = clean.lastIndexOf(".");

    if (lastComma > lastDot) {
      // European/Indonesian format: 1.250.000,50
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else if (lastDot > lastComma) {
      // US format: 1,250,000.50
      clean = clean.replace(/,/g, "");
    } else if (lastComma !== -1 && lastDot === -1) {
      // Could be 1000,50
      clean = clean.replace(",", ".");
    }

    const num = parseFloat(clean);
    return { amount: isNaN(num) ? 0 : num, isNegative };
  }

  // Parse date into standard ISO format
  function parseDateToIso(val: string): string | null {
    if (!val) return null;
    const clean = val.trim();

    // Try standard JS date
    const d = new Date(clean);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1990) {
      return d.toISOString();
    }

    // Try DD/MM/YYYY or DD-MM-YYYY
    const dmy = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10) - 1;
      const year = parseInt(dmy[3], 10);
      const customD = new Date(year, month, day);
      if (!isNaN(customD.getTime())) return customD.toISOString();
    }

    return null;
  }

  // Compute normalized and validated rows
  const normalizedRows: NormalizedRow[] = useMemo(() => {
    if (!dateCol || !amountCol || rawRows.length === 0) return [];

    const catNameMap = new Map<string, CategoryResponse>();
    categories.forEach((c) => catNameMap.set(c.name.toLowerCase().trim(), c));

    const accNameMap = new Map<string, AccountResponse>();
    accounts.forEach((a) => accNameMap.set(a.name.toLowerCase().trim(), a));

    return rawRows.map((raw, idx) => {
      const errors: string[] = [];

      // 1. Date
      const rawDate = raw[dateCol];
      const isoDate = parseDateToIso(rawDate);
      if (!isoDate) {
        errors.push(`Invalid date format: "${rawDate}"`);
      }

      // 2. Amount & Type
      const rawAmt = raw[amountCol];
      const { amount, isNegative } = parseAmount(rawAmt);
      if (amount <= 0) {
        errors.push(`Amount must be greater than 0: "${rawAmt}"`);
      }

      // Detect type
      let type: TransactionType = TransactionType.EXPENSE;
      if (typeCol && raw[typeCol]) {
        const rawT = raw[typeCol].toLowerCase();
        if (
          ["income", "pemasukan", "masuk", "cr", "credit", "in"].includes(rawT) ||
          rawT.includes("income")
        ) {
          type = TransactionType.INCOME;
        } else {
          type = TransactionType.EXPENSE;
        }
      } else if (isNegative) {
        type = TransactionType.EXPENSE;
      }

      // 3. Account
      let accountId = defaultAccountId;
      if (accountCol && raw[accountCol]) {
        const matched = accNameMap.get(raw[accountCol].toLowerCase().trim());
        if (matched) {
          accountId = matched.id;
        } else {
          errors.push(`Account "${raw[accountCol]}" not found`);
        }
      }
      if (!accountId) {
        errors.push("No destination account selected");
      }

      // 4. Category
      let categoryId = type === TransactionType.INCOME ? defaultIncomeCatId : defaultExpenseCatId;
      if (categoryCol && raw[categoryCol]) {
        const matched = catNameMap.get(raw[categoryCol].toLowerCase().trim());
        if (matched) {
          categoryId = matched.id;
        }
      }
      if (!categoryId) {
        errors.push("No category assigned");
      }

      // 5. Description
      const description = descCol && raw[descCol] ? raw[descCol].trim() : "Imported Transaction";

      return {
        rowNumber: idx + 1,
        date: isoDate ?? new Date().toISOString(),
        description,
        amount,
        type,
        accountId,
        categoryId,
        notes: `Imported from CSV row #${idx + 1}`,
        isValid: errors.length === 0,
        isDuplicate: false,
        errors,
      };
    });
  }, [
    rawRows,
    dateCol,
    amountCol,
    descCol,
    typeCol,
    categoryCol,
    accountCol,
    defaultAccountId,
    defaultExpenseCatId,
    defaultIncomeCatId,
    categories,
    accounts,
  ]);

  // Summary counts
  const validCount = normalizedRows.filter((r) => r.isValid).length;
  const invalidCount = normalizedRows.filter((r) => !r.isValid).length;

  const filteredPreviewRows = useMemo(() => {
    if (previewFilter === "VALID") return normalizedRows.filter((r) => r.isValid);
    if (previewFilter === "INVALID") return normalizedRows.filter((r) => !r.isValid);
    return normalizedRows;
  }, [normalizedRows, previewFilter]);

  // Execute Batch Import
  async function handleConfirmImport() {
    const validRows = normalizedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    try {
      const payload: CsvImportPayload = {
        items: validRows.map((r) => ({
          date: r.date,
          description: r.description,
          amount: r.amount,
          type: r.type,
          categoryId: r.categoryId,
          accountId: r.accountId,
          notes: r.notes,
        })),
        skipDuplicates,
      };

      const result = await importTransactionsCsv(payload);
      setImportResult(result);
      setStep(4);
    } catch (err: any) {
      alert(`Import failed: ${err?.message || "Unknown error"}`);
    } finally {
      setImporting(false);
    }
  }

  if (loadingRefs) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in w-full min-w-0 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/transactions"
              className="text-stone-400 hover:text-stone-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">
              Import Transactions from CSV
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Safely batch-import bank or e-wallet statements with duplicate detection and preview.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
          <span className={cn("px-2.5 py-1 rounded-lg", step === 1 ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-400")}>
            1. Upload
          </span>
          <span className="text-stone-300">→</span>
          <span className={cn("px-2.5 py-1 rounded-lg", step === 2 ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-400")}>
            2. Map
          </span>
          <span className="text-stone-300">→</span>
          <span className={cn("px-2.5 py-1 rounded-lg", step === 3 ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-400")}>
            3. Preview
          </span>
          <span className="text-stone-300">→</span>
          <span className={cn("px-2.5 py-1 rounded-lg", step === 4 ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-400")}>
            4. Done
          </span>
        </div>
      </div>

      {/* STEP 1: Upload File */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-stone-200/70 p-8 shadow-sm text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Upload className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1C1917]">Choose CSV file to upload</h2>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Export statements from BCA, Mandiri, GoPay, OVO, or Excel spreadsheets (.csv format).
            </p>
          </div>

          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 max-w-md mx-auto">
              {parseError}
            </div>
          )}

          <label className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 shadow-sm cursor-pointer transition-colors">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Select CSV File</span>
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <div className="pt-6 border-t border-stone-100 text-left text-xs text-stone-400 max-w-md mx-auto space-y-1">
            <p className="font-semibold text-stone-600">Tips for seamless import:</p>
            <p>• Comma, semicolon, and tab delimiters are detected automatically.</p>
            <p>• Supported dates: YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY.</p>
            <p>• Indonesian headers (Tanggal, Keterangan, Nominal, Tipe) are auto-mapped.</p>
          </div>
        </div>
      )}

      {/* STEP 2: Column Mapping */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-stone-200/70 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-[#1C1917]">
                Map CSV Columns ({rawRows.length} rows found)
              </h2>
              <p className="text-xs text-stone-500">
                Match columns from your file to FinTrack transaction fields.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-stone-500 hover:text-stone-800"
            >
              Choose different file
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Date Column */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Transaction Date *
              </label>
              <select
                value={dateCol}
                onChange={(e) => setDateCol(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none"
              >
                <option value="">Select column...</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h} (e.g. {rawRows[0]?.[h]})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Column */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Amount (Nominal) *
              </label>
              <select
                value={amountCol}
                onChange={(e) => setAmountCol(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none"
              >
                <option value="">Select column...</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h} (e.g. {rawRows[0]?.[h]})
                  </option>
                ))}
              </select>
            </div>

            {/* Description Column */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Description / Keterangan
              </label>
              <select
                value={descCol}
                onChange={(e) => setDescCol(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none"
              >
                <option value="">None (use default)</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h} (e.g. {rawRows[0]?.[h]})
                  </option>
                ))}
              </select>
            </div>

            {/* Type Column */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Transaction Type (Income / Expense)
              </label>
              <select
                value={typeCol}
                onChange={(e) => setTypeCol(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none"
              >
                <option value="">None (detect by sign / default Expense)</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h} (e.g. {rawRows[0]?.[h]})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Column */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Category Column (Optional)
              </label>
              <select
                value={categoryCol}
                onChange={(e) => setCategoryCol(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none"
              >
                <option value="">None (use fallback category)</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h} (e.g. {rawRows[0]?.[h]})
                  </option>
                ))}
              </select>
            </div>

            {/* Account Column */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Account Column (Optional)
              </label>
              <select
                value={accountCol}
                onChange={(e) => setAccountCol(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none"
              >
                <option value="">None (use target account below)</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h} (e.g. {rawRows[0]?.[h]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Default Assignment Section */}
          <div className="border-t border-stone-100 pt-5 space-y-4">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Default Target Accounts & Categories
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Target Account</label>
                <select
                  value={defaultAccountId}
                  onChange={(e) => setDefaultAccountId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">Default Expense Category</label>
                <select
                  value={defaultExpenseCatId}
                  onChange={(e) => setDefaultExpenseCatId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none"
                >
                  {categories
                    .filter((c) => c.type === "EXPENSE")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">Default Income Category</label>
                <select
                  value={defaultIncomeCatId}
                  onChange={(e) => setDefaultIncomeCatId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none"
                >
                  {categories
                    .filter((c) => c.type === "INCOME")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-stone-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
            >
              Back
            </button>
            <button
              disabled={!dateCol || !amountCol}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <span>Validate & Preview</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview & Validation */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-stone-200/70 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-[#1C1917]">
                Preview Import Data ({normalizedRows.length} Rows)
              </h2>
              <p className="text-xs text-stone-500">
                Verify parsed transactions before committing to your accounts.
              </p>
            </div>

            {/* Duplicate Settings */}
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Skip duplicate transactions automatically</span>
            </label>
          </div>

          {/* Validation Metrics Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewFilter("ALL")}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-semibold transition-colors",
                previewFilter === "ALL"
                  ? "bg-stone-800 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200",
              )}
            >
              All ({normalizedRows.length})
            </button>
            <button
              onClick={() => setPreviewFilter("VALID")}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors",
                previewFilter === "VALID"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Valid ({validCount})</span>
            </button>
            {invalidCount > 0 && (
              <button
                onClick={() => setPreviewFilter("INVALID")}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors",
                  previewFilter === "INVALID"
                    ? "bg-rose-600 text-white"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100",
                )}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Invalid ({invalidCount})</span>
              </button>
            )}
          </div>

          {/* Preview Table */}
          <div className="border border-stone-200/70 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-stone-50 border-b border-stone-200/70 text-stone-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Row</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPreviewRows.slice(0, 100).map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={cn(
                      "hover:bg-stone-50/70",
                      !row.isValid && "bg-rose-50/30",
                    )}
                  >
                    <td className="px-4 py-2 font-mono text-stone-400">#{row.rowNumber}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-stone-600 font-mono">
                      {row.date.split("T")[0]}
                    </td>
                    <td className="px-4 py-2 font-medium text-stone-800 max-w-xs truncate">
                      {row.description}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                          row.type === "INCOME"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-600",
                        )}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2 text-right font-mono font-semibold",
                        row.type === "INCOME" ? "text-emerald-600" : "text-stone-900",
                      )}
                    >
                      {formatIDR(row.amount)}
                    </td>
                    <td className="px-4 py-2">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Ready
                        </span>
                      ) : (
                        <span
                          title={row.errors.join(", ")}
                          className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium cursor-help"
                        >
                          <AlertCircle className="h-3 w-3" /> {row.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPreviewRows.length > 100 && (
            <p className="text-[11px] text-stone-400 text-center">
              Showing first 100 of {filteredPreviewRows.length} rows in preview.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-stone-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
            >
              Back to Mapping
            </button>
            <button
              disabled={validCount === 0 || importing}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {importing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Importing {validCount} rows...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm & Import ({validCount} Valid)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Import Complete Summary */}
      {step === 4 && importResult && (
        <div className="bg-white rounded-2xl border border-stone-200/70 p-8 shadow-sm text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#1C1917]">Import Finished!</h2>
            <p className="text-xs text-stone-500 mt-1">
              Your accounts and transactions have been updated successfully.
            </p>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Imported</span>
              <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
                {importResult.imported}
              </p>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
              <span className="text-[10px] uppercase font-bold text-stone-500">Skipped</span>
              <p className="text-xl font-bold font-mono text-stone-700 mt-1">
                {importResult.skipped}
              </p>
            </div>
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
              <span className="text-[10px] uppercase font-bold text-amber-600">Duplicates</span>
              <p className="text-xl font-bold font-mono text-amber-700 mt-1">
                {importResult.duplicate}
              </p>
            </div>
            <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
              <span className="text-[10px] uppercase font-bold text-rose-600">Failed</span>
              <p className="text-xl font-bold font-mono text-rose-700 mt-1">
                {importResult.failed}
              </p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="max-w-md mx-auto p-4 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-700 space-y-1">
              <p className="font-semibold">Some rows failed to import:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {importResult.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>
                    Row #{e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setRawRows([]);
                setImportResult(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Import Another File
            </button>
            <Link
              href="/dashboard/transactions"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-xs sm:text-sm font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors"
            >
              View Transactions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
