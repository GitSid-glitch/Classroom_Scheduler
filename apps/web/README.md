# Web App

This is the new frontend for Smart Academic Scheduler.

Stack:

- `Next.js`
- `TypeScript`
- `Tailwind CSS`

## Run Locally

```bash
cd /Users/siddharthshukla/Desktop/Everything/classroom-scheduler/apps/web
cp .env.example .env.local
npm install
npm run dev
```

## Required Environment Variable

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

## Quality Checks

```bash
npm run lint
npm run build
```

## Current App Areas

- dashboard
- setup modules
- scheduler run/conflicts
- analytics
- AI assistant
