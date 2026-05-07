#!/bin/bash
set -euo pipefail

until pg_isready -h db -p 5432 -U "${POSTGRES_USER:-user}" -d "${POSTGRES_DB:-app_db}" >/dev/null 2>&1; do
  echo "Waiting for database..."
  sleep 1
done

PYTHONPATH=. alembic upgrade head
PYTHONPATH=. python init_db.py
uvicorn app.main:app --host 0.0.0.0 --port 8088 --reload
