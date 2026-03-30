---
summary: "Product requirements for the Babanuj multi-tenant customer performance and finance dashboard"
read_when:
  - Reviewing product scope, architecture assumptions, and acceptance criteria.
  - Building admin, customer, performance, or finance features for the dashboard.
---

# Babanuj Dashboard PRD

## Overview

Babanuj needs a multi-tenant dashboard product that supports multiple customer workspaces plus a Babanuj admin workspace with visibility across all customers. The first release is manual-entry first, with clean preparation for future API-based ingestion by channel.

The product will run on `Next.js + Vercel + Convex + Better Auth + HeroUI` and use a single currency in v1. Customers are view-only in v1. Babanuj admins manage customer setup, performance data entry, invoice creation, and payment tracking.

## Goals

- Give Babanuj admins one place to manage customer performance and finance data.
- Give each customer a secure dashboard that shows only its own channel performance and finance ledger.
- Support monthly manual data entry in v1 without blocking future API integrations.
- Provide Babanuj leadership with an aggregate performance view across all customers.
- Establish a reusable product contract and implementation roadmap for the dashboard repo.

## Non-Goals

- Daily or weekly reporting in v1.
- Customer-side editing of metrics or finance records in v1.
- Live marketplace or commerce integrations in v1.
- Multi-currency reporting or FX conversion in v1.
- Babanuj internal operations reporting beyond customer sales rollups in v1.

## Users

### Babanuj Platform Admin

- Creates and manages customer workspaces.
- Invites customer users.
- Enters or updates monthly channel metrics.
- Creates invoices and records payments.
- Reviews aggregate performance across all customers.

### Customer Viewer

- Signs into a customer-specific workspace.
- Views monthly channel performance for that customer only.
- Views invoice history, payment history, status, and current balance.
- Cannot edit data.

## Product Scope

### 1. Multi-Tenant Access and Roles

The product uses app-owned customer access controls:

- `platform_admin`: Babanuj staff with access to all customer data and all admin features.
- `customer_viewer`: Customer user with read-only access to one customer workspace.

Better Auth manages sign-in, sessions, and JWT issuance. Convex enforces customer-scoped data access on the server side, and the app stores the active customer selection as an application concern instead of an auth-provider organization.

### 2. Customer Management

Babanuj admins can:

- Create a customer record.
- Map signed-up Better Auth users to that customer by email.
- Assign the active sales channels for that customer.
- Maintain basic customer metadata for reporting and finance.

### 3. Performance Reporting

The dashboard supports monthly reporting by channel. V1 channels are:

- `Website`
- `B2B`
- `Amazon`
- `TikTok`
- `Etsy`
- `Walmart`
- `Temu`

Babanuj admins manually enter monthly metrics by:

- Customer
- Reporting period
- Channel

The metric model supports v1 sales reporting and future integration expansion. At minimum, each channel record supports:

- Gross revenue
- Order count
- Average order value
- Period-over-period growth indicator or derived growth-friendly fields
- Record source (`manual` or `integration`)
- Optional source reference for future API sync metadata

### 4. Admin Dashboard

The Babanuj admin dashboard shows:

- Aggregate performance across all customers by month
- Aggregate performance by channel
- Customer-level drill-down entry points
- High-level finance summary entry points

This dashboard is the Babanuj view of the overall book of business. It is not a separate internal KPI framework in v1.

### 5. Customer Dashboard

Each customer dashboard shows:

- That customer’s monthly performance only
- Channel-by-channel revenue and order performance
- Trend views across periods
- Customer-specific finance summary and ledger

Customers cannot see data from other customers and cannot edit records.

### 6. Finance Ledger

Each customer has a finance area where Babanuj admins manage:

- Invoices issued to the customer
- Payments collected by Babanuj from the customer
- Due dates
- Statuses
- Outstanding balances

The product computes:

- Invoice-level paid amount
- Invoice-level outstanding amount
- Customer-level current balance

The finance section supports partial payments in v1. Customers can view the full ledger, but only admins can create or edit invoices and payments.

## Technical Assumptions

- Frontend framework: `Next.js`
- Hosting: `Vercel`
- Data layer and server functions: `Convex`
- Auth: `Better Auth`
- Component system: `HeroUI`
- Theme: provided HeroUI token set with `Bricolage Grotesque`
- Currency model: single base currency in v1
- Reporting grain: monthly only in v1
- Data source strategy: manual-first with future integration-ready record metadata

## Initial Product Contract

### Types

- `Customer`
- `CustomerMembership`
- `ReportingPeriod`
- `ChannelMetric`
- `Invoice`
- `Payment`
- `BalanceSnapshot`

### Enums and Value Surfaces

- `Role = platform_admin | customer_viewer`
- `Channel = Website | B2B | Amazon | TikTok | Etsy | Walmart | Temu`
- `RecordSource = manual | integration`
- `InvoiceStatus = draft | issued | partially_paid | paid | overdue`

## Feature Acceptance Criteria

### Multi-Tenant Foundation

- Admin users can access admin routes and customer routes as needed.
- Customer users can access only their own customer workspace routes.
- Unauthorized cross-customer data access is blocked in both UI and server functions.

### Customer Management

- Admin can create a customer and manage it without any external auth-organization mapping.
- Admin can assign supported channels to a customer.
- Admin can map signed-up Better Auth users to the correct customer by email.
- Customer records can be updated without breaking historical metrics or finance records.

### Performance Data Entry

- Admin can create one monthly record per customer, channel, and period.
- Admin can update an existing manual record if a correction is needed.
- Performance records clearly track whether they are manual or integration sourced.
- Admin dashboard shows aggregate rollups across customers.
- Customer dashboard shows only customer-scoped performance.

### Finance Ledger

- Admin can create an invoice with customer, amount, issue date, due date, and status.
- Admin can record a payment against one or more invoices as defined by implementation.
- Partial payments reduce the outstanding balance correctly.
- Fully paid invoices move to `paid`.
- Overdue invoices move to `overdue` based on due date and outstanding amount.
- Customer view displays invoice history, payment history, statuses, and current balance.

### Documentation and Delivery

- The repo contains this PRD, a full test-plan document, and implementation task files.
- Task files remain parent-task only until the user explicitly asks for sub-tasks.

## Risks and Design Constraints

- Manual data entry can become error-prone without validation and update semantics.
- Multi-tenant security must be enforced at the data function layer, not only in the UI.
- Finance calculations must remain auditable and deterministic from underlying invoice and payment records.
- Future API integrations should extend the data model instead of replacing manual-entry records.

## Phased Delivery

### Phase 1

- Documentation
- Auth and tenancy foundation
- HeroUI app shell and theme
- Core Convex schema and queries/mutations

### Phase 2

- Customer management
- Monthly performance entry and dashboards
- Finance ledger and balances

### Phase 3

- Hardening, QA, documentation refinements
- Integration-ready adapter boundaries for future data sync
