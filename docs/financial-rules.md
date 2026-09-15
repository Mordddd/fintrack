# FinTrack Financial Rules & Calculation Specification

This document defines the authoritative financial calculation rules, precision standards, and invariant constraints enforced across the FinTrack platform.

---

## 1. Monetary Representation & Precision

1. **Decimal Precision**:
   - All monetary balances, amounts, limits, and contributions are stored in PostgreSQL using `DECIMAL(18, 2)` to eliminate IEEE 754 floating-point rounding errors.
   - In NestJS backend services, calculations utilize Prisma's Decimal type (`Prisma.Decimal`).
   - Currency display in the frontend is localized to Indonesian Rupiah (`IDR`) with standard thousands dot separators (`Rp 1.000.000`), while maintaining full decimal precision in the database.

2. **Negative & Zero Balances**:
   - Transaction amounts must be strictly positive (`amount > 0`).
   - Transaction polarity is governed by `TransactionType` (`INCOME` vs. `EXPENSE`), not by signed numbers.
   - Account balances may be negative for liability/credit accounts (`CREDIT_CARD`) or when an overdraft occurs.

---

## 2. Invariant Rules for Transfers

1. **Neutrality to Income & Expense**:
   - A `TRANSFER` is a reallocation of funds between two accounts belonging to the same user.
   - **Rule**: Transfers **MUST NEVER** be counted as Income or Expense in financial summaries, dashboards, analytics, or reports.
   - **Rule**: Transfers **MUST NOT** inflate Net Savings.

2. **Account Balances**:
   - Executing a transfer atomically decrements the source account balance (`fromAccount.currentBalance -= amount`) and increments the destination account balance (`toAccount.currentBalance += amount`).
   - Source account and destination account cannot be identical (`fromAccountId !== toAccountId`).

3. **Exclusion from Category Budgets**:
   - Transfers cannot be assigned expense categories and do not count toward category budget limits.

---

## 3. Financial Metrics Calculations

### 3.1 Total Income
$$\text{Total Income} = \sum \text{amount} \quad \text{where } \text{type} = \text{INCOME}$$
*(Transfers excluded)*

### 3.2 Total Expense
$$\text{Total Expense} = \sum \text{amount} \quad \text{where } \text{type} = \text{EXPENSE}$$
*(Transfers excluded)*

### 3.3 Net Savings
$$\text{Net Savings} = \text{Total Income} - \text{Total Expense}$$
*(Transfers excluded)*

### 3.4 Savings Rate
$$\text{Savings Rate} = \begin{cases} 
\max\left(0, \frac{\text{Net Savings}}{\text{Total Income}} \times 100\right), & \text{if Total Income} > 0 \\
0\%, & \text{if Total Income} \le 0 
\end{cases}$$

---

## 4. Budgets & Spending Analysis

1. **Monthly Scoping**:
   - Budgets are scoped to a specific month (`1..12`) and year (`e.g., 2026`).
   - Spending is aggregated from all `EXPENSE` transactions within `[startOfMonth, startOfNextMonth)`.
2. **Budget Status Hierarchy**:
   - **ON_TRACK**: Spending $< 80\%$ of budget limit.
   - **WARNING**: Spending $\ge 80\%$ and $\le 100\%$ of budget limit.
   - **EXCEEDED**: Spending $> 100\%$ of budget limit.

---

## 5. Savings Goals

1. **Contributions**:
   - Depositing funds into a savings goal tracks target progress (`currentAmount += depositAmount`).
2. **Target Completion**:
   - When `currentAmount >= targetAmount`, the goal status transitions to `REACHED`.

---

## 6. Security & Multi-Tenant Isolation

1. **User Scoping**:
   - Every read, update, delete, and aggregation query must be scoped by the authenticated user's `userId`.
   - The API must **never** trust a `userId` supplied in the request body or query params.
2. **Resource Ownership Validation**:
   - When creating transactions or transfers, the backend verifies that both `accountId` and `categoryId` belong to the authenticated user.
   - Cross-user operations immediately fail with `403 Forbidden` or `404 Not Found`.

---

## 7. Audit & Activity Logging

1. **Financial Mutation Auditing**:
   - Every creation, update, and deletion of an Account, Transaction, Transfer, Budget, or Savings Goal is recorded in the `ActivityLog` table.
   - Log entries record `action`, `entityType`, `entityId`, timestamp, and metadata snapshot for traceability.
