## Relevant Files

- `docs/prd/babanuj-dashboard.md` - Defines customer management scope, roles, and acceptance criteria.
- `docs/testing/babanuj-dashboard-test-plan.md` - Defines customer creation, invitation, permission, and regression scenarios.
- `apps/web/app/(admin)/admin/customers/page.tsx` - Admin customer list, create flow, and customer-management overview.
- `apps/web/app/(admin)/admin/customers/[customerId]/page.tsx` - Admin customer detail page for metadata edits and membership mapping.
- `apps/web/app/(admin)/admin/customers/actions.ts` - Server actions for customer creation, update, and membership mapping.
- `apps/web/components/customers/customer-form.tsx` - Reusable server form for customer create and edit workflows.
- `apps/web/components/customers/channel-assignment.tsx` - Shared channel checkbox grid for customer assignment.
- `apps/web/lib/customers.ts` - Customer types, channel constants, slug generation, and form parsing helpers.
- `apps/web/lib/convex-server.ts` - Server-side Convex query/mutation wrappers using Better Auth-issued tokens.
- `apps/web/app/(admin)/admin/layout.tsx` - Admin navigation shell updated with customer-management entrypoints.
- `apps/web/app/globals.css` - Shared form, list, and customer-management layout styles.
- `convex/customers.ts` - Convex queries and mutations for customer CRUD and access control.
- `convex/memberships.ts` - Convex queries and mutations for membership linkage and admin visibility.
- `convex/auth.ts` - Convex bootstrap-safe admin membership guard.
- `convex/_generated/api.d.ts` - Generated Convex API types now available after CLI initialization.
- `convex/_generated/server.d.ts` - Generated Convex server helpers for future deeper integration.

### Notes

- Customer creation now bootstraps the creating admin as a `platform_admin` membership for that customer so the first customer can be created successfully.
- Membership mapping now uses Better Auth user email lookup, and customer invites can bootstrap new users into the correct workspace without a mail provider dependency.
- The admin pages use server-rendered Convex calls, so they compile and fit the current architecture without waiting for client-side Convex hooks.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Add page` -> `- [x] 1.1 Add page` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Continue customer-management work on the active implementation branch (`codex/finance-ledger`)
- [x] 1.0 Build the admin workflow for creating and maintaining customer records
  - [x] 1.1 Add an admin customers index page with customer creation and existing-customer listing.
  - [x] 1.2 Add server actions to create customers and revalidate the admin routes after writes.
  - [x] 1.3 Add shared customer form helpers for name, slug, currency, and status fields.
- [x] 2.0 Implement channel assignment for each customer using the fixed v1 channel list
  - [x] 2.1 Add a shared channel assignment component using the agreed Babanuj channel contract.
  - [x] 2.2 Persist selected channels in customer create and update mutations.
  - [x] 2.3 Surface assigned channels through the customer-management pages and Convex customer records.
- [x] 3.0 Connect customer records to customer membership and customer-user access flows
  - [x] 3.1 Add membership upsert support so admins can map Better Auth users to customers with `customer_viewer` or `platform_admin`.
  - [x] 3.2 Add customer-detail visibility for existing memberships on a customer.
  - [x] 3.3 Add live invite or email-delivery flow once the preferred onboarding workflow is finalized.
- [x] 4.0 Add admin-facing customer detail views for metadata updates and membership visibility
  - [x] 4.1 Add a customer detail route for editing metadata and active channels.
  - [x] 4.2 Add a membership management form on the customer detail route.
  - [x] 4.3 Update admin navigation to expose the customer-management workflow.
- [x] 5.0 Enforce read-only restrictions for customer users across all customer-management surfaces
  - [x] 5.1 Keep customer-management routes under the admin route group only.
  - [x] 5.2 Require server-side admin access before rendering customer-management pages or running mutations.
  - [x] 5.3 Preserve the customer workspace as read-only by keeping management workflows out of customer routes.
- [x] 6.0 Validate customer-management behavior against the PRD and test-plan requirements
  - [x] 6.1 Run `npm run build` after adding the customer pages and Convex server wrappers.
  - [x] 6.2 Run `npm run docs:list` to confirm documentation metadata remains valid.
  - [x] 6.3 Run `npm test` to confirm the existing workspace tests still pass.
  - [x] 6.4 Record the remaining dependency on production Better Auth runtime configuration.
