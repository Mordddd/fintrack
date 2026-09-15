import { test, expect } from "@playwright/test";

test.describe("Full End-to-End User Journey & Financial Integrity", () => {
  test.setTimeout(90000);
  const timestamp = Date.now();
  const email = `e2e_journey_${timestamp}@fintrack.app`;
  const password = "SecurePassword123!";
  const userName = `Financial User ${timestamp}`;

  test("completes end-to-end financial operations successfully", async ({ page }) => {
    // 1. Register
    await page.goto("/register");
    await page.fill('input[placeholder="Your name"]', userName);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Automatically redirects to /dashboard
    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");

    // 2. Create Account 1 via UI
    await page.goto("/dashboard/accounts");
    await page.waitForTimeout(1000);
    await page.click("button:has-text('Add Account')");
    await page.waitForSelector("input[placeholder='e.g. BCA Primary, Cash Wallet']", { timeout: 5000 });
    await page.fill('input[placeholder="e.g. BCA Primary, Cash Wallet"]', "BCA Checking");
    await page.fill('input[type="number"]', "5000000");
    await page.click('button[type="submit"]:has-text("Create Account")');
    await page.waitForSelector("text=BCA Checking", { timeout: 10000 });

    // 3. Create Account 2 for Transfers
    await page.click("button:has-text('Add Account')");
    await page.waitForSelector("input[placeholder='e.g. BCA Primary, Cash Wallet']", { timeout: 5000 });
    await page.fill('input[placeholder="e.g. BCA Primary, Cash Wallet"]', "GoPay Wallet");
    await page.fill('input[type="number"]', "500000");
    await page.click('button[type="submit"]:has-text("Create Account")');
    await page.waitForSelector("text=GoPay Wallet", { timeout: 10000 });

    // 4. Add Income Transaction
    await page.goto("/dashboard/transactions");
    await page.waitForTimeout(1000);
    const addTxBtn = page.locator("button:has-text('Add Transaction')").first();
    await addTxBtn.waitFor({ state: "visible" });
    await addTxBtn.click();
    await page.waitForSelector("form", { timeout: 5000 });
    await page.click('form button:has-text("Income")');
    await page.locator("form select").nth(0).selectOption({ index: 1 });
    await page.locator("form select").nth(1).selectOption({ index: 1 });
    await page.fill('input[placeholder="e.g. 50000"]', "10000000");
    await page.fill('input[placeholder="e.g. Lunch, Coffee"]', "Tech Salary");
    await page.click('button[type="submit"]:has-text("Create Transaction")');
    await page.waitForSelector("text=Tech Salary", { timeout: 10000 });

    // 5. Add Expense Transaction
    const addExpenseBtn = page.locator("button:has-text('Add Transaction')").first();
    await addExpenseBtn.waitFor({ state: "visible" });
    await addExpenseBtn.click();
    await page.waitForSelector("form", { timeout: 5000 });
    await page.click('form button:has-text("Expense")');
    await page.locator("form select").nth(0).selectOption({ index: 1 });
    await page.locator("form select").nth(1).selectOption({ index: 1 });
    await page.fill('input[placeholder="e.g. 50000"]', "2500000");
    await page.fill('input[placeholder="e.g. Lunch, Coffee"]', "Apartment Rent");
    await page.click('button[type="submit"]:has-text("Create Transaction")');
    await page.waitForSelector("text=Apartment Rent", { timeout: 10000 });

    // 6. Create Transfer (BCA -> GoPay)
    await page.goto("/dashboard/transfers");
    await page.waitForTimeout(1000);
    await page.click("button:has-text('New Transfer')");
    await page.waitForSelector("form", { timeout: 5000 });
    await page.locator("form select").nth(0).selectOption({ index: 0 });
    await page.locator("form select").nth(1).selectOption({ index: 1 });
    await page.fill('input[placeholder="e.g. 250000"]', "500000");
    await page.fill('input[placeholder="e.g. Savings deposit"]', "Top up GoPay");
    await page.click('button[type="submit"]:has-text("Complete Transfer")');
    await page.waitForSelector("text=Top up GoPay", { timeout: 10000 });

    // 7. Verify Reports: Transfer must NOT be counted in income or expenses!
    await page.goto("/dashboard/reports");
    await page.waitForTimeout(1500);

    // Check income card shows 10,000,000 (not 10.5m)
    const pageContent = await page.content();
    expect(pageContent).toContain("10.000.000");
    expect(pageContent).toContain("2.500.000");
    expect(pageContent).toContain("7.500.000"); // Net savings = 10m - 2.5m

    // 8. Create Budget
    await page.goto("/dashboard/budgets");
    await page.waitForTimeout(1000);
    await page.click("button:has-text('Set Budget')");
    await page.waitForSelector("input[placeholder='500000']", { timeout: 5000 });
    await page.locator("select").first().selectOption({ index: 0 });
    await page.fill("input[placeholder='500000']", "3000000");
    await page.locator(".fixed button:has-text('Set Budget')").click();
    await page.waitForTimeout(1500);

    // 9. Create Savings Goal
    await page.goto("/dashboard/goals");
    await page.waitForTimeout(1000);
    await page.click("button:has-text('New Goal'), button:has-text('Create your first goal')");
    await page.waitForSelector("input[placeholder='e.g. Emergency Fund']", { timeout: 5000 });
    await page.fill("input[placeholder='e.g. Emergency Fund']", "Emergency Fund");
    await page.fill("input[placeholder='50000000']", "50000000");
    await page.click('button:has-text("Create Goal")');
    await page.waitForSelector("text=Emergency Fund", { timeout: 10000 });

    // 10. CSV Import Flow
    await page.goto("/dashboard/transactions/import");
    await page.waitForTimeout(1000);
    const sampleCsv = `Date,Description,Amount,Type
2026-09-01,Groceries Supermarket,150000,EXPENSE
2026-09-02,Client Retainer,3000000,INCOME`;
    await page.setInputFiles('input[type="file"]', {
      name: "transactions.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(sampleCsv),
    });
    await page.waitForSelector("text=Map CSV Columns", { timeout: 5000 });

    // Step 2: Mapping
    await page.click('button:has-text("Validate & Preview")');
    await page.waitForSelector("text=Preview Import Data", { timeout: 5000 });

    // Step 3: Preview & Confirm
    expect(await page.content()).toContain("Groceries Supermarket");
    expect(await page.content()).toContain("Client Retainer");
    await page.click('button:has-text("Confirm & Import")');
    await page.waitForSelector("text=Import Finished!", { timeout: 10000 });

    // 11. Logout
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);
    await page.click('button[aria-label="Sign out"]');
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });
});
