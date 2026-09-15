import { test, expect } from "@playwright/test";

test.describe("Currency Preference Switch", () => {
  test("updates currency from IDR to EUR and reflects on Dashboard", async ({ page }) => {
    const timestamp = Date.now();
    const email = `currency_${timestamp}@test.com`;

    // 1. Register
    await page.goto("/register");
    await page.fill('input[type="text"]', "Currency User");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 15000 });

    // 2. Initial currency check on Dashboard (IDR -> "Rp")
    await expect(page.locator("body")).toContainText("Rp");

    // 3. Go to Settings
    await page.goto("/dashboard/settings");
    await page.waitForSelector("text=Primary Currency", { timeout: 5000 });

    // 4. Select EUR
    await page.locator("select").first().selectOption("EUR");
    await page.click('button:has-text("Save Changes")');
    await page.waitForSelector("text=Profile updated successfully", { timeout: 5000 });

    // 5. Navigate back to Dashboard
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);

    // 6. Verify Euro currency symbol is now active
    await expect(page.locator("body")).toContainText("€");
  });
});
