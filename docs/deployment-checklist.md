# Free Render Portfolio Deployment

## Target

This deploy is a public resume demo using Render's Free plan. It starts with
synthetic academic data and allows visitors to work with the sample. Do not enter
real student, faculty, or institutional records. Each API cold start resets the
database and reseeds the sample workspace.

## Deploy the Blueprint

1. Push the repository to GitHub and connect it to Render.
2. In Render, create a Blueprint using the repository's root `render.yaml`.
3. Keep both services on the Free plan and in Singapore.
4. When prompted for `BACKEND_SERVICE_TOKEN` on each service, enter the same
   newly generated random value. A 32-byte random hex string is suitable.
5. Enter the Groq API key in the API service prompt. It remains a server-only
   secret. `GROQ_MODEL` is set to `openai/gpt-oss-120b`.
6. Render generates `SECRET_KEY` for Django and `AUTH_SESSION_SECRET` for Next.js.
7. Wait for the GitHub Actions checks to pass and both services to finish their
   first deploy.

Do not commit `.env` files or paste secrets into GitHub. If a secret value is
missing after Blueprint creation, add it in that service's Render Environment
settings and redeploy.

## Smoke Check

- Open the API's `/api/health/` route and confirm it returns `{"status":"ok"}`.
- Open the frontend's `/login`, choose **Fill demo sign-in**, and sign in.
- Confirm the workspace loads the sample data and its setup forms accept edits.
- Try schedule generation, conflict review, analytics, timetable, and CSV import.
- Try the AI assistant; if Groq is unavailable or out of free quota, the rules
  fallback should remain available.
- Confirm `/api/health` on the frontend returns `{"status":"ok"}`.

## Free-Tier Behavior

Render Free web services sleep after 15 minutes without traffic and may take about
a minute to wake. The free filesystem is ephemeral. The API's startup script
migrates the SQLite schema, resets the demo database, and seeds the demo data and
accounts on every start. Consequently, demo edits and login sessions are temporary.

This configuration is appropriate for a low-traffic portfolio walkthrough. It
does not provide durable user data, production backups, or production uptime.
