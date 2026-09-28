#!/bin/sh
set -eu

host="${DB_HOST:-db}"
port="${DB_PORT:-3306}"

echo "Waiting for MySQL at ${host}:${port}..."
until nc -z "$host" "$port"; do
  sleep 2
done

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 120
