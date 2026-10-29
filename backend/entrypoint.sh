#!/bin/sh
set -eu

if [ "${DB_ENGINE:-sqlite}" = "sqlite" ]; then
  database_path="${DATABASE_PATH:-/var/lib/scheduler/db.sqlite3}"
  mkdir -p "$(dirname "$database_path")"
fi

python manage.py migrate --noinput

if [ "${DEMO_MODE:-false}" = "true" ]; then
  # This environment is a disposable portfolio demo. Reset on every cold start
  # so each visitor sees the sample workspace, even on ephemeral free hosting.
  python manage.py flush --noinput
  python manage.py seed_demo_workspace
  python manage.py seed_demo_users
fi

exec gunicorn classroom_scheduler.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${GUNICORN_WORKERS:-1}" \
  --timeout 60
