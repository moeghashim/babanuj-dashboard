---
summary: "Minimal Vercel deployment path for the default Next.js app workspace"
read_when:
  - Setting up the starter on Vercel for the first time.
  - Shipping changes from `apps/web`.
---

# Deploying To Vercel

Use Vercel Git integration as the default deployment path for this starter.

## Project Settings

- Framework preset: Next.js
- Root directory: `apps/web`
- Install command: `npm install`
- Build command: `npm run build`

## Environment Variables

Configure app-specific secrets in the Vercel project, scoped to `apps/web`.

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_SITE_URL`
- `CONVEX_DEPLOYMENT`

Better Auth persistence now lives in Convex through the `@convex-dev/better-auth` component, so the app no longer needs a separate production auth database on Vercel.

Configure the matching auth settings on the Convex deployment as well:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL=https://babanuj-dashboard.vercel.app`

## Solo Shipping Flow

1. Run `npm run check`
2. Run `npm test`
3. Run `npm run agent:check`
4. Push `main`
5. Let Vercel build and deploy `apps/web`

This workspace includes `apps/web/vercel.json` so the `apps/web` project always deploys with the Next.js framework preset even if the Vercel project was initially created with generic build settings.
