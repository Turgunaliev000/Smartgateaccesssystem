#!/bin/sh
set -e

python manage.py migrate --noinput

if [ "${SEED_DEMO:-false}" = "true" ]; then
  python manage.py seed_demo
fi

exec gunicorn backend.config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-2}" \
  --timeout 120 \
  --access-logfile -
