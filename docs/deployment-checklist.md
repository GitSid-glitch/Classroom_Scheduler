# Deployment Checklist

## Goal

Deploy the upgraded project while keeping the same public `Vercel` and `Render` URLs.

## Vercel

Use the existing Vercel project and update:

- root directory: `apps/web`
- install command: `npm install`
- build command: `npm run build`
- framework preset: `Next.js`
- environment variable:
  - `NEXT_PUBLIC_API_BASE_URL=https://<your-render-domain>/api`

### Before clicking deploy

- confirm `apps/web/.env.example` matches the production API shape
- confirm the backend Render URL is already reachable
- confirm your Vercel domain remains attached to the same project

## Render

Use the existing Render web service and update:

- root directory: `backend`
- build command: `pip install -r requirements.txt && python manage.py migrate`
- start command: `gunicorn classroom_scheduler.wsgi:application`

### Recommended environment variables

- `SECRET_KEY`
- `DEBUG=False`
- `ALLOWED_HOSTS=<your-render-domain>,localhost,127.0.0.1`
- `CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>,http://localhost:3000,http://127.0.0.1:3000`
- `CSRF_TRUSTED_ORIGINS=https://<your-vercel-domain>,http://localhost:3000,http://127.0.0.1:3000`

### After backend deploy

- run `python manage.py migrate`
- optionally run `python manage.py seed_demo_users` for a demo environment
- confirm `/api/auth/login/` responds to POST requests

## Final Smoke Test

### Backend

- open `https://<render-domain>/api/health/`
- confirm `{ "status": "ok" }` style JSON returns
- open `https://<render-domain>/api/schedules/analyze/`
- confirm the API responds instead of CORS/500 errors
- test `POST https://<render-domain>/api/auth/login/` with a valid demo or real user

### Frontend

- open `/login`
- sign in with a demo or real role
- open dashboard
- open scheduler run
- open conflicts
- open analytics
- open AI assistant
- open published timetable as a faculty/student role

## Important Reminder

Changing:

- root directory
- build command
- environment variables

does **not** require changing the public links, as long as you keep using the same Vercel project and the same Render service.
