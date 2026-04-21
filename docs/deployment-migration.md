# Deployment Migration Notes

## Goal

Preserve the same public deployment URLs while migrating the codebase to:

- `Vercel` for the frontend
- `Render` for the Django backend
- `apps/web` as the new `Next.js` frontend root

## Current Safe Strategy

Build the new frontend in parallel without touching the current deployed frontend folder yet.

That means:

- old Vite frontend can keep serving the current Vercel deployment
- Django backend can keep serving the current Render deployment
- the new `Next.js` app can be developed and verified locally first

## Vercel Cutover

When the new frontend is ready:

- keep the same Vercel project
- keep the same Vercel domain / URL
- change the project root directory to `apps/web`
- update environment variables like `NEXT_PUBLIC_API_BASE_URL`
- redeploy

### Expected Vercel Commands

- install command: default `npm install`
- build command: `npm run build`
- output: handled by Next.js automatically

## Render Cutover

The Render service can keep the same URL if the backend stays on the same service.

When backend updates are ready:

- keep the same Render service
- keep the same Render URL
- update build/start commands only if needed
- use `/api/health/` as the Render health check path
- redeploy the same service

### Recommended backend rollout order

1. Update Render environment variables.
2. Deploy the backend and let migrations run.
3. Confirm `https://<render-domain>/api/health/` returns a healthy JSON response.
4. Confirm `https://<render-domain>/api/auth/login/` responds to POST requests.
5. Optionally run `python manage.py seed_demo_users` for a demo/staging environment.

## Important Rule

Changing build commands or root directories does **not** require changing public URLs.

As long as:

- the same Vercel project is reused
- the same Render service is reused

the public links can remain stable.
