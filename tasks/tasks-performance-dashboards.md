## Relevant Files

- `docs/prd/babanuj-dashboard.md` - Defines the performance model, channels, monthly reporting grain, and dashboard behavior.
- `docs/testing/babanuj-dashboard-test-plan.md` - Defines metric-entry, aggregate-dashboard, customer-dashboard, and permission test scenarios.
- `apps/web/app/(admin)/dashboard/page.tsx` - Likely Babanuj aggregate dashboard route.
- `apps/web/app/(customer)/dashboard/page.tsx` - Likely customer-facing dashboard route.
- `apps/web/app/(admin)/performance/page.tsx` - Likely admin metric-entry and reporting management page.
- `apps/web/components/performance/metric-entry-form.tsx` - Likely monthly metric entry form.
- `apps/web/components/performance/channel-performance-grid.tsx` - Likely shared channel summary UI.
- `apps/web/components/performance/performance-chart.tsx` - Likely shared trend visualization component.
- `apps/web/lib/performance.ts` - Shared calculations for totals, AOV, and trend preparation.
- `convex/reportingPeriods.ts` - Convex queries and mutations for reporting period management.
- `convex/channelMetrics.ts` - Convex queries and mutations for channel metric CRUD and aggregation.

### Notes

- The v1 reporting grain is monthly only.
- Data entry is admin-only, and customer users can only view customer-scoped results.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.0 Read file` -> `- [x] 1.0 Read file` (after completing)

Update the file after completing each task, not just after completing an entire section.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/performance-dashboards`)
- [x] 1.0 Implement the monthly performance data model and admin entry workflow for customer-channel metrics
- [x] 2.0 Build the Babanuj aggregate dashboard with cross-customer rollups by period and channel
- [x] 3.0 Build the customer dashboard with customer-scoped monthly performance views
- [x] 4.0 Add shared calculations and presentation logic for revenue, orders, AOV, and trends
- [x] 5.0 Preserve `manual` versus `integration` source metadata to keep the reporting model integration-ready
- [x] 6.0 Verify dashboard behavior against the PRD and test-plan requirements for scope, totals, and access control
