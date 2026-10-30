# Smart Academic Scheduler — product and layout blueprint

## Research notes (3 October 2026)

- The current Next.js App Router supports React Server Components, Server Functions, route handlers and direct server-side data access. Next's current guidance recommends an authentication library and placing authorization checks close to the data source and inside every mutation. The app can keep its server-rendered Next.js/TypeScript UI while using its existing Django API as the domain service. Sources: [Next.js App Router](https://nextjs.org/docs/app), [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication), [Next.js data mutations](https://nextjs.org/docs/app/getting-started/mutating-data).
- The project already has Django's relational ORM backed by SQLite, password-based Django authentication, role profiles, a REST API, and schedule/audit data. SQLite is suitable for a free local demo and portfolio walkthrough; a self-hosted PostgreSQL deployment is the scale-up path. No paid database or hosting is required to develop and demonstrate locally.
- The assistant uses only Groq, with the model ID selected by `GROQ_MODEL` (default `openai/gpt-oss-120b`) and deterministic rules as its fallback. GPT-OSS 120B supports strict JSON-schema output and appears in Groq's Free Plan rate-limit table; account-level limits still apply. The app makes no paid-tier or hosted-tool requests. The API key stays backend-only. Sources: [Groq model card](https://console.groq.com/docs/model/openai/gpt-oss-120b), [Groq structured outputs](https://console.groq.com/docs/structured-outputs), [Groq rate limits](https://console.groq.com/docs/rate-limits).

## Product shape

Position this as an academic operations workspace, not a timetable demo. Its primary loop is: configure academic data and constraints → generate a draft with a chosen strategy → review coverage and conflicts → apply a fix → publish a version → share the student/faculty timetable.

### Navigation and information architecture

- **Overview**: current term, readiness, conflict queue, generation status and recent activity.
- **Timetable**: weekly grid, section/teacher/room filters, draft versus published view, export.
- **Scheduling**: generation strategy, protected/locked sessions, preview, unscheduled queue and explanations.
- **Review**: conflict resolution, manual overrides, release/publish history and audit trail.
- **Institution data**: rooms, teachers, sections and course offerings; CSV import and validation.
- **Insights**: utilization, teacher load, coverage and schedule quality.
- **AI assistant**: evidence-grounded explanations and recommendations with rule-based fallback; optional local inference.

### Visual system

- Calm ivory canvas, white cards, deep teal accent, dark evergreen text and muted gray-green supporting text.
- Persistent compact left rail on desktop; horizontally scrollable grouped navigation on mobile.
- Clear page title and one primary action per page. Use restrained borders, consistent spacing, readable data tables and explicit empty/loading/error states.
- Prioritize meaningful operational status over decorative gradients: draft/published state, coverage, unresolved conflicts, data freshness and assistant source.

## Existing foundations to preserve

Next.js 16, React 19, TypeScript, Tailwind v4; Django REST and SQLite; Django password authentication with role profiles; room/teacher/section/course data; scheduling strategies; conflict detection; analytics; schedule release; audit events; CSV upload; rule-based and optional local-model guidance.

## Implementation status — 3 October 2026

### Working foundations

- Responsive Next.js workspace shell, role-aware page navigation, login, logout, and signed local session cookies.
- Django-backed room, faculty, section, and course-offering management with schedule generation, conflict analysis, analytics, publishing, unpublishing, audit events, and CSV export.
- Schedule review surfaces for conflicts, unscheduled sessions, timetable previews, and published timetable browsing.
- The overview now reads inventory, schedules, conflicts, audit events, and quality metrics from the API. The public landing page reads live inventory counts; its timetable illustration is labeled as sample data.
- A signed-session BFF checks user roles before forwarding browser requests; Django rejects data API requests without the private server-to-server token. Consumer schedule and inventory responses are filtered to published timetable records.
- CSV uploads support editable column mapping, a server-side dry run, downloadable row-level validation reports, and an atomic commit that revalidates every row.
- Saved assignments retain snapshots of the scheduled class and room; referenced classes and rooms cannot be deleted. Coordinators can compare two saved runs.
- Coordinators can edit saved draft placements. The API checks room capacity and type, required features, availability windows, teacher/section/room overlaps, and locked-session rules before recording the change in the audit log.
- Academic terms have optional date ranges and a single active scope. Course sessions and generated schedules retain their term, and an admin can create, edit, and activate terms.
- Admins can copy course sessions from a previous term into the active term; matching sessions already in the destination are skipped, and the source stays unchanged.
- A minimal runtime dependency file and Docker Compose stack run the frontend, API, and persistent SQLite database locally without paid hosting.

### Known gaps to close, in priority order

1. **Complete the accessibility audit.** Recent passes added keyboard/touch controls for moving timetable sessions, focus return to move feedback, login autocomplete hints, table captions and scoped column headers, improved text contrast, and a shared skip-to-content link with a focusable main landmark on every route. Visible focus rings, keyboard-scrollable timetable tables, live error feedback, and labeled placement controls are also in place. Still manually review screen-reader flow and focus order across every page.
2. **Plan hosted database operations.** CI checks, local SQLite backup/restore, PostgreSQL Compose configuration, and a local fixture migration rehearsal are in place. Production database backups and a hosted cutover runbook remain.
3. **Improve data onboarding.** Column mapping, server-side dry runs, and downloadable validation reports are in place; continue refining import guidance based on user feedback.

Groq is the only optional AI provider. Live inference was verified with the configured model; deterministic rules remain available if the provider or free quota is unavailable.

### Latest verification — 30 October 2026

- The deployed AI request flow successfully used `openai/gpt-oss-120b` with the app's synthetic example, extracted its subjects and section, and matched the request to course offerings in the demo catalog.
- The flow stopped at the review screen. Generating a schedule remains an explicit user action and creates a draft for review rather than publishing it.
- Next.js lint and production build pass. GitHub Actions now runs the Django test suite; its tests cover the Groq response-to-catalog-to-draft path with a mocked model response, alongside the separate live inference check above.
- The Render portfolio deployment continues to use synthetic demo records and an ephemeral free-tier SQLite database. Demo edits can reset when the API service restarts or redeploys.

## Advanced roadmap (free-tier friendly)

1. UX: responsive workspace shell, weekly timetable, command/search entry, filters, accessible forms, loading/empty/error states, and polished conflict review.
2. Domain: academic terms, campuses/buildings, departments, room features, teacher and room availability, section collisions, fixed sessions, and validation before generation.
3. Scheduling: compare strategies, lock-aware regeneration, explain infeasible assignments, quality score, conflict graph, and deterministic reproducible runs.
4. Trust/workflow: Django RBAC enforced in the API, versioned drafts, publish approvals, audit history, CSV preview/row-level errors, and downloadable exports.
5. AI: evidence-grounded suggestions, structured output validation, prompt/response provenance, safe fallback rules, and Groq → rules fallback. Keep AI advisory; users explicitly apply schedule changes.
6. Operations: PostgreSQL migration path, Docker Compose for local stack, CI lint/build, request logging, health endpoints, data backup/export and accessibility checks.

## No-cost boundaries

Local development can run Next.js, Django and SQLite without paid hosting or a paid database. Groq can run within Free Plan limits. Deterministic assistant guidance works if Groq or its free quota is unavailable. Free hosting tiers can be considered later, but the app should remain demonstrable locally and must not depend on managed databases or GPU rentals.
