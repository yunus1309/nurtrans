#!/bin/bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"

python - <<'PY'
import os
import sys
import time
from sqlalchemy import create_engine, text

url = os.environ["DATABASE_URL"]
timeout_seconds = int(os.environ.get("DB_WAIT_TIMEOUT", "90"))
interval_seconds = float(os.environ.get("DB_WAIT_INTERVAL", "1"))

engine = create_engine(url)
deadline = time.time() + timeout_seconds
last_error = None

while time.time() < deadline:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database connection established.")
        sys.exit(0)
    except Exception as exc:
        last_error = exc
        print("Waiting for database...", flush=True)
        time.sleep(interval_seconds)

print(f"Database did not become ready within {timeout_seconds} seconds.", file=sys.stderr)
if last_error:
    print(f"Last connection error: {last_error}", file=sys.stderr)
sys.exit(1)
PY

PYTHONPATH=. alembic upgrade head
PYTHONPATH=. python init_db.py
uvicorn app.main:app --host 0.0.0.0 --port 8088 --reload
