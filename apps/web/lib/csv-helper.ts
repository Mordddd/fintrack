/**
 * CSV Helper utilities for parsing, delimiter detection, number normalization, and validation.
 */

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r\n|\n|\r/)[0] || "";
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (tabs > commas && tabs > semicolons) return "\t";
  if (semicolons > commas) return ";";
  return ",";
}

export function parseCsvRows(text: string, delimiter?: string): string[][] {
  const delim = delimiter || detectDelimiter(text);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delim && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentField.trim());
      if (currentRow.some((col) => col.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((col) => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function parseNormalizedAmount(val: string): { amount: number; isNegative: boolean } | null {
  if (!val) return null;
  let clean = val.replace(/[^0-9.,\-+()]/g, "").trim();

  let isNegative = false;
  if (clean.startsWith("(") && clean.endsWith(")")) {
    isNegative = true;
    clean = clean.slice(1, -1).trim();
  } else if (clean.startsWith("-") || clean.endsWith("-")) {
    isNegative = true;
    clean = clean.replace(/-/g, "").trim();
  }

  // Indonesian format: 1.500.000,50 -> 1500000.50
  if (clean.includes(".") && clean.includes(",")) {
    if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else {
      clean = clean.replace(/,/g, "");
    }
  } else if (clean.includes(",")) {
    const parts = clean.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      clean = clean.replace(",", ".");
    } else {
      clean = clean.replace(/,/g, "");
    }
  }

  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return { amount: Math.abs(num), isNegative };
}

export function parseNormalizedDate(val: string): string | null {
  if (!val) return null;
  const trimmed = val.trim();

  // Check ISO format YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const date = new Date(Date.UTC(+y, +m - 1, +d));
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }

  // Check ID/EU format DD/MM/YYYY or DD-MM-YYYY
  const idMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (idMatch) {
    const [, d, m, y] = idMatch;
    const date = new Date(Date.UTC(+y, +m - 1, +d));
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }

  const generic = new Date(trimmed);
  if (!isNaN(generic.getTime())) {
    return generic.toISOString().split("T")[0];
  }

  return null;
}
