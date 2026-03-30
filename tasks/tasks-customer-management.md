## Relevant Files

- `docs/prd/babanuj-dashboard.md` - Defines customer management scope, roles, and acceptance criteria.
- `docs/testing/babanuj-dashboard-test-plan.md` - Defines customer creation, invitation, permission, and regression scenarios.
- `apps/web/app/(admin)/customers/page.tsx` - Likely admin customer list and entry point for management workflows.
- `apps/web/app/(admin)/customers/[customerId]/page.tsx` - Likely customer detail page for edits, assignments, and memberships.
- `apps/web/components/customers/customer-form.tsx` - Likely reusable customer create/edit form component.
- `apps/web/components/customers/channel-assignment.tsx` - Likely UI for assigning active channels to a customer.
- `apps/web/lib/customers.ts` - Shared customer transformation and UI-facing helpers.
- `convex/customers.ts` - Convex queries and mutations for customer CRUD and channel assignment.
- `convex/memberships.ts` - Convex queries and mutations for membership linkage and org-scoped access.

### Notes

- Keep customer history stable when editing metadata so reporting and finance records stay intact.
- Use the fixed v1 channels from the PRD unless the product contract is revised later.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.0 Read file` -> `- [x] 1.0 Read file` (after completing)

Update the file after completing each task, not just after completing an entire section.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/customer-management`)
- [ ] 1.0 Build the admin workflow for creating and maintaining customer records
- [ ] 2.0 Implement channel assignment for each customer using the fixed v1 channel list
- [ ] 3.0 Connect customer records to organization membership and customer-user invitation flows
- [ ] 4.0 Add admin-facing customer detail views for metadata updates and membership visibility
- [ ] 5.0 Enforce read-only restrictions for customer users across all customer-management surfaces
- [ ] 6.0 Validate customer-management behavior against the PRD and test-plan requirements
