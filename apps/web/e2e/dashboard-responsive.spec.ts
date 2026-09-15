import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "1920x1080 (FHD)", width: 1920, height: 1080 },
  { name: "1440x900 (MacBook)", width: 1440, height: 900 },
  { name: "1366x768 (Laptop)", width: 1366, height: 768 },
  { name: "1280x720 (HD)", width: 1280, height: 720 },
  { name: "1024x768 (Tablet Landscape)", width: 1024, height: 768 },
  { name: "768x1024 (Tablet Portrait)", width: 768, height: 1024 },
  { name: "390x844 (Mobile)", width: 390, height: 844 },
];

test.describe("Phase A: Dashboard AppShell Responsive & Horizontal Overflow Verification", () => {
  const testEmail = `responsive_${Date.now()}@fintrack.app`;
  const testPassword = "Password123!";

  test.beforeAll(async ({ request }) => {
    // Register test user via API
    await request.post("http://localhost:3001/api/v1/auth/register", {
      data: {
        name: "Responsive Test User",
        email: testEmail,
        password: testPassword,
      },
    });
  });

  for (const vp of VIEWPORTS) {
    test(`dashboard shell has no horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Log in
      await page.goto("/login");
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');

      // Wait for dashboard redirect
      await page.waitForURL("**/dashboard**");
      await page.waitForTimeout(500);

      // Verify no horizontal overflow on /dashboard
      const overflowDashboard = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflowDashboard).toBe(false);

      // Verify no horizontal overflow on /dashboard/reports
      await page.goto("/dashboard/reports");
      await page.waitForTimeout(500);
      const overflowReports = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflowReports).toBe(false);

      // Verify no horizontal overflow on /dashboard/transactions/import
      await page.goto("/dashboard/transactions/import");
      await page.waitForTimeout(500);
      const overflowImport = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflowImport).toBe(false);
    });
  }
});
