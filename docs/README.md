---
summary: "Documentation index and front-matter contract for the Babanuj dashboard repo"
read_when:
  - Adding or editing documentation in this repository.
  - Setting up agent workflows and docs validation.
---

# Docs

This folder contains operational docs used by humans and coding agents.

## Front-Matter Contract

Every markdown file in `docs/` must include YAML front matter with:

- `summary`: concise one-line description.
- `read_when`: non-empty list of situations when this doc should be read.

Validation is enforced by `npm run docs:list`.

## Current Docs

- `docs/agent-workflow.md`: codex-first agent workflow and guardrails.
- `docs/commands.md`: in-repo command prompt index.
- `docs/deploying-to-vercel.md`: minimal Vercel deployment path for `apps/web`.
- `docs/prd/babanuj-dashboard.md`: product requirements for the Babanuj dashboard.
- `docs/testing/babanuj-dashboard-test-plan.md`: feature-by-feature QA contract for v1.
