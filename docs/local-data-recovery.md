# Local SQLite backup and recovery

The Docker Compose database lives in the named `scheduler_data` volume. A
normal `docker compose down` keeps it. `docker compose down --volumes` deletes
it, so do not use that command if you want to keep local data.

## Create a backup

With the Compose app running, create a consistent SQLite snapshot:

```bash
bash scripts/backup-local-db.sh
```

The default output is `backups/scheduler-<timestamp>.sqlite3`. To choose a
different path, pass it as the first argument. The script uses SQLite's online
backup API, runs an integrity check, and sets private file permissions. Keep
backup files outside version control; `/backups/` is ignored by Git.

## Restore a backup

Restore requires the explicit `--confirm` argument because it replaces the
active Compose database:

```bash
bash scripts/restore-local-db.sh --confirm ./backups/scheduler-YYYYMMDD-HHMMSS.sqlite3
```

The script stops the API, checks that the source database is valid and contains
Django migration history, takes a snapshot of the current database, restores
the selected backup, and starts the API again. It saves the pre-restore copy
under `backups/pre-restore-<timestamp>.sqlite3`. If restore fails, the script
tries to restart the API and preserve that safety copy.

Afterward, open `http://127.0.0.1:8000/api/health/`, sign in at
`http://127.0.0.1:3000/login`, and confirm the expected term and schedules are
present. Keep more than one backup and store a copy somewhere separate from
the machine that runs Compose.

These scripts target the local Compose SQLite volume only. Hosted deployments
need a backup process supported by their database provider. Moving this app to
PostgreSQL also requires a reviewed migration and restore procedure.
