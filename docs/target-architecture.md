# Smart Academic Scheduler Target Architecture

## Goal

Transform the current classroom scheduler into a university-grade scheduling platform that is:

- suitable for `Next.js + TypeScript + Tailwind`
- strong enough for a product portfolio
- aligned to Galaxy AI's JD
- ready for AI-assisted workflows

## Product Positioning

This should evolve from a simple room allocation tool into a:

**Smart academic timetable management platform**

Primary users:

- super admin
- scheduler/admin officer
- department coordinator
- teacher
- student viewer

## Core Product Modules

### 1. Setup and Data Management

- campuses
- buildings
- rooms
- departments
- programs
- semesters
- sections / batches
- teachers
- subjects / course offerings
- academic terms

### 2. Constraints and Policies

- teacher availability
- room availability / blackout windows
- fixed classes
- preferred rooms
- required room type
- room equipment requirements
- max classes per day
- max continuous teaching load
- lunch break windows
- no-overlap rules for teachers, sections, and rooms

### 3. Scheduling Engine

- conflict detection
- draft schedule generation
- locked assignment support
- rescheduling after manual edits
- multiple strategy comparison
- explainable scheduling decisions

### 4. Review and Operations

- conflict center
- unscheduled classes queue
- room utilization analytics
- teacher workload analytics
- schedule quality score
- publish / unpublish workflow
- audit history

### 5. AI Layer

- AI explanation of scheduling outcomes
- AI suggestions for conflict resolution
- AI-assisted CSV column mapping and validation
- natural language search over timetable data
- AI summary for overloaded teachers / underused rooms

## Suggested Frontend Architecture

### Stack

- `Next.js` App Router
- `TypeScript`
- `Tailwind CSS`
- `Zod` for validation
- `React Hook Form` for forms
- `TanStack Query` for server state
- `Recharts` or `Nivo` for analytics

### App Areas

- `/` marketing / portfolio landing page
- `/dashboard` overview
- `/setup/rooms`
- `/setup/teachers`
- `/setup/sections`
- `/setup/courses`
- `/constraints`
- `/scheduler/run`
- `/scheduler/results`
- `/scheduler/conflicts`
- `/analytics`
- `/ai-assistant`

## TypeScript Design Approach

Use OOP where it adds clarity around domain and orchestration, not for every component.

### Good OOP Candidates

- `SchedulerApiClient`
- `ScheduleRunService`
- `ConflictAnalysisService`
- `UtilizationAnalyticsService`
- `ScheduleExplanationService`
- `CsvImportService`

### Good Design Principles To Apply

- `SRP`: keep API transport, business rules, and UI rendering separate
- `OCP`: support multiple scheduling strategies without changing all consumers
- `LSP`: define scheduling strategy interfaces cleanly
- `ISP`: keep UI and service interfaces narrow and focused
- `DIP`: high-level orchestration depends on strategy interfaces, not concrete implementations

### Suggested Patterns

- strategy pattern for scheduling algorithms
- repository/client abstraction for API access
- mapper layer for converting API payloads to frontend domain types
- service layer for analytics and orchestration

## Backend Evolution

Keep the Python backend initially because it is already the algorithmic core.

Upgrade it to support:

- richer academic entities
- stronger validation
- day-aware scheduling correctness
- teacher / section / room conflict rules
- schedule explanation payloads
- analytics endpoints
- AI-facing structured summaries

## Algorithm Roadmap

### Current

- heap-based room reuse
- weighted interval scheduling with DP

### Next

- proper day-aware allocation
- conflict graph generation
- teacher / section / room collision detection
- lock-aware regeneration
- quality scoring

### Advanced

- graph coloring for slot assignment
- constraint optimization / CSP style scheduling
- heuristic rescheduling for partially locked timetables

## AI Features Worth Building

### AI Explain

Example:
"Why was Chemistry Lab not scheduled on Tuesday?"

Return:

- missing room type match
- teacher unavailable
- lower priority than competing sessions

### AI Suggest

Example:
"Suggest the best change to reduce timetable conflicts."

Return:

- move session X to room Y at slot Z
- unlock session A if department permits

### AI Import Assistant

- infer column mapping from uploaded CSV headers
- normalize day names and room types
- flag invalid rows before import

## Implementation Phases

### Phase 1

- scaffold `Next.js + TypeScript + Tailwind`
- create typed domain model and API layer
- build landing page and dashboard

### Phase 2

- migrate current rooms/classes/schedule UX
- add conflict panel and unscheduled queue
- improve schedule results UI

### Phase 3

- extend backend domain and scheduling correctness
- add analytics and explainability

### Phase 4

- add AI workflows
- add auth, roles, and publish workflow

## Success Criteria

The rebuilt project should let a recruiter immediately see:

- strong frontend fundamentals with `Next.js + TypeScript + Tailwind`
- thoughtful product design for a real institution
- algorithmic depth beyond CRUD
- scalable code structure with clean abstractions
- practical AI integration rather than superficial chatbot wrapping
