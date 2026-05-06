# NurTrans MVP

MVP-Prototyp für eine kollaborative Übersetzungssoftware mit Glossar-Reiter und Segment-Statusfarben.

## Start

```bash
docker compose up --build
```

Default-Ports (bewusst nicht Standardports, um Port-Konflikte zu vermeiden):

- Frontend: http://localhost:15173
- Backend: http://localhost:18000/docs
- PostgreSQL: `localhost:15432`
- Redis: `localhost:16379`

## Wenn ein Port schon belegt ist

Du kannst Ports beim Start überschreiben:

```bash
NURTRANS_API_PORT=28000 NURTRANS_FRONTEND_PORT=25173 docker compose up --build
```

Oder du prüfst belegte Ports:

```bash
ss -ltnp | rg ':8000|:5173|:5432|:6379'
```

## Enthalten

- React-UI mit Reitern **Übersetzen** und **Glossar**
- Segmentstatus: rot (new), orange (in_progress), grün (done)
- FastAPI-Endpunkte für Segmente, Auth (MVP), Glossar
- Vorschau-Endpunkt für globale Glossar-Ersetzung (`/glossary/replace-preview`)
- Docker-Services für API, Frontend, PostgreSQL (pgvector), Redis

## Hinweis

Dieser Stand nutzt im Backend für die Domänenobjekte noch In-Memory-Speicher als MVP. PostgreSQL/Redis sind im Compose bereits eingebunden und der nächste Schritt ist die Persistenz-Migration.

## Troubleshooting

Wenn der API-Container mit `email-validator is not installed` abstürzt, stelle sicher, dass das aktuelle Image gebaut wird:

```bash
docker compose build --no-cache api
docker compose up
```
