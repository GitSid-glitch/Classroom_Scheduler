#!/usr/bin/env bash
set -euo pipefail
umask 077

if [[ "${1:-}" != "--confirm" || -z "${2:-}" || $# -ne 2 ]]; then
  printf 'Usage: bash scripts/restore-local-db.sh --confirm PATH_TO_BACKUP\n' >&2
  exit 2
fi

backup_path="$2"
if [[ ! -f "$backup_path" ]]; then
  printf 'Backup file not found: %s\n' "$backup_path" >&2
  exit 2
fi

stamp="$(date +%Y%m%d-%H%M%S)"
restore_copy="/var/lib/scheduler/.restore-input-${stamp}.sqlite3"
safety_copy="/var/lib/scheduler/.pre-restore-${stamp}.sqlite3"
safety_destination="./backups/pre-restore-${stamp}.sqlite3"
api_stopped=0

restart_api() {
  if [[ "$api_stopped" -eq 1 ]]; then
    docker compose cp "api:${safety_copy}" "$safety_destination" >/dev/null 2>&1 || true
    docker compose start api >/dev/null || true
  fi
}
trap restart_api EXIT

mkdir -p ./backups
docker compose stop api
api_stopped=1
docker compose cp "$backup_path" "api:${restore_copy}"
docker compose run --rm --no-deps api python -c "import sqlite3; backup_path='${restore_copy}'; database_path='/var/lib/scheduler/db.sqlite3'; backup=sqlite3.connect(f'file:{backup_path}?mode=ro', uri=True); integrity=backup.execute('PRAGMA integrity_check').fetchone()[0]; tables={row[0] for row in backup.execute(\"SELECT name FROM sqlite_master WHERE type='table'\")}; assert integrity == 'ok', f'Backup failed SQLite integrity check: {integrity}'; assert 'django_migrations' in tables, 'Backup does not contain Django migration history'; current=sqlite3.connect(database_path); safety=sqlite3.connect('${safety_copy}'); current.backup(safety); safety.close(); target=sqlite3.connect(database_path); backup.backup(target); target.close(); backup.close()"
docker compose cp "api:${safety_copy}" "$safety_destination"
docker compose run --rm --no-deps api python -c "import os; os.remove('${restore_copy}'); os.remove('${safety_copy}')"
docker compose start api
api_stopped=0

printf 'Database restored from %s\n' "$backup_path"
printf 'Pre-restore safety snapshot saved to %s\n' "$safety_destination"
