# babanuj-dashboard

Babanuj's multi-tenant dashboard repo, seeded from `PI-Starter` and extended with product planning docs for customer performance reporting and finance workflows.

Current repo focus:
- Vercel-ready Next.js app in `apps/web`
- Shared package workspace in `packages/core`
- Product requirements in `docs/prd/`
- Feature test plan in `docs/testing/`
- Parent-only implementation task files in `tasks/`
- ESM TypeScript, Biome, and strict TypeScript checks from the starter

## Product Direction

- Babanuj admins manage all customers from one workspace.
- Customer users are view-only and can access only their own customer workspace.
- V1 reporting is monthly by channel.
- V1 finance supports invoices, payments, and computed balances in a single currency.
- Data entry is manual first, with future API ingestion planned.

See [docs/prd/babanuj-dashboard.md](docs/prd/babanuj-dashboard.md) for the full product contract.

## Setup

```bash
npm run doctor
npm install
npm run docs:list
npm run build
```

If you switch between `arm64` and `x64`, or between Rosetta and native Node, run `npm run reinstall:clean` to refresh native dependencies.

## Start The App

`apps/web` is the default app target. Vercel should use `apps/web` as the root directory. No custom `vercel.json` is required for the starter.

```bash
npm run dev -w @babanuj-dashboard/web
```

See `docs/deploying-to-vercel.md` for the minimal Vercel setup and `tasks/` for the current implementation plan.

## Repo Docs

- `docs/prd/babanuj-dashboard.md`: primary PRD
- `docs/testing/babanuj-dashboard-test-plan.md`: feature-by-feature test plan
- `tasks/tasks-multi-tenant-foundation.md`: first implementation track
- `tasks/tasks-customer-management.md`: customer and membership workflows
- `tasks/tasks-performance-dashboards.md`: metrics and rollups
- `tasks/tasks-finance-ledger.md`: invoice and payment tracking
- `tasks/tasks-documentation-and-qa.md`: QA and documentation validation

## Starter Layer

- `agent/manifest.json` pins upstream source and vendored files.
- `scripts/agent-sync.mjs` syncs or verifies allowlisted upstream files.
- `scripts/committer` provides safe path-scoped commits.
- `scripts/commit-with-progress.mjs` wraps path-scoped commits and appends a required learning entry to `progress.md`.
- `scripts/progress-log.mjs` appends structured learning entries to `progress.md`.
- `scripts/progress-append-only-check.mjs` enforces append-only `progress.md` changes in pre-commit.
- `scripts/docs-list.ts` validates docs front matter (`summary`, `read_when`) and prints a docs index.
- `.codex/prompts/` contains codex-first prompts: `/pickup`, `/handoff`, `/build-feature`, `/fix`, `/ship`.
- `progress.md` is an append-only learning log for solo commits, releases, and deploys.

### Useful Commands

```bash
npm run doctor
npm run docs:list
npm run build
npm run test
npm run check
```

## Workspaces

- `@babanuj-dashboard/web`
- `@babanuj-dashboard/core`
