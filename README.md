# Smart Academic Scheduler

Smart Academic Scheduler is a university-grade scheduling platform built to evolve beyond a simple classroom allocator.

It combines:

- `Django + DRF` for the scheduling engine and operational APIs
- `Next.js + TypeScript + Tailwind` for the new portfolio-grade frontend
- algorithmic scheduling with `heap` and `dynamic programming`
- AI-ready explanation, suggestion, conflict, and analytics workflows

## Why This Project Is Strong

This project is no longer just:

- add rooms
- add classes
- generate a schedule

It now models a more realistic academic operations workflow:

- room inventory and room blackout windows
- term-scoped course sessions and generated schedules with course rollover support
- teacher unavailability constraints
- locked/fixed sessions
- role-aware access for admins, coordinators, faculty, and students
- batch and teacher overlap prevention
- room feature requirements
- schedule conflict analysis
- AI-style explanations and action hints
- room utilization and teacher load analytics
- draft and published schedule lifecycle

## Current Product Areas

### Frontend

The new frontend lives in [`apps/web`](/Users/siddharthshukla/Desktop/Everything/classroom-scheduler/apps/web).

Key routes:

- `/dashboard`
- `/setup/rooms`
- `/setup/teachers`
- `/setup/sections`
- `/setup/courses`
- `/setup/terms`
- `/scheduler/run`
- `/scheduler/conflicts`
- `/analytics`
- `/ai-assistant`
- `/login`
- `/published-timetable`

### Backend

The backend lives in [`backend/`](/Users/siddharthshukla/Desktop/Everything/classroom-scheduler/backend).

Key capabilities:

- optimized scheduling via `run_optimized`
- conflict analysis via `analyze`
- assistant suggestions/explanations via `assistant`
- analytics snapshot via `analytics`
- health endpoint via `health`
- publish/unpublish workflow for schedules

## Tech Stack

### Frontend

- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- App Router

### Backend

- `Django`
- `Django REST Framework`
- Python scheduling services

### Core Engineering Ideas

- typed domain models
- service-oriented frontend architecture
- SRP-oriented TypeScript classes for API and orchestration
- algorithmic scheduling with operational constraints

## Repo Structure

```text
classroom-scheduler/
├── apps/
│   └── web/                 # Next.js + TypeScript + Tailwind frontend
├── backend/                 # Django + DRF scheduling backend
├── docs/                    # architecture and deployment notes
└── classroom-scheduler-frontend/   # older Vite frontend kept during migration
```

## Local Development

Copy both safe environment templates and replace the service-token placeholder
with one shared random value:

```bash
cp backend/.env.example backend/.env
cp apps/web/.env.example apps/web/.env.local
openssl rand -hex 32
```

Put that generated value in `BACKEND_SERVICE_TOKEN` in both files. Keep the
`AUTH_SESSION_SECRET` and `SECRET_KEY` values separate. For local development,
leave `DEBUG=True`.

### Run the complete app with Docker Compose

Docker Compose runs Next.js, Django, and SQLite with a persistent local volume:

```bash
docker compose up --build
```

Open `http://localhost:3000`. The API is available at
`http://127.0.0.1:8000/api/health/`. To add the demonstration dataset and
accounts, use a second terminal:

```bash
docker compose exec api python manage.py seed_demo_workspace
docker compose exec api python manage.py seed_demo_users
```

The demo accounts are listed below. They are for local walkthroughs only.
Compose binds both ports to loopback, persists SQLite in a named volume, and
uses development-only fallback secrets. For any hosted deployment, supply new
random secrets and set `DEBUG=False`. You can override the local service token
and session secret by setting `BACKEND_SERVICE_TOKEN` and `AUTH_SESSION_SECRET`
in the shell before starting Compose.

To stop the app, press `Ctrl+C`, then run `docker compose down`. The database
volume remains. `docker compose down --volumes` removes that local database.
Use the [local backup and recovery guide](docs/local-data-recovery.md) to create
or restore a verified SQLite snapshot.

An optional [PostgreSQL overlay and SQLite migration rehearsal](docs/deployment-migration.md#optional-local-postgresql-stack)
is available for database portability work. SQLite remains the default local
setup.

GitHub Actions checks web lint, TypeScript, and the production build, Django
configuration and migration drift, and Docker Compose configuration on pushes
and pull requests.

### 1. Backend

Create and activate a virtual environment, then install dependencies:

```bash
cd /Users/siddharthshukla/Desktop/Everything/classroom-scheduler/backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install Django==6.0.2 djangorestframework==3.16.1 django-cors-headers==4.9.0 python-dotenv==1.2.1 groq==0.37.1
```

Start the backend after installation:

```bash
python manage.py migrate
python manage.py runserver
```

Python 3.12 is required by the pinned Django 6.0 release. The full
`requirements.txt` also includes optional data science and AI packages; the
local API only needs the lightweight runtime dependencies listed above.

Backend runs on:

```text
http://127.0.0.1:8000
```

### 2. Frontend

In a new terminal:

```bash
cd /Users/siddharthshukla/Desktop/Everything/classroom-scheduler/apps/web
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

## Environment Variables

The Django backend loads `backend/.env` for local development. Keep API keys in
that backend-only file and never prefix them with `NEXT_PUBLIC_`. The assistant
uses `GROQ_MODEL` with `GROQ_API_KEY` and returns to deterministic, rules-based
guidance if Groq is unavailable. The default model is `openai/gpt-oss-120b`;
set the Groq project to its Free Plan and stay within its account limits for
no-cost API use. The app does not request paid performance tiers or provider-
hosted search/code tools. The same model setting is used in development and the
Docker API container.

### Frontend

Create [`apps/web/.env.local`](/Users/siddharthshukla/Desktop/Everything/classroom-scheduler/apps/web/.env.local) with the private server-side settings:

```bash
BACKEND_API_BASE_URL=http://127.0.0.1:8000/api
BACKEND_SERVICE_TOKEN=<same-random-value-as-backend>
AUTH_SESSION_SECRET=<separate-random-value>
```

### Backend

Add the matching service token to `backend/.env`:

```bash
BACKEND_SERVICE_TOKEN=<same-random-value-as-frontend>
```

Keep this value private. Django data APIs reject requests without it; the Next.js
server adds it when calling Django, and browser CRUD requests go through the
role-checked same-origin `/api/backend/*` route. The login and health endpoints
remain public. Generate a new random value for each deployment and set it in
both services. Use different random values for `SECRET_KEY` and
`AUTH_SESSION_SECRET`. Safe templates are available in
[`apps/web/.env.example`](/Users/siddharthshukla/Desktop/Everything/classroom-scheduler/apps/web/.env.example)
and [`backend/.env.example`](/Users/siddharthshukla/Desktop/Everything/classroom-scheduler/backend/.env.example).

## Role-Based Access

The platform now includes:

- Django-backed credential validation
- stored user roles through `UserProfile`
- route-guarded Next.js access for `ADMIN`, `COORDINATOR`, `FACULTY`, and `STUDENT`
- role-sensitive navigation and published-timetable access
- coordinator submissions, admin approval, term-scoped releases, audit history, and admin restore of earlier releases
- a same-origin API proxy that checks the signed session and role before forwarding
- a private service token required by Django for all data APIs

### Seed Demo Users

Use these commands locally to create test accounts:

```bash
cd /Users/siddharthshukla/Desktop/Everything/classroom-scheduler
python3 backend/manage.py migrate
python3 backend/manage.py seed_demo_users
```

Demo credentials:

- `admin / scheduler123`
- `coordinator / scheduler123`
- `faculty / scheduler123`
- `student / scheduler123`

## Free Render portfolio deployment

The root [`render.yaml`](/Users/siddharthshukla/Desktop/Everything/classroom-scheduler/render.yaml)
defines two free Render web services: the Next.js frontend and Django API. It uses
SQLite with a synthetic sample workspace and never stores real campus data. The
demo account credentials above are public; anyone can make changes while the
service is awake. The demo database is reset and reseeded whenever the API starts,
so edits are temporary by design.

To deploy, connect this GitHub repository to Render and create a Blueprint from
`render.yaml`. The Blueprint prompts for `BACKEND_SERVICE_TOKEN` on both services;
enter the same freshly generated random value for each. Enter the Groq key only in
the API service’s secret prompt. Render generates Django’s `SECRET_KEY` and the
Next.js `AUTH_SESSION_SECRET`. All services use the Free plan in Singapore.

Render Free services sleep after inactivity and the API can take time to wake.
Its filesystem is temporary, so the startup script rebuilds the sample dataset on
each start. This setup is for a portfolio walkthrough, not durable production use.
See the [deployment checklist](docs/deployment-checklist.md) and
[migration notes](docs/deployment-migration.md).

## Verification

Backend tests:

```bash
cd /Users/siddharthshukla/Desktop/Everything/classroom-scheduler
python3 backend/manage.py test scheduler
```

Frontend checks:

```bash
cd /Users/siddharthshukla/Desktop/Everything/classroom-scheduler/apps/web
npm run lint
npm run build
```

## Portfolio Positioning

This project is a strong portfolio piece because it shows:

- `Next.js + TypeScript + Tailwind` alignment for modern frontend roles
- algorithmic depth with real constraints, not only CRUD
- full-stack thinking across API design, scheduling, analytics, and workflows
- AI-oriented product design through explanations and suggestions
- real-world product framing for universities and schools

## What’s Next

The next improvements to prioritize are:

- complete a visual accessibility audit across all routes
- production database operations and a full hosted migration runbook
- deeper scheduling explainability and user-controlled AI workflows
