# NurTrans MVP

MVP-Prototyp für eine kollaborative Übersetzungssoftware mit Glossar-Reiter und Segment-Statusfarben.

## Start

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000/docs

## Enthalten

- React-UI mit Reitern **Übersetzen** und **Glossar**
- Segmentstatus: rot (new), orange (in_progress), grün (done)
- FastAPI-Endpunkte für Segmente, Auth (MVP), Glossar
- Vorschau-Endpunkt für globale Glossar-Ersetzung (`/glossary/replace-preview`)
- Docker-Services für API, Frontend, PostgreSQL (pgvector), Redis

## Hinweis

Dieser Stand nutzt im Backend für die Domänenobjekte noch In-Memory-Speicher als MVP. PostgreSQL/Redis sind im Compose bereits eingebunden und der nächste Schritt ist die Persistenz-Migration.
