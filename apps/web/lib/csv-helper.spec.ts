import { describe, it, expect } from "vitest";
import {
  detectDelimiter,
  parseCsvRows,
  parseNormalizedAmount,
  parseNormalizedDate,
} from "./csv-helper";

describe("CSV Parser & Normalizer Unit Tests", () => {
  describe("detectDelimiter", () => {
    it("detects comma delimiter", () => {
      expect(detectDelimiter("date,description,amount\n2026-09-01,Lunch,50000")).toBe(",");
    });

    it("detects semicolon delimiter", () => {
      expect(detectDelimiter("date;description;amount\n2026-09-01;Lunch;50000")).toBe(";");
    });

    it("detects tab delimiter", () => {
      expect(detectDelimiter("date\tdescription\tamount\n2026-09-01\tLunch\t50000")).toBe("\t");
    });
  });

  describe("parseCsvRows", () => {
    it("parses rows with commas and quotes", () => {
      const csv = `Date,Description,Amount\n2026-09-01,"Coffee, Beans & Pastry",35000\n2026-09-02,Salary,12000000`;
      const rows = parseCsvRows(csv);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual(["Date", "Description", "Amount"]);
      expect(rows[1]).toEqual(["2026-09-01", "Coffee, Beans & Pastry", "35000"]);
      expect(rows[2]).toEqual(["2026-09-02", "Salary", "12000000"]);
    });

    it("handles escaped quotes in quoted fields", () => {
      const csv = `Date,Description\n2026-09-01,"He said ""Hello"" there"`;
      const rows = parseCsvRows(csv);
      expect(rows[1][1]).toBe('He said "Hello" there');
    });
  });

  describe("parseNormalizedAmount", () => {
    it("normalizes simple integers", () => {
      expect(parseNormalizedAmount("50000")).toEqual({ amount: 50000, isNegative: false });
    });

    it("normalizes Indonesian format (1.500.000,50)", () => {
      expect(parseNormalizedAmount("1.500.000,50")).toEqual({ amount: 1500000.5, isNegative: false });
    });

    it("normalizes parentheses as negative (accounting format)", () => {
      expect(parseNormalizedAmount("(25000)")).toEqual({ amount: 25000, isNegative: true });
    });

    it("normalizes negative prefix and suffix", () => {
      expect(parseNormalizedAmount("-75000")).toEqual({ amount: 75000, isNegative: true });
      expect(parseNormalizedAmount("75000-")).toEqual({ amount: 75000, isNegative: true });
    });
  });

  describe("parseNormalizedDate", () => {
    it("parses ISO format YYYY-MM-DD", () => {
      expect(parseNormalizedDate("2026-09-15")).toBe("2026-09-15");
    });

    it("parses ID format DD/MM/YYYY", () => {
      expect(parseNormalizedDate("15/09/2026")).toBe("2026-09-15");
    });

    it("parses ID format DD-MM-YYYY", () => {
      expect(parseNormalizedDate("15-09-2026")).toBe("2026-09-15");
    });
  });
});
