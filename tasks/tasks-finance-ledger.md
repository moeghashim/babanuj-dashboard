## Relevant Files

- `docs/prd/babanuj-dashboard.md` - Defines finance requirements, ledger visibility, statuses, and balance rules.
- `docs/testing/babanuj-dashboard-test-plan.md` - Defines invoice, payment, overdue, balance, and permission test scenarios.
- `apps/web/app/(admin)/finance/page.tsx` - Likely admin finance management route.
- `apps/web/app/(customer)/finance/page.tsx` - Likely customer read-only finance ledger route.
- `apps/web/components/finance/invoice-form.tsx` - Likely admin form for invoice creation and edits.
- `apps/web/components/finance/payment-form.tsx` - Likely admin form for payment entry.
- `apps/web/components/finance/ledger-table.tsx` - Likely shared finance ledger display.
- `apps/web/lib/finance.ts` - Shared helpers for statuses, totals, and balance calculations.
- `convex/invoices.ts` - Convex queries and mutations for invoice lifecycle management.
- `convex/payments.ts` - Convex queries and mutations for payment recording and ledger reads.

### Notes

- V1 uses a single currency.
- Customers can view the full finance ledger but cannot edit finance records.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.0 Read file` -> `- [x] 1.0 Read file` (after completing)

Update the file after completing each task, not just after completing an entire section.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/finance-ledger`)
- [ ] 1.0 Implement the invoice data model and admin workflow for issuing customer invoices
- [ ] 2.0 Implement the payment data model and admin workflow for recording payments against customer balances
- [ ] 3.0 Add deterministic status and balance calculations for issued, partially paid, paid, and overdue invoices
- [ ] 4.0 Build admin and customer ledger views with correct read and edit permissions
- [ ] 5.0 Ensure finance records remain auditable and aligned with the agreed single-currency v1 model
- [ ] 6.0 Verify finance behavior against the PRD and test-plan requirements for permissions, calculations, and empty states
