## Relevant Files

- `docs/prd/babanuj-dashboard.md` - Defines finance requirements, ledger visibility, statuses, and balance rules.
- `docs/testing/babanuj-dashboard-test-plan.md` - Defines invoice, payment, overdue, balance, and permission test scenarios.
- `apps/web/app/(admin)/admin/finance/page.tsx` - Admin finance route for invoice creation, payment entry, filtering, and ledger review.
- `apps/web/app/(admin)/admin/finance/actions.ts` - Server actions for invoice and payment creation.
- `apps/web/app/(customer)/customer/finance/page.tsx` - Customer read-only finance ledger route.
- `apps/web/components/finance/invoice-form.tsx` - Admin form for invoice creation.
- `apps/web/components/finance/payment-form.tsx` - Admin form for payment entry.
- `apps/web/components/finance/ledger-table.tsx` - Shared finance ledger display for invoices and payments.
- `apps/web/lib/finance.ts` - Shared helpers for statuses, totals, and balance calculations.
- `apps/web/lib/convex-server.ts` - Server-side wrappers for finance queries and mutations.
- `convex/financeShared.ts` - Shared finance authorization and balance/status derivation helpers.
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

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/finance-ledger`)
- [x] 1.0 Implement the invoice data model and admin workflow for issuing customer invoices
- [x] 2.0 Implement the payment data model and admin workflow for recording payments against customer balances
- [x] 3.0 Add deterministic status and balance calculations for issued, partially paid, paid, and overdue invoices
- [x] 4.0 Build admin and customer ledger views with correct read and edit permissions
- [x] 5.0 Ensure finance records remain auditable and aligned with the agreed single-currency v1 model
- [x] 6.0 Verify finance behavior against the PRD and test-plan requirements for permissions, calculations, and empty states
