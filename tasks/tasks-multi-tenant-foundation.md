## Relevant Files

- `docs/prd/babanuj-dashboard.md` - Primary product requirements and agreed scope for the dashboard foundation.
- `docs/testing/babanuj-dashboard-test-plan.md` - Test scenarios that define expected auth, tenancy, and role behavior.
- `.env.example` - Required Clerk and Convex environment variables for the foundation setup.
- `apps/web/app/layout.tsx` - Root app layout with the shared provider wrapper and Babanuj metadata.
- `apps/web/app/providers.tsx` - Client-side provider composition for Clerk, Convex, and theme handling.
- `apps/web/app/globals.css` - HeroUI style import plus the agreed token-based visual foundation.
- `apps/web/postcss.config.mjs` - Tailwind CSS v4 PostCSS integration required by HeroUI.
- `apps/web/components/dashboard-shell.tsx` - Shared shell used by protected admin and customer areas.
- `apps/web/components/session-controls.tsx` - Shared Clerk session controls and organization switcher.
- `apps/web/lib/auth.ts` - Server-side app-role resolution and route guard helpers.
- `apps/web/middleware.ts` - Clerk route protection for admin, customer, and organization-selection routes.
- `apps/web/app/(admin)/admin/layout.tsx` - Admin route-group layout and navigation shell.
- `apps/web/app/(admin)/admin/page.tsx` - Admin foundation landing page showing role, env, and channel setup state.
- `apps/web/app/(customer)/customer/layout.tsx` - Customer route-group layout and scoped navigation shell.
- `apps/web/app/(customer)/customer/page.tsx` - Customer-facing foundation landing page for org-scoped access.
- `apps/web/app/sign-in/[[...sign-in]]/page.tsx` - Clerk sign-in entrypoint.
- `apps/web/app/sign-up/[[...sign-up]]/page.tsx` - Clerk sign-up entrypoint.
- `apps/web/app/select-org/page.tsx` - Organization selection page for customer viewers.
- `apps/web/app/unauthorized/page.tsx` - Unauthorized fallback page for failed role checks.
- `convex/auth.config.ts` - Convex auth provider configuration for Clerk JWT validation.
- `convex/schema.ts` - Convex schema for customers and customer memberships.
- `convex/auth.ts` - Convex identity and membership guard helpers.
- `convex/customers.ts` - Convex customer access queries and admin-only customer creation mutation.
- `convex/memberships.ts` - Convex membership upsert mutation for tenant mapping.
- `convex/tsconfig.json` - Convex TypeScript project config created during scaffold setup.

### Notes

- HeroUI v3 in this repo uses the current `CardContent`, `Chip`, and `Button` prop surface, not the older `CardBody`, `flat`, or `as` patterns.
- Convex code generation is not complete yet because `CONVEX_DEPLOYMENT` is not configured. The schema and generic server builders are scaffolded so the repo still builds before deployment wiring is finished.
- `apps/web/middleware.ts` builds successfully on Next.js 16, but Next currently emits a deprecation warning recommending `proxy.ts` in the future.
- Unit and integration tests for the web app are not configured yet, so validation in this slice is based on `npm run docs:list`, `npm run build`, and `npm test` for the existing package workspace.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Install dependency` -> `- [x] 1.1 Install dependency` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (`git checkout -b codex/multi-tenant-foundation`)
- [x] 1.0 Set up the shared dashboard foundation using Next.js, Vercel, Convex, Clerk, and HeroUI
  - [x] 1.1 Seed `babanuj-dashboard` from `PI-Starter` and keep the PRD and task docs in place.
  - [x] 1.2 Install the current Convex, Clerk, HeroUI, Tailwind CSS v4, `next-themes`, and animation dependencies.
  - [x] 1.3 Add `.env.example` so the repo documents the minimum Clerk and Convex variables required for the foundation.
  - [x] 1.4 Create the shared app provider layer for Clerk, optional Convex client wiring, and theme handling.
- [x] 2.0 Implement organization-aware authentication and role resolution for `platform_admin` and `customer_viewer`
  - [x] 2.1 Add server-side auth helpers that resolve `publicMetadata.appRole` and the active Clerk organization.
  - [x] 2.2 Add Clerk sign-in and sign-up routes for App Router entrypoints.
  - [x] 2.3 Add shared session controls with user access, sign-in/up actions, and organization switching for customer views.
  - [x] 2.4 Protect signed-in routes through Clerk middleware before server-side role checks run.
- [x] 3.0 Add protected admin and customer route groups with correct redirects and guardrails
  - [x] 3.1 Create an admin route group that requires `platform_admin` and surfaces current setup state.
  - [x] 3.2 Create a customer route group that requires an active organization and allows customer-viewer access.
  - [x] 3.3 Add explicit `/select-org` and `/unauthorized` fallback routes for incomplete access state.
  - [x] 3.4 Add a reusable dashboard shell so admin and customer areas share consistent navigation and session controls.
- [x] 4.0 Apply the agreed HeroUI theme foundation, including the provided token set and primary font configuration
  - [x] 4.1 Add Tailwind CSS v4 PostCSS wiring required by HeroUI.
  - [x] 4.2 Replace the starter fonts with `Bricolage Grotesque` and apply the agreed theme token set in global CSS.
  - [x] 4.3 Update the landing page and protected shell surfaces to use the new Babanuj visual language and current HeroUI component APIs.
- [x] 5.0 Establish the initial data model and server-side tenancy boundaries for customers and memberships
  - [x] 5.1 Add Convex auth configuration for Clerk-issued JWT validation.
  - [x] 5.2 Add Convex schema tables for `customers` and `customerMemberships` with tenant-oriented indexes.
  - [x] 5.3 Add shared Convex auth helpers for authenticated viewer and platform-admin membership checks.
  - [x] 5.4 Add customer access queries and membership upsert scaffolding using generic Convex server builders so the repo compiles before codegen is connected.
- [x] 6.0 Verify the foundation against the PRD and test-plan expectations for auth, tenancy, and route protection
  - [x] 6.1 Run `npm run docs:list` to confirm docs metadata remains valid after adding foundation docs and references.
  - [x] 6.2 Run `npm run build` to confirm the protected routes, provider stack, and theme foundation compile successfully.
  - [x] 6.3 Run `npm test` to confirm the existing workspace test suite still passes after the foundation changes.
  - [x] 6.4 Record the remaining operational requirement: connect a real Convex deployment and Clerk app before end-to-end auth and data flows can run outside build-time validation.
