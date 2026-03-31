---
summary: "Feature-by-feature test plan for the Babanuj dashboard v1 release"
read_when:
  - Implementing or validating auth, dashboard, finance, or customer-management workflows.
  - Checking acceptance criteria and regression coverage before shipping changes.
---

# Babanuj Dashboard Test Plan

## Overview

This document defines the v1 test matrix for the Babanuj dashboard. It covers happy paths, authorization, validation, calculations, empty states, and regression scenarios for each agreed feature area.

## Test Strategy

- Prefer server-side authorization tests for customer isolation.
- Cover Convex query and mutation behavior for finance and performance logic.
- Cover UI role behavior for admin and customer users.
- Verify calculations for balances, partial payments, and aggregate rollups.
- Validate empty and first-run states because the product is manual-entry first.

## Global Test Data

Use repeatable seed scenarios with:

- Two customers with different active channels
- One Babanuj admin user
- One customer viewer per customer
- At least two reporting periods
- Mix of complete, partial, and empty finance states

## Feature Matrix

### 1. Multi-Tenant Access and Roles

#### Happy Path

- Admin can sign in and reach the admin dashboard.
- Admin can navigate from aggregate views to customer detail views.
- Customer viewer can sign in and reach only the assigned customer workspace.

#### Permissions

- Customer viewer cannot access admin routes directly.
- Customer viewer cannot fetch another customer’s metrics by manipulating URL or request params.
- Customer viewer cannot fetch another customer’s invoice or payment data.
- Admin can access all customers without switching application context incorrectly.

#### Validation and Edge Cases

- Missing customer membership or missing selected customer redirects or blocks access cleanly.
- Suspended or removed membership loses access immediately.
- Unknown route access resolves to safe unauthorized or not-found behavior.

#### Regression Checks

- Role changes do not break navigation visibility.
- Server-side auth checks still hold if UI guards regress.

### 2. Customer Management

#### Happy Path

- Admin creates a new customer successfully.
- Admin assigns active channels to the customer.
- Admin creates a customer invite for an email and role.
- Invited user signs up or signs in with the invited email and receives the correct customer membership automatically.
- Admin maps an existing Better Auth user to the customer by email.
- The mapped user sees only the new customer workspace after login.

#### Permissions

- Customer viewers cannot create or edit customer records.
- Customer viewers cannot invite users.

#### Validation and Edge Cases

- Duplicate customer names are handled according to implementation rules.
- Invalid or unsupported channel assignment is rejected.
- Expired or already accepted invite links cannot be reused.
- Invite acceptance fails cleanly when the signed-in email does not match the invited email.
- Removing a channel does not corrupt existing historical performance data.

#### Regression Checks

- Updating customer metadata does not break reporting or finance joins.
- Existing memberships remain valid after customer metadata edits.
- Invite creation and acceptance do not remove existing memberships for other customers.

### 3. Monthly Performance Data Entry

#### Happy Path

- Admin creates a monthly metric record for a customer and channel.
- Admin updates a previously entered monthly metric record.
- Customer dashboard reflects the saved record correctly.
- Admin dashboard aggregate totals include the saved record correctly.

#### Permissions

- Customer viewers cannot create or edit monthly metric records.
- Customer viewers cannot access metrics for other customers.

#### Validation and Edge Cases

- Required fields such as customer, period, channel, revenue, and order count are enforced.
- Negative values are rejected unless explicitly supported by implementation.
- Duplicate period-plus-channel records are prevented or resolved via update semantics.
- Empty period views show clear no-data states.

#### Calculations

- AOV is derived correctly from revenue and orders when calculated.
- Aggregate channel totals across customers are correct.
- Month-over-month trend calculations use the correct prior period.

#### Regression Checks

- Editing one customer’s metrics does not change another customer’s aggregates.
- Manual records remain labeled as `manual`.

### 4. Admin Aggregate Dashboard

#### Happy Path

- Admin sees total revenue across all customers for the selected period.
- Admin sees revenue and order breakdown by channel.
- Admin can drill into a customer from the aggregate view.

#### Permissions

- Customer viewers cannot reach aggregate views.

#### Validation and Edge Cases

- No-data states render correctly when no customer metrics exist.
- Mixed channel coverage across customers still produces correct totals.

#### Regression Checks

- Aggregate values remain correct after customer updates and record edits.

### 5. Customer Dashboard

#### Happy Path

- Customer viewer sees only customer-scoped performance cards and charts.
- Customer viewer can move between available periods.
- Customer viewer can open the finance section from the dashboard context.

#### Permissions

- Customer viewer cannot access admin editing controls.
- Customer viewer cannot see another customer in menus, filters, or responses.

#### Validation and Edge Cases

- Dashboard renders correctly for a customer with no metrics yet.
- Channel sections handle missing channels gracefully.

#### Regression Checks

- Adding new metrics updates the customer dashboard without exposing cross-customer data.

### 6. Finance Ledger

#### Happy Path

- Admin creates an invoice with amount, issue date, due date, and customer.
- Admin records a full payment and the invoice reaches `paid`.
- Admin records a partial payment and the outstanding amount updates correctly.
- Customer sees invoice history, payment history, and current balance.

#### Permissions

- Customer viewers cannot create, edit, or delete invoices.
- Customer viewers cannot create, edit, or delete payments.
- Customer viewers can read only their own finance ledger.

#### Validation and Edge Cases

- Missing required invoice fields are rejected.
- Invalid payment amounts are rejected.
- Payment greater than allowed outstanding amount is rejected or handled according to implementation rules.
- Invoice without payment becomes `overdue` after due date when outstanding remains.
- Customer with no invoices sees a clear empty ledger state.

#### Calculations

- Invoice paid amount equals the sum of its linked payments.
- Invoice outstanding amount equals invoice amount minus paid amount.
- Customer balance equals total invoiced minus total paid.
- Status transitions between `issued`, `partially_paid`, `paid`, and `overdue` are correct.

#### Regression Checks

- Updating unrelated invoices does not affect existing balances.
- Payment edits or deletes, if later supported, do not corrupt historic totals.

### 7. Documentation and Delivery

#### Happy Path

- PRD is present and matches agreed scope.
- Test plan is present and covers all shipped features.
- Task files are present in `tasks/` and follow the agreed format.

#### Validation and Edge Cases

- Task files contain only parent tasks except for the required `0.1` branch step.
- Task files instruct implementers to wait for `Go` before sub-task expansion.

#### Regression Checks

- Documentation updates stay aligned with the latest agreed scope.

## Exit Criteria

The v1 implementation is considered feature-complete only when:

- Auth and data isolation work correctly.
- Admin workflows for customer creation, metric entry, and finance entry work correctly.
- Customer dashboards are read-only and customer-scoped.
- Balance and invoice calculations are correct.
- Docs and parent-task files are complete and committed.
