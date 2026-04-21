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

### 1. Backend

Create and activate a virtual environment, then install dependencies:

```bash
cd /Users/siddharthshukla/Desktop/Everything/classroom-scheduler/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

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

### Frontend

Create [`apps/web/.env.local`](/Users/siddharthshukla/Desktop/Everything/classroom-scheduler/apps/web/.env.local) with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

### Backend

The backend already supports environment-driven settings for:

- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`

## Role-Based Access

The platform now includes:

- Django-backed credential validation
- stored user roles through `UserProfile`
- route-guarded Next.js access for `ADMIN`, `COORDINATOR`, `FACULTY`, and `STUDENT`
- role-sensitive navigation and published-timetable access

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

## Deployment

The goal is to keep the same public URLs while upgrading the codebase.

### Vercel

- keep the same Vercel project
- keep the same frontend domain/link
- set root directory to `apps/web`
- build command: `npm run build`
- install command: `npm install`
- environment variable: `NEXT_PUBLIC_API_BASE_URL=<your-render-api-url>/api`

### Render

- keep the same Render backend service
- keep the same backend URL
- continue serving the Django backend from `backend/`
- run migrations during deployment

More detailed notes:

- [`docs/deployment-migration.md`](/Users/siddharthshukla/Desktop/Everything/classroom-scheduler/docs/deployment-migration.md)
- [`docs/target-architecture.md`](/Users/siddharthshukla/Desktop/Everything/classroom-scheduler/docs/target-architecture.md)

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

The strongest future upgrades would be:

- CSV import intelligence and schema mapping
- manual drag/drop timetable interactions
- deeper timetable comparison and approval workflows
- deeper AI workflows backed by an actual model provider
