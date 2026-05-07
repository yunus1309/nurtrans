#!/bin/bash
PYTHONPATH=. alembic upgrade head
PYTHONPATH=. python init_db.py
uvicorn app.main:app --host 0.0.0.0 --port 8088 --reload
