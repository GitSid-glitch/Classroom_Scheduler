#!/usr/bin/env bash
set -euo pipefail
umask 077

stamp="$(date +%Y%m%d-%H%M%S)"
destination="${1:-./backups/scheduler-${stamp}.sqlite3}"
container_copy="/tmp/scheduler-backup-${stamp}.sqlite3"

mkdir -p "$(dirname "$destination")"
docker compose exec -T api python -c "import sqlite3; source=sqlite3.connect('/var/lib/scheduler/db.sqlite3'); target=sqlite3.connect('${container_copy}'); source.backup(target); result=target.execute('PRAGMA integrity_check').fetchone()[0]; target.close(); source.close(); raise SystemExit(0 if result == 'ok' else result)"
docker compose cp "api:${container_copy}" "$destination"
docker compose exec -T api rm -f "$container_copy"

printf 'SQLite backup saved to %s\n' "$destination"
