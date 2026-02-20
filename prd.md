# PRD: Kato Dashboard v3

**Author:** Kato
**Date:** 2026-02-21
**Status:** Draft
**Project:** kato-dashboard

---

## Goals

1. **10-second situational awareness** — Xavier opens the dashboard and immediately knows: what's active, what's stuck, what needs him. No clicks required for the headline picture.
2. **Individual item granularity** — Every task is a first-class card with its own status, assigned agent, and progress. No hiding detail behind project-level rollups.
3. **Human-required actions are unmissable** — Deploy approvals, decision requests, budget alerts, and blocker escalations pin to the top of the screen and cannot be scrolled past.
4. **Full pipeline legibility** — The entire product factory (idea → deploy → live) is visible as a horizontal assembly line with clear gates, blockers, and next steps per project.
5. **Cost transparency** — Token spend, rate limits, model health, and budget headroom are always one glance away. No surprise bills.

## Non-Goals

- **Not a task editor** — Read + approve/action only. Task creation and editing happen in Linear, agent workspaces, or via Kato. The dashboard surfaces work; it doesn't create it.
- **Not an agent chat UI** — No prompt editing, no inline messaging. Agent interaction stays in OpenClaw channels.
- **Not a memory editor** — Memory viewing is fine; editing stays in agent workspaces or Obsidian.
- **No auth / multi-tenant** — Xavier-only. No login, no user system.
- **No native app** — Responsive web. Must work on iOS Safari (primary mobile device).
- **No heavy charting** — Progress bars, badges, sparklines, and compact tables. No D3/Recharts unless truly needed.

## Users

| User | Usage Pattern |
|------|---------------|
| **Xavier** (primary) | Morning check-in, async monitoring throughout day, deploy approvals, unblocking decisions. iOS Safari + desktop. |
| **Kato** (system) | Writes data via collectors, cron sync, webhooks. Never views the UI. |

Xavier's question every time he opens the dashboard:
> "What needs me, what's moving, and is anything stuck?"

---

## Core Views & UX

Two tabs. **Now** is the dense command center covering active work, blockers, human actions, and system status. **Pipeline** is the full product factory view with roadmap and research. Content hierarchy: most urgent / actionable at top, reference material lower, progressive disclosure via collapsible sections and slide-in drawers.

### Global Elements (all tabs)

**Top Bar:**
- Tab navigation: **Now** | **Pipeline**
- "Needs You" badge count (red dot when > 0, visible on both tabs)
- Last sync timestamp + manual refresh button
- Global search (opens overlay — searches projects, tasks, agents, activity; results grouped by type)

**Stale Data Handling:**
- Every card shows relative "last updated" time
- Amber border on data > 15 min old
- Red border + "stale" badge on data > 1 hr old
- Per-collector health indicator in footer (green/amber/red dot per source: Gateway, GitHub, Sessions, Memory, Pipeline, Linear)

**Keyboard Shortcuts:**
- `1`–`2` switch tabs
- `/` focus search
- `r` force refresh
- `?` shortcut overlay

---

### Tab 1: Now (default, `/`)

The command center. Eight sections in descending urgency. Sections 1–3 are always visible. Sections 4–8 use collapsible accordions.

---

#### 1. Needs You (pinned top, never collapses)

Cards requiring Xavier's action. **The single most important section of the entire dashboard.** If empty, everything is flowing.

**What surfaces here:**
- Tasks with `action_required` flag (deploy approvals, review sign-off)
- Projects in `qa` or `deploy` stage awaiting human sign-off
- `decision_pending` events (`open-questions.md` exists for a project)
- Budget alerts (daily spend > 80% of limit)
- Gate failures requiring human override
- TestFlight / App Store submissions needing action
- Day 7 signal/kill decisions due
- Any Linear issue assigned to Xavier

**Card format:**
```
[Project Emoji] Project Name — Action Type
"Approve deploy for Move Weight Tracking"
Stage: deploy | Waiting: 2h 14m
[Open] [Approve] [Defer]
```

Sorted by wait time (longest waiting first). Empty state: **"All clear — nothing needs you right now"** with last-cleared timestamp.

---

#### 2. Active Work (Kanban — always visible)

Three-column Kanban of everything currently in motion at the **individual task level**:

| In Progress | Blocked | Ready for Review |
|-------------|---------|------------------|
| Task cards with: project name, task title, assigned agent, time active | Task cards with blocker reason prominent + time blocked + who/what is blocking | Tasks in review/QA stages awaiting sign-off |

**Project summary rows** sit above the Kanban columns (one per active project):
```
[Emoji] Project Name    [=====>    ] 5/8 tasks    Stage: implementation    2 active workers
```

**Task card (compact):**
```
[Project] Task Title
Agent: Codex | 12m active
Context: implementing auth middleware
```

Clicking a task card opens a **detail drawer** (slide-in from right) showing:
- Full task description
- Current agent activity (worktree, branch, files touched)
- Blocker details + suggested next steps (if blocked)
- Time in current stage
- Token cost so far for this task

---

#### 3. Ready for Deploy (always visible when non-empty)

Dedicated strip for items that have passed QA and are deployment-ready. These are distinct from "Needs You" — they don't require a decision, they require an action (merging, deploying, submitting to App Store).

**Card format:**
```
[Emoji] Project Name — Ready to deploy
QA passed: 2h ago | Branch: main
[Deploy Now] [View Details]
```

If empty, this section collapses to a single line: "Nothing ready for deploy."

---

#### 4. Mapped Out Work (collapsible, collapsed by default)

Tasks that are **queued but not yet in progress**, organized by project. Each entry shows:
- Task title
- Dependencies / what it's waiting on
- Next step (what triggers this task to start)
- Estimated scope (S/M/L if available)

Answers "what's coming next" without cluttering active work.

---

#### 5. Agent Status (collapsible, expanded by default)

**Queen Agent Cards** — 5 cards in a responsive row:

```
[Emoji] Agent Name — Role
Status: active | Current: "Reviewing MoveApp QA report"
Today: 12 tasks | $2.40 spent
```

Status dot: green = active, grey = idle, amber = busy, red = error.

Clicking opens agent detail drawer:
- Current task + context
- Recent activity (last 24h)
- Token breakdown by model
- Active project assignments
- Memory stats (entry count, last updated)

**Worker Queue** — compact table below agent cards:

| Status | Agent/Model | Task | Project | Duration |
|--------|-------------|------|---------|----------|
| Active | Codex 5.3 | implement auth | MoveApp | 4m |
| Queued | — | design review | Aura | waiting |
| Done (1h) | Claude 4.6 | write tests | DeFi | 8m, $0.32 |

**Model Health Strip:**
```
Codex: ● healthy | Claude: ● healthy | Kimi: ○ degraded (1 fail) | MiniMax: ● healthy
```

---

#### 6. Token Usage & Rate Limits (collapsible, collapsed by default)

**Daily Budget Bar (prominent):**
```
$8.42 / $20.00 today    [==========>          ] 42%
```
Color: green → amber (>60%) → red (>85%).

**Spend Trend** — 7-day sparkline showing daily cost. Pace line at $20/day budget.

**Breakdown Tables (side by side):**

By Project:
| Project | Today | Sprint Total | Sessions | Avg $/session |
|---------|-------|-------------|----------|---------------|

By Agent + Model:
| Agent | Model | Tokens (in/out/cache) | Cost | Efficiency |
|-------|-------|-----------------------|------|------------|

**Rate Limit Cards** — per model: current usage vs cap, circuit breaker state, failure count (15m window), fallback chain.

---

#### 7. Progress Log (collapsible, collapsed by default)

Searchable, filterable chronological activity feed merging all system events:

```
[2m ago]  [stage]    Move Weight → qa stage (gate passed)
[5m ago]  [agent]    Codex spawned for move-weight-tracking/task-7
[8m ago]  [cost]     Budget alert: 80% of daily limit reached
[12m ago] [decision] Aura: TestFlight cert issue — needs Xavier
[15m ago] [github]   3 commits pushed to move-weight-tracking
```

**Event types:** pipeline (stage advances, gate results), agent (spawn/complete/fail), cost (budget alerts, high-spend sessions), decision (pending/resolved), github (commits, PRs, merges).

**Filters:**
- Event type (multi-select pills)
- Project (dropdown)
- Agent (dropdown)
- Date range
- Full-text search

**Retention:** 30 days in the feed, older data queryable via search.

---

#### 8. Recently Completed (collapsible, collapsed by default)

Tasks and projects completed in the last 7 days. Shows throughput. Each entry: task title, project, agent, completion time, token cost.

---

### Tab 2: Pipeline (`/pipeline`)

Full product factory visualization, roadmap, and Koji research. Three sections.

---

#### Section A: Pipeline Board (default, always visible)

Horizontal swim-lane columns representing pipeline stages:

```
idea | prd | tech_spec | implementation | qa | code_audit | deploy | live
                                         [Move]            [DeFi]
```

Each project card in its current stage column:
- Project name + emoji
- Days in current stage
- Assigned agent (if any)
- Blocker indicator (red dot if blocked, hover for reason)
- Task progress (e.g., 3/8 tasks done)
- Day X/7 indicator (for products in the 7-day cycle)

**Health color coding:**
- Green = moving (activity in last 2 hours)
- Amber = slow (no activity 2–12 hours)
- Red = blocked (explicit blocker or no activity > 12 hours)

Clicking a stage boundary shows gate criteria (what's checked, pass/fail, last check timestamp).

Clicking a project card opens the detail drawer with full task Kanban for that project.

---

#### Section B: Roadmap Queue (searchable table)

Searchable, sortable table of all items from `ROADMAP.md`:

| Rank | Product | Score | Status | Stage | Day X/7 | Next Step | Revenue Target |
|------|---------|-------|--------|-------|---------|-----------|----------------|

**Filters:** Status (backlog / active / done / killed), priority tier, assigned agent.

This is the "what's mapped out" view — the full queue with next steps visible.

---

#### Section C: Koji Research Ideas (collapsible, expanded by default)

Dedicated section for Koji's strategic output:
- Competitive intelligence findings
- Market opportunity scans
- Product idea evaluations
- Strategy recommendations

**Source:** `agents/koji/output/`, activity events tagged `koji`, Koji's `MEMORY.md` strategic entries.

Each entry: title, summary, date, relevance tags. Clicking expands full research note. Sorted by recency.

Empty state: "No recent research. Koji runs competitive scans on a monthly cadence."

---

## Data Sources

| Source | Provides | Integration | Refresh |
|--------|----------|-------------|---------|
| **Pipeline JSON** (`projects/*/pipeline.json`) | Project stages, tasks, gate status, blockers, artifacts | File watcher collector → SQLite | Real-time (on change) |
| **Event Log** (`data/logs/events.jsonl`) | Agent lifecycle, cost events, stage transitions, decisions | Tail → SQLite `activity` + `pipeline_events` tables | Real-time (append) |
| **Linear API** (Team: KopiKoubou) | Issue status, sprint data, assignments, Xavier-assigned items | API poller via `scripts/linear-sync-issues.js` → SQLite | Every 15 min |
| **Gateway Logs** (`logs/gateway.log`) | Token counts, model breakdown, per-request cost, session IDs | Existing gateway collector → SQLite `tokens` table | Every 5 sec |
| **GitHub** (via `gh` CLI) | Commits, PRs, merge status, repo activity | Existing GitHub collector → SQLite `projects` + `activity` | Every 5 min |
| **Session Files** (`sessions/*.jsonl`) | Task lifecycle, agent actions, token usage per session | Existing session collector → SQLite `sessions` table | Every 2 min |
| **Agent Memory** (`MEMORY.md` + `memory/YYYY-MM-DD.md`) | Decisions, observations, lessons, preferences | Existing memory collector → SQLite `memory` table | Every 10 min |
| **ROADMAP.md** | Feature backlog with priority scores, sprint targets | New: markdown parser → structured JSON | On change / daily |
| **Model Health** (`shared/model-health.js`) | Circuit breaker state, failure history per model | Backend reads state on API call | On-demand |
| **Koji Output** (`agents/koji/output/`) | Research findings, competitive intel, strategy recs | New: file scanner → SQLite | Hourly |
| **Agent State** (`dashboard-data.json` + agent workspaces) | Queen status, current tasks, worker queue | Existing sync script | Every 10 min |
| **GitHub Webhooks** (`/api/webhook/github`) | Real-time commits, PRs, releases | Existing webhook receiver | Real-time (push) |

### New Collectors Needed

1. **Pipeline file watcher** — Watch `projects/*/pipeline.json` for changes, update SQLite, emit activity events.
2. **ROADMAP parser** — Parse `ROADMAP.md` into structured rows (rank, name, score, status, stage, revenue target). Already partially implemented in `scripts/build-dashboard-data.cjs`.
3. **Koji output scanner** — Index research docs from `agents/koji/output/` and strategic entries from Koji's MEMORY.md.
4. **Linear API poller** — Pull issues into dashboard DB. Map Linear states to pipeline stages. Detect Xavier-assigned items for "Needs You" section. Foundation exists in `scripts/linear-sync-issues.js`.

### Existing Collectors (no changes needed)

- Gateway collector (`backend/collectors/gateway.ts`)
- GitHub collector (`backend/collectors/github.ts`)
- Session collector (`backend/collectors/sessions.ts`)
- Memory collector (`backend/collectors/memory.ts`)

---

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| **Time to awareness** | < 10 sec from page load to "I know what's happening" | LCP < 2s; Xavier self-report |
| **Blocked items cleared faster** | 50% reduction in avg "Needs You" dwell time | Track `decision_pending` → `decision_resolved` duration in `pipeline_events` |
| **Zero missed deploys** | Every deploy-ready item surfaces in "Needs You" within 1 pipeline cycle (15 min) | Audit deploy-stage items vs Needs You panel |
| **Budget surprises eliminated** | Xavier always sees spend before hitting limit | Budget alert timing vs actual limit breach |
| **Daily active use** | Xavier opens dashboard at least once per day | Simple page view counter |
| **Action completion rate** | > 80% of "Needs You" items resolved within 4 hours of surfacing | Track card surfaced time → action taken |

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Data staleness** | Xavier sees old state, makes wrong decisions | Amber/red stale borders; per-collector health dots in footer; auto-refresh on tab focus; relative timestamps on every card |
| **Backend down** (Mac mini offline) | No live data | `dashboard-data.json` fallback keeps Now tab readable; static export captures enough for read-only awareness; frontend detects offline and shows banner |
| **Information overload** | Too much on screen defeats "at a glance" | Strict hierarchy: Needs You pinned top; everything else progressively disclosed via collapsed sections and drawers; 2 tabs not 5 |
| **Pipeline schema drift** | New stages or fields break the parser | Defensive parsing with fallback defaults; schema version check in `pipeline.json` |
| **Collector failures go silent** | Data goes stale without warning | Per-source "last collected" timestamp in footer; amber alert if any collector hasn't run in > 2x its interval |
| **Linear API rate limits** | Over-polling hits caps | 15-min interval well within limits; response caching; exponential backoff on 429 |
| **Mobile layout breaks** | iOS Safari is primary but complex layouts are dense | Design mobile-first for Now tab (stack columns vertically); Pipeline board scrolls horizontally; all sections stack on narrow viewports |
| **Needs You false positives** | Too many non-urgent items in the top section erode trust | Strict qualification criteria; only items that truly block pipeline progress surface here; add "dismiss" action to snooze non-critical items |

---

## Rollout

### Phase 1: Now Tab (Week 1)

Replace current MissionControl with the new Now tab. This is the core experience.

- [ ] **Needs You section**: detect `action_required`, `decision_pending`, deploy-ready projects, budget alerts, Day 7 decisions
- [ ] **Active Work Kanban**: individual task cards in In Progress / Blocked / Ready for Review columns
- [ ] **Project summary rows** above Kanban
- [ ] **Ready for Deploy strip**: items that passed QA awaiting deploy action
- [ ] **Mapped Out Work accordion**: queued tasks by project with dependencies and next steps
- [ ] **Agent Status section**: 5 queen cards + worker queue table + model health strip
- [ ] **Token Usage section**: daily budget bar, 7-day sparkline, breakdown tables, rate limit cards
- [ ] **Progress Log**: unified activity feed with type/project/agent/date filters
- [ ] **Recently Completed section**: last 7 days throughput
- [ ] **Detail drawer** (slide-in) for task/project/agent deep-dive
- [ ] **Top bar**: tab nav, Needs You badge, global search, last-sync timestamp
- [ ] **Stale data indicators**: amber/red borders, relative timestamps
- [ ] **Keyboard shortcuts**: `1`–`2` tabs, `/` search, `r` refresh, `?` help
- [ ] **JSON fallback** for when backend is offline
- [ ] **Backend: Pipeline file watcher collector**

### Phase 2: Pipeline Tab (Week 2)

Full product factory view + roadmap + research.

- [ ] **Pipeline Board**: horizontal swim-lane with stage columns, project cards, health coloring, gate inspection
- [ ] **Roadmap Table**: parsed from `ROADMAP.md`, searchable and sortable with status/priority filters
- [ ] **Koji Research section**: scanner for `agents/koji/output/`, display research entries with expand/collapse
- [ ] **Backend: ROADMAP parser collector**
- [ ] **Backend: Koji output scanner collector**

### Phase 3: Polish + Integrations (Week 3)

Refinement and external data.

- [ ] **Linear API poller**: pull issues, detect Xavier-assigned items, map states to pipeline stages
- [ ] **Linear issue links** on project/task cards
- [ ] **Mobile Safari responsive pass**: Now tab stacks vertically, Pipeline scrolls horizontally
- [ ] **Performance**: virtualized lists for activity feed and roadmap table
- [ ] Cross-browser testing (Safari, Chrome, Firefox)
- [ ] Accessibility pass (keyboard nav, screen reader labels, color contrast)

---

## Open Questions

1. **WebSocket vs polling?** Backend has WebSocket infra. Is reliable WebSocket worth the complexity, or is 5-second polling adequate for Xavier's usage pattern?
2. **Inline actions vs deep links?** Should "Approve deploy" trigger the action from the dashboard, or deep-link to the right tool/file?
3. **Koji interactivity?** Read-only research feed, or can Xavier trigger research tasks from the dashboard?
4. **Linear as source of truth?** Should Linear replace pipeline.json as the canonical task tracker, or remain a mirror?
