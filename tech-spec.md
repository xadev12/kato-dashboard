# Tech Spec: Kato Dashboard v3

**Product:** Kato Dashboard
**Date:** 2026-03-10
**Status:** Draft
**Depends on:** [prd.md](./prd.md), [design-spec.md](./design-spec.md)

---

## 1. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│  React 19 + Vite + Tailwind CSS v4 + React Router v7    │
│  Static fallback: /dashboard-data.json                  │
└──────────────────────┬──────────────────────────────────┘
                       │ fetch /api/* (proxied in dev)
                       │ WebSocket wss://
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Mac Mini (Backend — port 3001)              │
│  Express 5 + better-sqlite3 + WebSocket                 │
│                                                         │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │ REST API │  │ WebSocket │  │ Collectors (cron)    │  │
│  │ /api/*   │  │ /ws       │  │ gateway, github,     │  │
│  └──────────┘  └───────────┘  │ sessions, memory,    │  │
│       │              │        │ pipeline, roadmap,   │  │
│       ▼              ▼        │ linear, koji         │  │
│  ┌──────────────────────────┐ └──────────┬───────────┘  │
│  │     SQLite (WAL mode)    │◄───────────┘              │
│  │  FTS5 for full-text      │                           │
│  └──────────────────────────┘                           │
└─────────────────────────────────────────────────────────┘
       ▲                ▲                ▲
       │                │                │
  File System       External APIs    Webhooks
  - pipeline.json   - GitHub API     - /api/webhook/github
  - ROADMAP.md      - Linear API
  - events.jsonl
  - sessions/*.jsonl
  - gateway.log
  - koji/output/
```

### Data Flow

1. **Collectors** run on cron intervals, read from file system and external APIs, write to SQLite.
2. **REST API** queries SQLite, returns JSON to frontend.
3. **WebSocket** broadcasts changes on a 5-second interval for "Needs You" data, 30-second for general status.
4. **Frontend** polls REST endpoints at varying intervals (5s–60s) with WebSocket overlay for critical data.
5. **Fallback**: When backend is unreachable, frontend loads `/dashboard-data.json` (static export updated every 10 min by cron).

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | SQLite (better-sqlite3) | Already in place. Local-only backend, no concurrency pressure. WAL mode handles collector writes + API reads. |
| Real-time | WebSocket + polling hybrid | WebSocket for "Needs You" (sub-second latency). Polling for everything else (simpler, more resilient). |
| Search | SQLite FTS5 | Built-in, zero dependencies, fast enough for 30-day activity log. |
| State management | React context + useReducer | No external library. Dashboard is read-heavy, low interactivity. |
| Charting | Hand-rolled SVG | PRD says no D3/Recharts. Sparklines and bars only. |
| CSS | Tailwind v4 + design tokens | Already configured. Design spec defines all tokens in `index.css`. |

---

## 2. Data Collectors

All collectors live in `backend/collectors/`. Each exports a `collect(db: Database): Promise<CollectorResult>` function.

### Collector Registry

```typescript
// backend/collectors/registry.ts
interface CollectorConfig {
  name: string
  interval: number       // ms between runs
  collect: (db: Database) => Promise<CollectorResult>
  critical: boolean      // failure triggers alert
}

interface CollectorResult {
  source: string
  itemsProcessed: number
  errors: string[]
  duration: number       // ms
}

const collectors: CollectorConfig[] = [
  { name: 'gateway',  interval: 5_000,    collect: collectGateway,  critical: true },
  { name: 'github',   interval: 300_000,  collect: collectGitHub,   critical: false },
  { name: 'sessions', interval: 120_000,  collect: collectSessions, critical: true },
  { name: 'memory',   interval: 600_000,  collect: collectMemory,   critical: false },
  { name: 'pipeline', interval: 10_000,   collect: collectPipeline, critical: true },
  { name: 'roadmap',  interval: 3600_000, collect: collectRoadmap,  critical: false },
  { name: 'linear',   interval: 900_000,  collect: collectLinear,   critical: false },
  { name: 'koji',     interval: 3600_000, collect: collectKoji,     critical: false },
]
```

### Collector Health Monitor

```typescript
// backend/collectors/health.ts
interface CollectorHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  lastRun: string | null        // ISO timestamp
  lastSuccess: string | null
  lastError: string | null
  consecutiveFailures: number
  expectedInterval: number      // ms
}

// Stored in SQLite table `collector_health`
// Updated after each collector run
// Status logic:
//   healthy:  lastSuccess within 1.5x interval
//   degraded: lastSuccess within 2x interval OR 1-2 consecutive failures
//   down:     lastSuccess > 2x interval OR 3+ consecutive failures
```

### 2.1 Gateway Collector (existing — enhance)

**Source:** `$OPENCLAW_HOME/logs/gateway.log`
**Interval:** 5 seconds
**Writes to:** `tokens`, `activity`

Current implementation parses gateway logs for token usage. Enhancements:

```typescript
// Additional fields to extract for v3
interface GatewayLogEntry {
  timestamp: string
  agent: string
  model: string
  tokensIn: number
  tokensOut: number
  tokensCached: number
  cost: number
  sessionId: string
  latencyMs: number          // NEW: for model health
  error?: string             // NEW: for circuit breaker state
  rateLimitRemaining?: number // NEW: for rate limit cards
}
```

**New responsibility:** Write model health state to `model_health` table on each entry. Track failures in 15-minute sliding window.

### 2.2 GitHub Collector (existing — no changes)

**Source:** `gh` CLI
**Interval:** 5 minutes
**Writes to:** `projects`, `activity`

Existing implementation covers commit history, PR data, progress calculation. No changes needed for v3.

### 2.3 Sessions Collector (existing — enhance)

**Source:** `$OPENCLAW_HOME/sessions/*.jsonl`
**Interval:** 2 minutes
**Writes to:** `sessions`, `tasks`, `activity`

Enhancement: extract `worktree`, `branch`, `filesTouched` from session events for task detail drawer.

```typescript
// Additional session metadata for v3
interface SessionMeta {
  worktree?: string
  branch?: string
  filesTouched?: string[]
  context?: string          // What the agent is working on (from task prompt)
}
```

### 2.4 Memory Collector (existing — no changes)

**Source:** `MEMORY.md`, `memory/YYYY-MM-DD.md`
**Interval:** 10 minutes
**Writes to:** `memory`

No changes needed.

### 2.5 Pipeline Collector (new)

**Source:** `$OPENCLAW_HOME/projects/*/pipeline.json`
**Interval:** 10 seconds (file watcher + polling fallback)
**Writes to:** `projects`, `tasks`, `pipeline_events`, `activity`

```typescript
// backend/collectors/pipeline.ts
import { watch } from 'fs'
import { glob } from 'glob'

interface PipelineJSON {
  project_id: string
  stage: string
  tasks: PipelineTask[]
  gates: Record<string, GateResult>
  blockers: Blocker[]
  created_at: string
  updated_at: string
}

interface PipelineTask {
  id: string
  title: string
  status: 'queued' | 'in_progress' | 'blocked' | 'review' | 'done'
  assigned_agent?: string
  blocker_reason?: string
  blocked_by?: string
  action_required?: boolean
  started_at?: string
  completed_at?: string
  estimated_scope?: 'S' | 'M' | 'L'
  depends_on?: string[]
}

interface GateResult {
  criteria: Array<{ label: string; passed: boolean }>
  last_checked: string
}

interface Blocker {
  reason: string
  since: string
  requires_human: boolean
}

async function collectPipeline(db: Database): Promise<CollectorResult> {
  const pipelineFiles = await glob('/Users/devl/clawd/projects/*/pipeline.json')
  let processed = 0

  for (const file of pipelineFiles) {
    const pipeline: PipelineJSON = JSON.parse(await readFile(file, 'utf-8'))
    const projectId = pipeline.project_id

    // Upsert project stage
    db.prepare(`
      UPDATE projects SET stage = ?, updated_at = ? WHERE id = ?
    `).run(pipeline.stage, pipeline.updated_at, projectId)

    // Sync tasks
    const upsertTask = db.prepare(`
      INSERT INTO tasks (id, project_id, title, status, assigned_agent, blocker_reason,
                         blocked_by, action_required, started_at, completed_at,
                         estimated_scope, depends_on)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        assigned_agent = excluded.assigned_agent,
        blocker_reason = excluded.blocker_reason,
        blocked_by = excluded.blocked_by,
        action_required = excluded.action_required,
        completed_at = excluded.completed_at
    `)

    for (const task of pipeline.tasks) {
      upsertTask.run(
        task.id, projectId, task.title, task.status,
        task.assigned_agent ?? null, task.blocker_reason ?? null,
        task.blocked_by ?? null, task.action_required ? 1 : 0,
        task.started_at ?? null, task.completed_at ?? null,
        task.estimated_scope ?? null, JSON.stringify(task.depends_on ?? [])
      )
    }

    // Store gate results
    for (const [gate, result] of Object.entries(pipeline.gates ?? {})) {
      db.prepare(`
        INSERT OR REPLACE INTO gates (project_id, gate_name, criteria, last_checked)
        VALUES (?, ?, ?, ?)
      `).run(projectId, gate, JSON.stringify(result.criteria), result.last_checked)
    }

    // Detect stage transitions → emit activity events
    const prev = db.prepare(
      'SELECT stage FROM pipeline_state WHERE project_id = ?'
    ).get(projectId) as { stage: string } | undefined
    if (prev && prev.stage !== pipeline.stage) {
      db.prepare(`
        INSERT INTO activity (action_type, description, project_id, timestamp)
        VALUES ('stage_change', ?, ?, datetime('now'))
      `).run(`${projectId} → ${pipeline.stage} stage`, projectId)
    }
    db.prepare(`
      INSERT OR REPLACE INTO pipeline_state (project_id, stage, updated_at)
      VALUES (?, ?, ?)
    `).run(projectId, pipeline.stage, pipeline.updated_at)

    processed++
  }

  return { source: 'pipeline', itemsProcessed: processed, errors: [], duration: 0 }
}
```

### 2.6 Roadmap Collector (new)

**Source:** `$OPENCLAW_HOME/ROADMAP.md`
**Interval:** 1 hour (or on file change)
**Writes to:** `roadmap`

```typescript
// backend/collectors/roadmap.ts

interface RoadmapRow {
  rank: number
  name: string
  score: number
  status: 'backlog' | 'active' | 'done' | 'killed'
  stage: string | null
  day_in_cycle: number | null
  next_step: string
  revenue_target: string | null
  assigned_agent: string | null
}

async function collectRoadmap(db: Database): Promise<CollectorResult> {
  const content = await readFile('/Users/devl/clawd/ROADMAP.md', 'utf-8')
  const rows = parseRoadmapTable(content)

  db.prepare('DELETE FROM roadmap').run()
  const insert = db.prepare(`
    INSERT INTO roadmap (rank, name, score, status, stage, day_in_cycle,
                         next_step, revenue_target, assigned_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const row of rows) {
    insert.run(row.rank, row.name, row.score, row.status, row.stage,
               row.day_in_cycle, row.next_step, row.revenue_target, row.assigned_agent)
  }

  return { source: 'roadmap', itemsProcessed: rows.length, errors: [], duration: 0 }
}

function parseRoadmapTable(md: string): RoadmapRow[] {
  const lines = md.split('\n')
  const tableStart = lines.findIndex(l => /^\|.*Rank.*Product.*Score/i.test(l))
  if (tableStart === -1) return []

  const rows: RoadmapRow[] = []
  for (let i = tableStart + 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('|')) break
    const cells = line.split('|').map(c => c.trim()).filter(Boolean)
    if (cells.length < 4) continue

    rows.push({
      rank: parseInt(cells[0]) || rows.length + 1,
      name: cells[1],
      score: parseFloat(cells[2]) || 0,
      status: (cells[3]?.toLowerCase() as RoadmapRow['status']) || 'backlog',
      stage: cells[4] || null,
      day_in_cycle: cells[5] ? parseInt(cells[5]) : null,
      next_step: cells[6] || '',
      revenue_target: cells[7] || null,
      assigned_agent: cells[8] || null,
    })
  }
  return rows
}
```

### 2.7 Linear Collector (new — Phase 3)

**Source:** Linear API (Team: KopiKoubou)
**Interval:** 15 minutes
**Writes to:** `linear_issues`, `activity`

```typescript
// backend/collectors/linear.ts
const LINEAR_API = 'https://api.linear.app/graphql'

interface LinearIssue {
  id: string
  identifier: string        // e.g., "KK-42"
  title: string
  state: { name: string }
  assignee?: { name: string; email: string }
  project?: { name: string }
  priority: number
  createdAt: string
  updatedAt: string
}

async function collectLinear(db: Database): Promise<CollectorResult> {
  const apiKey = process.env.LINEAR_API_KEY
  if (!apiKey) {
    return { source: 'linear', itemsProcessed: 0, errors: ['LINEAR_API_KEY not set'], duration: 0 }
  }

  const query = `
    query {
      team(id: "${process.env.LINEAR_TEAM_ID}") {
        issues(first: 100, orderBy: updatedAt, filter: {
          state: { type: { nin: ["canceled"] } }
        }) {
          nodes {
            id identifier title
            state { name type }
            assignee { name email }
            project { name }
            priority createdAt updatedAt
          }
        }
      }
    }
  `

  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    return { source: 'linear', itemsProcessed: 0, errors: [`HTTP ${res.status}`], duration: 0 }
  }

  const { data } = await res.json()
  const issues: LinearIssue[] = data.team.issues.nodes

  const upsert = db.prepare(`
    INSERT INTO linear_issues (id, identifier, title, state, assignee_name,
                               project_name, priority, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title, state = excluded.state,
      assignee_name = excluded.assignee_name, priority = excluded.priority,
      updated_at = excluded.updated_at
  `)

  for (const issue of issues) {
    upsert.run(
      issue.id, issue.identifier, issue.title, issue.state.name,
      issue.assignee?.name ?? null, issue.project?.name ?? null,
      issue.priority, issue.createdAt, issue.updatedAt
    )
  }

  return { source: 'linear', itemsProcessed: issues.length, errors: [], duration: 0 }
}
```

### 2.8 Koji Output Collector (new — Phase 2)

**Source:** `$OPENCLAW_HOME/agents/koji/output/`
**Interval:** 1 hour
**Writes to:** `koji_research`

```typescript
// backend/collectors/koji.ts
async function collectKoji(db: Database): Promise<CollectorResult> {
  const outputDir = '/Users/devl/clawd/agents/koji/output'
  const files = await glob(`${outputDir}/*.md`)
  let processed = 0

  const upsert = db.prepare(`
    INSERT INTO koji_research (id, title, summary, content, date, tags, source)
    VALUES (?, ?, ?, ?, ?, ?, 'koji-output')
    ON CONFLICT(id) DO UPDATE SET
      content = excluded.content, updated_at = datetime('now')
  `)

  for (const file of files) {
    const content = await readFile(file, 'utf-8')
    const title = content.split('\n')[0]?.replace(/^#\s*/, '') || basename(file, '.md')
    const summary = content.split('\n').slice(1, 4).join(' ').trim().slice(0, 200)
    const stat = await lstat(file)
    const tags = extractTags(content)

    upsert.run(
      basename(file, '.md'),
      title,
      summary,
      content,
      stat.mtime.toISOString().slice(0, 10),
      JSON.stringify(tags)
    )
    processed++
  }

  return { source: 'koji', itemsProcessed: processed, errors: [], duration: 0 }
}

function extractTags(content: string): string[] {
  const matches = content.match(/#[a-zA-Z][a-zA-Z0-9_-]*/g) || []
  return [...new Set(matches.map(t => t.slice(1).toLowerCase()))]
}
```

### Collector Runner

```typescript
// backend/collectors/runner.ts
import { collectors } from './registry'

function startCollectors(db: Database) {
  for (const config of collectors) {
    runCollector(db, config)
    setInterval(() => runCollector(db, config), config.interval)
  }
}

async function runCollector(db: Database, config: CollectorConfig) {
  const start = Date.now()
  try {
    const result = await config.collect(db)
    result.duration = Date.now() - start

    db.prepare(`
      INSERT OR REPLACE INTO collector_health
        (name, status, last_run, last_success, consecutive_failures, expected_interval)
      VALUES (?, 'healthy', datetime('now'), datetime('now'), 0, ?)
    `).run(config.name, config.interval)

    return result
  } catch (err) {
    const health = db.prepare(
      'SELECT consecutive_failures FROM collector_health WHERE name = ?'
    ).get(config.name) as { consecutive_failures: number } | undefined
    const failures = (health?.consecutive_failures ?? 0) + 1
    const status = failures >= 3 ? 'down' : 'degraded'

    db.prepare(`
      INSERT OR REPLACE INTO collector_health
        (name, status, last_run, last_error, consecutive_failures, expected_interval)
      VALUES (?, ?, datetime('now'), ?, ?, ?)
    `).run(config.name, status, String(err), failures, config.interval)

    if (config.critical && failures >= 3) {
      db.prepare(`
        INSERT INTO activity (action_type, description, timestamp)
        VALUES ('alert', ?, datetime('now'))
      `).run(`Collector "${config.name}" down: ${err}`)
    }
  }
}
```

---

## 3. API Design

### Base URL

- **Development:** `http://localhost:3001/api` (proxied via Vite at `/api`)
- **Production (Vercel):** Falls back to `/dashboard-data.json`

### Endpoints

#### 3.1 Unified Status (Now Tab)

```
GET /api/status
```

Returns everything the Now tab needs in a single request. This is the primary endpoint.

```typescript
interface StatusResponse {
  needsYou: NeedsYouItem[]
  activeTasks: ActiveTask[]
  projects: ProjectSummary[]
  deployReady: DeployReadyItem[]
  mappedOut: MappedOutTask[]
  agents: QueenAgent[]
  workers: WorkerQueueItem[]
  modelHealth: ModelHealth[]
  tokenStats: TokenStats
  collectorHealth: CollectorHealth[]
  lastSync: string
}
```

**Response time target:** < 200ms (all data from SQLite, no external calls).

#### 3.2 Activity Feed

```
GET /api/activity?type=pipeline,agent&project=move-pwa&agent=kato&limit=50&offset=0&search=deploy
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string (comma-separated) | all | Filter by event type |
| `project` | string | — | Filter by project ID |
| `agent` | string | — | Filter by agent ID |
| `limit` | number | 50 | Max results |
| `offset` | number | 0 | Pagination offset |
| `search` | string | — | FTS5 full-text search |

```typescript
interface ActivityResponse {
  items: ActivityEvent[]
  total: number
  hasMore: boolean
}
```

#### 3.3 Pipeline (Pipeline Tab)

```
GET /api/pipeline
```

```typescript
interface PipelineResponse {
  projects: PipelineProject[]
  gates: GateCriteria[]
}
```

#### 3.4 Roadmap

```
GET /api/roadmap?status=active&sort=rank
```

```typescript
interface RoadmapResponse {
  items: RoadmapItem[]
  total: number
}
```

#### 3.5 Koji Research

```
GET /api/research?limit=20
```

```typescript
interface ResearchResponse {
  items: ResearchEntry[]
  total: number
}
```

#### 3.6 Project Detail

```
GET /api/projects/:id
```

```typescript
interface ProjectDetailResponse {
  project: Project
  tasks: ActiveTask[]
  activity: ActivityEvent[]    // last 20 events for this project
  gates: GateCriteria[]
  tokenSpend: { today: number; total: number }
}
```

#### 3.7 Search

```
GET /api/search?q=auth+middleware&limit=20
```

Searches across projects, tasks, agents, activity using FTS5.

```typescript
interface SearchResponse {
  projects: Array<{ id: string; name: string; stage: string }>
  tasks: Array<{ id: string; title: string; projectName: string; status: string }>
  agents: Array<{ id: string; name: string; status: string }>
  activity: Array<{ id: string; description: string; timestamp: string }>
}
```

#### 3.8 Actions

```
POST /api/actions
Content-Type: application/json

{
  "action": "approve_deploy" | "defer" | "dismiss",
  "targetType": "project" | "task" | "linear_issue",
  "targetId": "move-pwa",
  "metadata": {}
}
```

Response: `{ success: boolean, message: string }`

Actions are recorded in `activity` table and trigger relevant side effects (e.g., advancing pipeline stage).

#### 3.9 Dashboard Data Export

```
GET /api/dashboard-data
```

Generates the static `dashboard-data.json` fallback. Called by the cron sync script.

#### 3.10 Token Stats

```
GET /api/tokens?period=today|week|month
```

Returns `TokenStats` as defined in the design spec.

#### 3.11 Collector Health

```
GET /api/health
```

```typescript
interface HealthResponse {
  collectors: CollectorHealth[]
  uptime: number
  dbSize: number           // bytes
  version: string
}
```

#### 3.12 WebSocket

```
ws://localhost:3001/ws
```

**Channels:**

| Channel | Interval | Payload |
|---------|----------|---------|
| `needs-you` | 5s | `NeedsYouItem[]` |
| `status` | 30s | Subset of `StatusResponse` (agents, workers, modelHealth) |

```typescript
// Client subscription
const ws = new WebSocket('ws://localhost:3001/ws')
ws.send(JSON.stringify({ subscribe: ['needs-you', 'status'] }))

// Server broadcast
ws.onmessage = (e) => {
  const msg: { channel: string; data: unknown } = JSON.parse(e.data)
  // msg.channel === 'needs-you' | 'status'
}
```

---

## 4. Database Schema

SQLite with WAL mode. FTS5 for search.

```sql
-- backend/schema-v3.sql

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ─── Core Tables ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📦',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK(status IN ('not_started', 'in_progress', 'done', 'killed')),
  stage TEXT DEFAULT 'idea'
    CHECK(stage IN ('idea', 'prd', 'prd_review', 'tech_spec', 'spec_review',
                    'implementation', 'qa', 'code_audit', 'deploy', 'live')),
  progress INTEGER DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  assigned_queen TEXT,
  impact INTEGER DEFAULT 0,
  effort INTEGER DEFAULT 0,
  day_in_stage INTEGER DEFAULT 0,
  total_days INTEGER DEFAULT 7,
  repo_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK(status IN ('queued', 'in_progress', 'blocked', 'review', 'done')),
  assigned_agent TEXT,
  priority TEXT DEFAULT 'medium',
  blocker_reason TEXT,
  blocked_by TEXT,
  action_required INTEGER DEFAULT 0,
  estimated_scope TEXT CHECK(estimated_scope IN ('S', 'M', 'L', NULL)),
  depends_on TEXT DEFAULT '[]',      -- JSON array of task IDs
  context TEXT,                       -- what agent is working on
  worktree TEXT,
  branch TEXT,
  files_touched TEXT DEFAULT '[]',   -- JSON array
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ─── Pipeline State ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS pipeline_state (
  project_id TEXT PRIMARY KEY REFERENCES projects(id),
  stage TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gates (
  project_id TEXT NOT NULL,
  gate_name TEXT NOT NULL,
  criteria TEXT NOT NULL,            -- JSON array of {label, passed}
  last_checked TEXT,
  PRIMARY KEY (project_id, gate_name)
);

-- ─── Agents ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🤖',
  role TEXT,
  status TEXT DEFAULT 'idle'
    CHECK(status IN ('idle', 'active', 'busy', 'error')),
  current_task TEXT,
  skills TEXT DEFAULT '[]',          -- JSON array
  stats_tasks_completed INTEGER DEFAULT 0,
  stats_success_rate REAL DEFAULT 0,
  stats_current_streak INTEGER DEFAULT 0,
  stats_weekly_velocity INTEGER DEFAULT 0,
  stats_today_cost REAL DEFAULT 0,
  memory_total_entries INTEGER DEFAULT 0,
  memory_last_updated TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  agent_model TEXT,                   -- e.g., "Codex 5.3", "Claude 4.6"
  task_id TEXT REFERENCES tasks(id),
  task_title TEXT,
  project_id TEXT,
  status TEXT DEFAULT 'queued'
    CHECK(status IN ('queued', 'active', 'done', 'failed')),
  cost REAL,
  duration_seconds INTEGER,
  queued_at TEXT DEFAULT (datetime('now')),
  spawned_at TEXT,
  completed_at TEXT
);

-- ─── Tokens & Cost ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                 -- YYYY-MM-DD
  agent_id TEXT,
  model TEXT NOT NULL,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  tokens_cached INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  project_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_tokens_date ON tokens(date);
CREATE INDEX IF NOT EXISTS idx_tokens_agent ON tokens(agent_id);

CREATE TABLE IF NOT EXISTS model_health (
  model TEXT PRIMARY KEY,
  status TEXT DEFAULT 'healthy'
    CHECK(status IN ('healthy', 'degraded', 'down')),
  failure_count INTEGER DEFAULT 0,   -- in 15-min window
  circuit_breaker TEXT DEFAULT 'closed'
    CHECK(circuit_breaker IN ('closed', 'half-open', 'open')),
  fallback_chain TEXT DEFAULT '[]',  -- JSON array
  last_success TEXT,
  last_failure TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ─── Activity & Events ──────────────────────────────────

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_type TEXT NOT NULL
    CHECK(action_type IN ('pipeline', 'stage_change', 'agent', 'cost',
                          'decision', 'github', 'deploy', 'alert',
                          'task_created', 'task_updated', 'project_created')),
  description TEXT NOT NULL,
  project_id TEXT,
  task_id TEXT,
  agent_id TEXT,
  metadata TEXT DEFAULT '{}',        -- JSON
  timestamp TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity(action_type);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS activity_fts USING fts5(
  description,
  content='activity',
  content_rowid='id'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS activity_ai AFTER INSERT ON activity BEGIN
  INSERT INTO activity_fts(rowid, description) VALUES (new.id, new.description);
END;

CREATE TRIGGER IF NOT EXISTS activity_ad AFTER DELETE ON activity BEGIN
  INSERT INTO activity_fts(activity_fts, rowid, description)
    VALUES ('delete', old.id, old.description);
END;

-- ─── Sessions ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  project_id TEXT,
  task_id TEXT,
  status TEXT DEFAULT 'active'
    CHECK(status IN ('active', 'completed', 'failed')),
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  started_at TEXT,
  completed_at TEXT
);

-- ─── Memory ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  type TEXT NOT NULL
    CHECK(type IN ('decision', 'observation', 'lesson', 'preference')),
  content TEXT NOT NULL,
  tags TEXT DEFAULT '[]',            -- JSON array
  project_id TEXT,
  freshness_score INTEGER DEFAULT 100,
  timestamp TEXT DEFAULT (datetime('now'))
);

-- ─── Roadmap ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roadmap (
  rank INTEGER,
  name TEXT NOT NULL,
  score REAL DEFAULT 0,
  status TEXT DEFAULT 'backlog'
    CHECK(status IN ('backlog', 'active', 'done', 'killed')),
  stage TEXT,
  day_in_cycle INTEGER,
  next_step TEXT,
  revenue_target TEXT,
  assigned_agent TEXT
);

-- ─── Linear Issues ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS linear_issues (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,          -- e.g., "KK-42"
  title TEXT NOT NULL,
  state TEXT,
  assignee_name TEXT,
  project_name TEXT,
  priority INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

-- ─── Koji Research ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS koji_research (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  date TEXT,
  tags TEXT DEFAULT '[]',            -- JSON array
  source TEXT DEFAULT 'koji-output',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ─── Collector Health ────────────────────────────────────

CREATE TABLE IF NOT EXISTS collector_health (
  name TEXT PRIMARY KEY,
  status TEXT DEFAULT 'healthy'
    CHECK(status IN ('healthy', 'degraded', 'down')),
  last_run TEXT,
  last_success TEXT,
  last_error TEXT,
  consecutive_failures INTEGER DEFAULT 0,
  expected_interval INTEGER          -- ms
);

-- ─── Needs You (SQL view — computed on read) ─────────────

CREATE VIEW IF NOT EXISTS needs_you AS
  -- Projects in deploy stage
  SELECT
    'deploy-' || p.id AS id,
    p.id AS project_id,
    p.name AS project_name,
    p.emoji AS project_emoji,
    'deploy' AS type,
    'Deploy approval needed' AS title,
    'Project passed QA and is ready for deployment' AS description,
    p.stage,
    p.updated_at AS waiting_since
  FROM projects p
  WHERE p.stage = 'deploy'

  UNION ALL

  -- Tasks with explicit blockers requiring human
  SELECT
    'blocker-' || t.id AS id,
    t.project_id,
    p.name AS project_name,
    p.emoji AS project_emoji,
    'blocker' AS type,
    t.title,
    t.blocker_reason AS description,
    p.stage,
    t.started_at AS waiting_since
  FROM tasks t
  JOIN projects p ON t.project_id = p.id
  WHERE t.status = 'blocked' AND t.action_required = 1

  UNION ALL

  -- Linear issues assigned to Xavier
  SELECT
    'linear-' || li.id AS id,
    NULL AS project_id,
    li.project_name,
    '📋' AS project_emoji,
    'linear' AS type,
    li.identifier || ': ' || li.title AS title,
    'Assigned to you in Linear' AS description,
    li.state AS stage,
    li.updated_at AS waiting_since
  FROM linear_issues li
  WHERE li.assignee_name = 'Xavier Liew'

  ORDER BY waiting_since ASC;
```

---

## 5. Integration Points

### 5.1 OpenClaw Gateway

| Aspect | Detail |
|--------|--------|
| Source | `$OPENCLAW_HOME/logs/gateway.log` |
| Data | Token usage, model routing, session mapping, latency, errors |
| Integration | Gateway collector (existing) reads log file tail |
| Auth | None (local file access) |
| Frequency | 5 seconds |

### 5.2 Linear API

| Aspect | Detail |
|--------|--------|
| Source | `https://api.linear.app/graphql` |
| Data | Issues, assignments, sprint data |
| Integration | Linear collector polls GraphQL API |
| Auth | `LINEAR_API_KEY` env var (personal API key) |
| Frequency | 15 minutes |
| Rate limit | 1,500 req/hour (well within at 4 req/hour) |

### 5.3 GitHub

| Aspect | Detail |
|--------|--------|
| Source | `gh` CLI (already authenticated) |
| Data | Commits, PRs, repo activity |
| Integration | GitHub collector (existing) |
| Auth | `gh` CLI auth (pre-configured) |
| Frequency | 5 minutes |
| Webhook | `POST /api/webhook/github` for real-time push events |

GitHub webhook validation:

```typescript
import { createHmac, timingSafeEqual } from 'crypto'

function verifyGitHubWebhook(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return false
  const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex')
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

### 5.4 Vercel

| Aspect | Detail |
|--------|--------|
| Deployment | `vercel --prod` via CLI |
| Static data | Cron pushes `dashboard-data.json` → git → Vercel auto-deploys |
| API proxy | Vite dev proxy `/api` → `localhost:3001` |
| Env vars | `VITE_API_URL` set in Vercel project settings |

### 5.5 File System Sources

| Source | Path | Collector |
|--------|------|-----------|
| Pipeline state | `/Users/devl/clawd/projects/*/pipeline.json` | pipeline |
| Event log | `/Users/devl/clawd/data/logs/events.jsonl` | pipeline |
| Roadmap | `/Users/devl/clawd/ROADMAP.md` | roadmap |
| Gateway logs | `$OPENCLAW_HOME/logs/gateway.log` | gateway |
| Session files | `$OPENCLAW_HOME/sessions/*.jsonl` | sessions |
| Agent memory | `$OPENCLAW_HOME/MEMORY.md`, `memory/*.md` | memory |
| Koji output | `/Users/devl/clawd/agents/koji/output/*.md` | koji |
| Model health | `/Users/devl/clawd/shared/model-health.js` | gateway |

---

## 6. Deployment

### Frontend (Vercel)

**`vercel.json`:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/dashboard-data.json",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=60, stale-while-revalidate=300" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Build pipeline:**

```bash
npm run build          # tsc -b && vite build
vercel --prod          # deploys dist/ to Vercel CDN
```

**Environment variables (Vercel project settings):**

```
VITE_API_URL=http://<mac-mini-ip>:3001/api   # or empty for JSON fallback
```

### Backend (Mac Mini — local)

**Process manager:** `pm2` or `launchd`

```bash
# pm2
pm2 start backend/server-v3.ts --name kato-dashboard-api --interpreter tsx

# Or launchd plist for Mac boot persistence
```

**`backend/.env`:**

```
PORT=3001
OPENCLAW_HOME=/Users/devl/clawd
GATEWAY_LOG_PATH=/Users/devl/.openclaw/logs/gateway.log
SESSIONS_DIR=/Users/devl/.openclaw/sessions
DASHBOARD_DB_PATH=./backend/data/dashboard.db
GITHUB_WEBHOOK_SECRET=<secret>
LINEAR_API_KEY=<key>
LINEAR_TEAM_ID=<team-id>
WS_HEARTBEAT_INTERVAL=30000
LOG_LEVEL=info
DAILY_BUDGET_LIMIT=20
```

### Static Data Sync (cron)

Runs every 10 minutes on Mac mini:

```bash
# crontab entry
*/10 * * * * cd /Users/devl/clawd/projects/kato-dashboard && node scripts/sync-dashboard-data.js
```

```typescript
// scripts/sync-dashboard-data.js
// 1. GET /api/dashboard-data from local backend
// 2. Write to public/dashboard-data.json
// 3. git add + commit + push (triggers Vercel deploy)
```

---

## 7. Security

### API Key Management

| Secret | Storage | Access |
|--------|---------|--------|
| `GITHUB_WEBHOOK_SECRET` | `backend/.env` | Backend only |
| `LINEAR_API_KEY` | `backend/.env` | Backend only |
| `BRAVE_API_KEY` | `backend/.env` | Backend only (search) |

**Rules:**
- `.env` files are in `.gitignore` — never committed.
- No secrets in frontend code. `VITE_*` env vars are public by definition.
- 1Password Kato vault is the source of truth for all secrets.

### Authentication

**None for v3.** The dashboard is Xavier-only (PRD non-goal). The backend runs on a local network. Access control is at the network level (Mac mini firewall / router).

If public access is ever needed, add Cloudflare Tunnel or Tailscale for private networking, plus a bearer token middleware:

```typescript
// backend/middleware/auth.ts (future, not for v3)
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token !== process.env.DASHBOARD_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

// Webhook endpoint — protect from abuse
const webhookLimiter = rateLimit({ windowMs: 60_000, max: 60 })
app.use('/api/webhook', webhookLimiter)

// General API — generous since it's single-user local
const apiLimiter = rateLimit({ windowMs: 60_000, max: 300 })
app.use('/api', apiLimiter)
```

### Input Validation

```typescript
import { z } from 'zod'

const ActionSchema = z.object({
  action: z.enum(['approve_deploy', 'defer', 'dismiss']),
  targetType: z.enum(['project', 'task', 'linear_issue']),
  targetId: z.string().min(1).max(100),
  metadata: z.record(z.unknown()).optional(),
})

app.post('/api/actions', (req, res) => {
  const parsed = ActionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }
  // ... handle action
})
```

### CORS

```typescript
app.use(cors({
  origin: [
    'http://localhost:5174',              // Vite dev
    'https://kato-dashboard.vercel.app',  // Production
  ],
  methods: ['GET', 'POST'],
}))
```

---

## 8. Testing Strategy

### Unit Tests (Vitest)

**Target:** Collectors, data transformers, utility functions.

```typescript
// backend/collectors/__tests__/roadmap.test.ts
import { describe, it, expect } from 'vitest'
import { parseRoadmapTable } from '../roadmap'

describe('parseRoadmapTable', () => {
  it('parses standard markdown table', () => {
    const md = `
# Roadmap
| Rank | Product | Score | Status | Stage |
|------|---------|-------|--------|-------|
| 1 | Move PWA | 8.5 | active | implementation |
| 2 | DeFi Monitor | 7.2 | backlog | idea |
`
    const rows = parseRoadmapTable(md)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      rank: 1, name: 'Move PWA', score: 8.5, status: 'active'
    })
  })

  it('returns empty for missing table', () => {
    expect(parseRoadmapTable('# No table here')).toEqual([])
  })
})
```

```typescript
// backend/collectors/__tests__/pipeline.test.ts
import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'

describe('pipeline collector', () => {
  it('detects stage transitions and emits activity', async () => {
    const db = new Database(':memory:')
    // setup schema, seed previous state
    // run collector
    // assert activity row created for stage change
  })

  it('upserts tasks without duplicating', async () => {
    // run collector twice with same data
    // assert task count unchanged
  })
})
```

### Integration Tests

**Target:** API endpoints return correct shape and data.

```typescript
// backend/__tests__/api.test.ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../server-v3'

describe('GET /api/status', () => {
  it('returns all required fields', async () => {
    const res = await request(app).get('/api/status')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('needsYou')
    expect(res.body).toHaveProperty('activeTasks')
    expect(res.body).toHaveProperty('agents')
    expect(res.body).toHaveProperty('collectorHealth')
  })
})

describe('GET /api/activity', () => {
  it('supports FTS5 search', async () => {
    const res = await request(app).get('/api/activity?search=deploy')
    expect(res.status).toBe(200)
    expect(res.body.items).toBeInstanceOf(Array)
  })

  it('filters by type', async () => {
    const res = await request(app).get('/api/activity?type=pipeline')
    expect(res.status).toBe(200)
    for (const item of res.body.items) {
      expect(['pipeline', 'stage_change']).toContain(item.action_type)
    }
  })
})

describe('POST /api/actions', () => {
  it('rejects invalid action', async () => {
    const res = await request(app)
      .post('/api/actions')
      .send({ action: 'hack', targetType: 'project', targetId: 'x' })
    expect(res.status).toBe(400)
  })
})
```

### Frontend Component Tests

**Target:** Critical UI components render correctly with mock data.

```typescript
// src/components/__tests__/NeedsYouSection.test.tsx
import { render, screen } from '@testing-library/react'
import { NeedsYouSection } from '../NeedsYouSection'

it('shows empty state when no items', () => {
  render(<NeedsYouSection items={[]} />)
  expect(screen.getByText(/all clear/i)).toBeInTheDocument()
})

it('shows pulsing badge with count', () => {
  render(<NeedsYouSection items={[mockNeedsYouItem]} />)
  expect(screen.getByText('1')).toBeInTheDocument()
})

it('sorts by longest waiting first', () => {
  const items = [
    { ...mockItem, waitingSince: '2026-03-10T12:00:00Z', title: 'Recent' },
    { ...mockItem, waitingSince: '2026-03-10T10:00:00Z', title: 'Oldest' },
  ]
  render(<NeedsYouSection items={items} />)
  const titles = screen.getAllByRole('heading').map(h => h.textContent)
  expect(titles[0]).toContain('Oldest')
})
```

### E2E Smoke Tests (Playwright)

```typescript
// e2e/smoke.test.ts
import { test, expect } from '@playwright/test'

test('Now tab loads and shows sections', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Needs You')).toBeVisible()
  await expect(page.getByText('Active Work')).toBeVisible()
  await expect(page.getByText('Agent Status')).toBeVisible()
})

test('keyboard shortcuts work', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('/')
  await expect(page.getByPlaceholder(/search/i)).toBeFocused()
  await page.keyboard.press('Escape')
  await page.keyboard.press('2')
  await expect(page).toHaveURL('/pipeline')
})

test('fallback mode works without backend', async ({ page }) => {
  await page.route('**/api/**', route => route.abort())
  await page.goto('/')
  await expect(page.getByText('Needs You')).toBeVisible()
})
```

### Coverage Targets

| Layer | Target | Tool |
|-------|--------|------|
| Collector logic | 80% | Vitest |
| API endpoints | 90% | Vitest + supertest |
| Frontend components | 70% | Vitest + @testing-library/react |
| E2E critical paths | 5 flows | Playwright |
| Type safety | 100% | `tsc -b --noEmit` in CI |

### CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
      - run: npm test
```

---

## Appendix: Phase Mapping

| Phase | Backend | Frontend | Collectors |
|-------|---------|----------|------------|
| **Phase 1 (Week 1)** | Schema v3 migration, `/api/status`, `/api/activity`, `/api/search`, `/api/actions`, WebSocket, FTS5 | Now tab (all 8 sections), top bar, search overlay, keyboard shortcuts, detail drawer, stale data indicators, collector health footer | Pipeline (new), collector health monitor (new) |
| **Phase 2 (Week 2)** | `/api/pipeline`, `/api/roadmap`, `/api/research` | Pipeline tab (board, roadmap table, Koji research) | Roadmap (new), Koji (new) |
| **Phase 3 (Week 3)** | `/api/linear-issues`, extended "Needs You" signals | Linear issue links, extended Needs You, virtualized lists, accessibility pass | Linear (new) |
