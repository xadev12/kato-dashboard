# Phase 1 Complete: Foundation

**Completed:** 2026-02-07
**Branch:** feat/v3-rebuild

## Summary

Phase 1 of the Kato Dashboard v3 rebuild is complete. The backend now reads directly from source files instead of SQLite.

## What Was Implemented

### 1. Source Readers (`backend/sources/`)

Four new source readers that parse data directly from source files:

| Reader | Source | Description |
|--------|--------|-------------|
| `projects.ts` | `/Users/devl/clawd/projects/*/pipeline.json` | Reads project status from pipeline files |
| `roadmap.ts` | `/Users/devl/clawd/ROADMAP.md` | Parses roadmap markdown for queue items |
| `tokens.ts` | `~/.openclaw/agents/*/sessions/*.jsonl` | Aggregates token usage from session files |
| `agents.ts` | `~/.openclaw/openclaw.json` | Reads agent config and queries gateway |

### 2. Unified `/api/status` Endpoint

Single endpoint that returns complete dashboard state:

```json
{
  "schemaVersion": "3.0",
  "sprint": { "name": "60-Day Builder Sprint", "day": 2, "totalDays": 60, "targets": [...] },
  "activeWork": { "projects": [...], "blockedCount": 1 },
  "queue": [...],
  "systemHealth": {
    "tokens": { "today": 27114251, "cost": 1.31, "budget": 20, "budgetUsedPercent": 7 },
    "agents": { "total": 5, "active": 0, "idle": 5, "list": [...] }
  }
}
```

### 3. New Backend Server (`backend/server-v3.ts`)

Clean Express server with no SQLite dependency:

**Endpoints:**
- `GET /health` - Health check with gateway info
- `GET /api/status` - Unified dashboard state (main endpoint)
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Single project detail
- `GET /api/roadmap` - Full roadmap data
- `GET /api/queue` - Next items in queue
- `GET /api/sprint` - Sprint info
- `GET /api/agents` - Agent list with status
- `GET /api/tokens` - Token usage stats
- `GET /api/dashboard-data` - Static fallback export

**WebSocket:**
- Real-time status updates every 30 seconds
- Subscribe to `status` channel

### 4. Updated Schema (`public/dashboard-data.json`)

New v3.0 schema matching the mission control design:
- Sprint info with targets
- Active work with blockers
- Queue from roadmap
- System health (tokens + agents)

## Files Changed

```
backend/
├── server-v3.ts          # New v3 server (no SQLite)
├── sources/
│   ├── index.ts          # Export barrel
│   ├── projects.ts       # Pipeline.json reader
│   ├── roadmap.ts        # ROADMAP.md parser
│   ├── tokens.ts         # Session JSONL aggregator
│   └── agents.ts         # OpenClaw config reader
package.json              # Updated version to 3.0.0, new scripts
public/dashboard-data.json # New v3.0 schema
```

## Running the New Server

```bash
# Start v3 server
npm run server

# Start v3 server in dev mode (auto-reload)
npm run server:dev

# Start legacy v2 server (SQLite)
npm run server:legacy

# Start both frontend + v3 backend
npm run start:all
```

## Next Steps (Phase 2)

1. Build 3-column mission control layout
2. Implement Active Work column (reads from `/api/status`)
3. Implement Queue column (from roadmap)
4. Implement System Health column (tokens + agents)

## Technical Notes

- The new server reads files on every request (fast enough for local use)
- Token stats are cached for 5 minutes to avoid re-parsing JSONL files
- Gateway status query is async and may return empty if gateway is down
- All endpoints return JSON, no HTML/template rendering
