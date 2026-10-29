# Deployment Notes

The resume deployment uses Render Free for both the Next.js frontend and Django
API, defined in the repository's root `render.yaml`. It uses synthetic data only.
See the [free Render deployment checklist](deployment-checklist.md) for setup,
secrets, and smoke checks.

The API uses SQLite on Render's ephemeral filesystem. `DEMO_MODE=true` causes the
container startup script to migrate, clear, and repopulate the database whenever
the service starts. Visitor edits are temporary; this is deliberate for the
portfolio demo. The local Docker Compose stack remains the persistent development
environment.

## Optional Local PostgreSQL Stack

SQLite remains the zero-setup default. For a PostgreSQL rehearsal, choose a
local `DB_PASSWORD` and use the overlay:

```bash
DB_PASSWORD='choose-a-local-password' docker compose \
  -f compose.yaml -f compose.postgres.yaml up --build
```

The overlay adds a private PostgreSQL 17 container and persistent volume. It
does not publish the database port to the host. Django keeps using the same
migrations and application models. Bring the stack down normally to preserve
the volume. Remove `scheduler_postgres_data` only when intentionally deleting
that PostgreSQL database.

## Moving Local SQLite Data to PostgreSQL

Make a verified SQLite snapshot first using
[`local-data-recovery.md`](local-data-recovery.md). Pause writes while exporting
and importing so both databases represent the same point in time. Keep the
SQLite volume untouched until the PostgreSQL copy has been reviewed.

1. Export application records from the SQLite-backed app before switching the
   Compose configuration:

   ```bash
   docker compose exec -T api python manage.py dumpdata \
     --natural-foreign --natural-primary \
     --exclude contenttypes --exclude auth.permission > scheduler-data.json
   ```

2. Start PostgreSQL and apply migrations to its empty database:

   ```bash
   DB_PASSWORD='choose-a-local-password' docker compose \
     -f compose.yaml -f compose.postgres.yaml up --build -d
   docker compose -f compose.yaml -f compose.postgres.yaml exec api \
     python manage.py migrate
   ```

3. Load the SQLite fixture into PostgreSQL and check its schema:

   ```bash
   docker compose -f compose.yaml -f compose.postgres.yaml exec -T api \
     python manage.py loaddata --format json - < scheduler-data.json
   docker compose -f compose.yaml -f compose.postgres.yaml exec api \
     python manage.py check --database default
   ```

4. Sign in and review terms, users/roles, teachers, rooms, courses, releases,
   and audit history in the application. Re-run key schedule and access flows
   before pointing any frontend at the PostgreSQL API.

Delete `scheduler-data.json` after the migration if it contains user records;
it includes credentials in hashed form and must still be treated as private.
This fixture workflow is intended for a local migration rehearsal. For a hosted
cutover, take database-native backups, restore into a separately protected
PostgreSQL database, and plan a maintenance window and rollback separately.
