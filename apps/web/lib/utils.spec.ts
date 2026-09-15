import { describe, it, expect } from "vitest";
import { formatIDR, formatDate, cn } from "./utils";

describe("Frontend Utilities & Financial Formatters", () => {
  describe("formatIDR", () => {
    it("formats integer amounts in IDR with dot separators", () => {
      expect(formatIDR(1000000)).toBe("Rp 1.000.000");
      expect(formatIDR(50000)).toBe("Rp 50.000");
    });

    it("formats zero correctly", () => {
      expect(formatIDR(0)).toBe("Rp 0");
    });

    it("formats negative amounts", () => {
      const formatted = formatIDR(-25000);
      expect(formatted).toContain("25.000");
    });

    it("handles decimal amounts by rounding to whole rupiah", () => {
      expect(formatIDR(15000.75)).toBe("Rp 15.001");
    });
  });

  describe("formatDate", () => {
    it("formats date strings nicely", () => {
      const d = "2026-09-15T00:00:00.000Z";
      const formatted = formatDate(d);
      expect(formatted).toContain("2026");
    });
  });

  describe("cn", () => {
    it("merges Tailwind classes and resolves conflicts", () => {
      expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
      expect(cn("text-red-500", false && "text-blue-500", "font-bold")).toBe("text-red-500 font-bold");
    });
  });
});
