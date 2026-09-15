import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "1920x1080 (FHD Desktop)", width: 1920, height: 1080 },
  { name: "1536x864 (Standard Laptop)", width: 1536, height: 864 },
  { name: "1440x900 (MacBook Pro)", width: 1440, height: 900 },
  { name: "1366x768 (Compact Laptop)", width: 1366, height: 768 },
  { name: "1280x720 (HD Desktop)", width: 1280, height: 720 },
  { name: "1024x768 (iPad Landscape / Small Desktop)", width: 1024, height: 768 },
  { name: "768x1024 (iPad Portrait Tablet)", width: 768, height: 1024 },
  { name: "390x844 (iPhone 14 / Mobile)", width: 390, height: 844 },
  { name: "375x812 (iPhone Mini / Compact Mobile)", width: 375, height: 812 },
];

test.describe("Phase A: Responsive Layout & No Horizontal Overflow Smoke Tests", () => {
  for (const vp of VIEWPORTS) {
    test(`login page has no horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/login");
      await page.waitForSelector("form");

      // Verify page body does not exceed viewport width
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalOverflow).toBe(false);
    });

    test(`register page has no horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/register");
      await page.waitForSelector("form");

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalOverflow).toBe(false);
    });
  }
});
