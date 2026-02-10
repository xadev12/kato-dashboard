# Kato Dashboard v3 - PRD Rebuild

## Ralph Loop Analysis

**Current State Assessment:**
- Dashboard has 6+ disconnected features (Kanban, Agent Roster, Token Dashboard, Memory Manager, Activity Feed, Project Detail)
- No clear "one job" — it's trying to be everything
- Auto-update system exists but purpose is unclear
- Token stats collected but not actionable
- Data scattered between SQLite, JSON, and session files

**Core Problem:** The dashboard lacks a single, clear purpose. It monitors agents, tracks projects, shows tokens, manages memory — but doesn't do any of them exceptionally well.

---

## 1. Product Vision

### One-Sentence Purpose
**Kato Dashboard is the mission control for Xavier's AI-powered product building system** — it shows what's happening, what's blocked, and what needs attention across all active work.

### Core Job-to-be-Done
When Xavier (or Kato) opens the dashboard, they should immediately know:
1. What are we building right now?
2. Is anything blocked or stuck?
3. How much is this costing (tokens/time)?
4. What should I focus on next?

### Target User
- **Primary:** Kato (me) — for daily orchestration and coordination
- **Secondary:** Xavier — for weekly reviews and strategic decisions

---

## 2. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to understand status | < 10 seconds | Can answer "what's happening?" at a glance |
| Actionability | 80%+ | Every visible item has a clear next action |
| Data freshness | < 5 minutes | All metrics auto-update in real-time |
| Decision speed | 2x faster | Reduce time to identify blockers vs current |

---

## 3. Key Principles

1. **Single Source of Truth** — Everything in one view, no jumping between pages
2. **Action-Oriented** — Every item shows status + next action, not just data
3. **Signal over Noise** — Hide things that don't need attention, surface what does
4. **Mobile-First** — Check status on phone while away from desk
5. **Auto-Updating** — Never manually refresh; data flows in automatically

---

## 4. Feature Redesign

### 4.1 Main Dashboard View (/) — THE Mission Control

**Layout:** Single-screen, 3-column layout (desktop) / stacked (mobile)

```
┌─────────────────────────────────────────────────────────────┐
│  KATO DASHBOARD                    [Last updated: 2m ago]   │
│  60-Day Sprint: Day 2 of 60          [Active: 3 | Blocked: 1]│
├──────────────────┬──────────────────┬───────────────────────┤
│  ACTIVE WORK     │  QUEUE           │  SYSTEM HEALTH        │
│  (What's now)    │  (What's next)   │  (What's costing)     │
├──────────────────┼──────────────────┼───────────────────────┤
│                  │                  │                       │
│  MBTI Horoscope  │  □ Move Profile  │  Tokens Today: $12.40 │
│  [In Progress]   │  □ Audio Cues    │  ━━━━━━━━░░░░ 65%     │
│  Progress: 15%   │  □ Social Feat   │  Budget: $20/day      │
│                  │                  │                       │
│  ⚠️ Blocked:     │                  │  Active Agents: 3     │
│  SwiftUI build   │                  │  ━━●━━ Yuki (busy)    │
│  [View logs]     │                  │  ━━━━● Koji (idle)    │
│                  │                  │  ━━●━━ Sora (busy)    │
│  [View project →]│  [View roadmap →]│  [View details →]     │
│                  │                  │                       │
└──────────────────┴──────────────────┴───────────────────────┘
```

**Active Work Column:**
- Shows only projects with status = "in_progress"
- Progress bar with %
- Current blocker (if any) with quick link
- Assigned queen agent
- Auto-updates from pipeline.json files

**Queue Column:**
- Next 3 items from ROADMAP.md (P1 only)
- Shows priority order
- Tap to view full roadmap

**System Health Column:**
- Token usage today vs daily budget
- Active agents with status indicators
- Quick "cost per project" breakdown
- Alert if over budget

### 4.2 Project Detail View (/project/:id)

**Purpose:** Deep-dive into a single project

**Sections:**
1. **Header:** Project name, status, progress %, GitHub link
2. **Current Status:** One-line summary of what's happening NOW
3. **Blockers:** List of blockers with severity (if none, show "Clear sailing")
4. **Task Board:** Kanban-style (Backlog → In Progress → Done)
5. **Agent Activity:** Which agents worked on this, when, token cost
6. **Recent Commits:** Auto-fetched from GitHub
7. **Next Actions:** Suggested next steps based on current state

### 4.3 Token Dashboard (/tokens) — SIMPLIFIED

**Current Problem:** Too much data, not actionable

**Redesign:**
- **Today:** Current day's spend vs budget
- **This Sprint:** Cumulative spend vs sprint budget
- **By Project:** Which projects are costing the most
- **By Agent:** Which agents are most expensive
- **Alert:** Red banner if approaching daily limit

**Remove:**
- Hourly breakdowns (too granular)
- Model-level breakdown (too detailed)
- Historical charts beyond 7 days

### 4.4 Agent Roster (/roster) — SIMPLIFIED

**Current Problem:** Shows all agents including archived, no clear status

**Redesign:**
- **Active Agents:** Currently working on something (show task, project, busy/idle)
- **Available Agents:** Idle, ready for assignment
- **Recent Activity:** Last 5 actions across all agents

**Remove:**
- Detailed skill lists (clutter)
- Archived agents (hide in "Show archived" toggle)
- Worker queue (move to pipeline view)

### 4.5 Memory Manager (/memory) — MERGED

**Decision:** Merge into main dashboard. Show "Memory alerts" in System Health column instead of separate page.

**Alerts show:**
- "MEMORY.md outdated (last updated 3 days ago)"
- "3 unprocessed voice memos in inbox"
- Tap to delegate to Sora

---

## 5. Data Architecture

### 5.1 Single Source of Truth

| Data | Source | Update Frequency |
|------|--------|------------------|
| Project status | `projects/*/pipeline.json` | Real-time (file watcher) |
| ROADMAP | `ROADMAP.md` | On change |
| Agent status | OpenClaw gateway API | Every 30 seconds |
| Token usage | `~/.openclaw/agents/*/sessions/*.jsonl` | Every 5 minutes |
| GitHub activity | GitHub API | Every 10 minutes |
| Task updates | `update-dashboard` CLI | On command |

### 5.2 Backend Simplification

**Current:** Multiple collectors, SQLite database, complex sync

**New:** Lightweight API that reads directly from source files

```
Backend API (Express)
├── /api/status          → Returns unified dashboard state
├── /api/projects        → Reads from pipeline.json files
├── /api/roadmap         → Parses ROADMAP.md
├── /api/agents          → Queries gateway status
├── /api/tokens          → Aggregates session files
└── /api/project/:id     → Deep-dive for specific project
```

**No SQLite.** Read from source of truth directly.

### 5.3 Auto-Update System v2

Simplify the `update-dashboard` CLI:

```bash
# Old (complex)
update-dashboard --project="kato-dashboard" --task="add ROI badges" --status=done

# New (simple)
update-dashboard "kato-dashboard" "add ROI badges" done
```

**What it does:**
1. Updates the project's pipeline.json directly
2. Commits with message: "[kato-dashboard] add ROI badges → done"
3. Triggers Vercel deploy

**No intermediate JSON files.** Write directly to source.

---

## 6. UI/UX Specifications

### 6.1 Design System

- **Theme:** Dark mode only (black bg: #030712)
- **Primary accent:** Cyan (#06b6d4) for active/in-progress
- **Secondary accent:** Emerald (#10b981) for done/success
- **Warning:** Amber (#f59e0b) for blockers/warnings
- **Typography:** Inter (system fallback)
- **Card style:** Subtle borders, no heavy shadows

### 6.2 Mobile-First Breakpoints

- **Mobile:** < 640px — Single column, stacked sections
- **Tablet:** 640-1024px — Two columns
- **Desktop:** > 1024px — Three columns

### 6.3 Navigation

**Simplify to 4 items:**
1. **Dashboard** (/) — Main mission control
2. **Projects** (/projects) — List all projects, filter by status
3. **Tokens** (/tokens) — Cost tracking
4. **Roster** (/roster) — Agent status

**Remove:**
- /legacy (deprecated)
- /actions (merge into dashboard)
- /memory (merge into dashboard alerts)
- Project detail from main nav (accessible via cards)

---

## 7. Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Refactor backend to read from source files (no SQLite)
- [ ] Create unified `/api/status` endpoint
- [ ] Update dashboard-data.json schema to match new design

### Phase 2: Main Dashboard (Week 1-2)
- [ ] Build 3-column mission control layout
- [ ] Implement Active Work column (reads pipeline.json)
- [ ] Implement Queue column (reads ROADMAP.md)
- [ ] Implement System Health column (tokens + agents)

### Phase 3: Simplified Views (Week 2)
- [ ] Redesign Token Dashboard (simplified)
- [ ] Redesign Agent Roster (simplified)
- [ ] Remove legacy pages

### Phase 4: Polish (Week 3)
- [ ] Mobile responsiveness
- [ ] Auto-refresh (WebSocket or polling)
- [ ] Update CLI tool to write directly to pipeline.json

---

## 8. Open Questions

1. **Token budget:** What's the daily target? ($20/day assumed)
2. **Sprint budget:** What's the 60-day token budget?
3. **Agent assignment:** Should we show which agent owns which task?
4. **Blocker detection:** How do we auto-detect when something is stuck?

---

## 9. Appendix: Current vs Proposed

| Feature | Current | Proposed |
|---------|---------|----------|
| Main view | Kanban + stats everywhere | Mission control, 3 columns |
| Pages | 7+ pages | 4 pages |
| Data source | SQLite + JSON | Direct from source files |
| Updates | Complex CLI | Simple CLI, auto-refresh |
| Mobile | Usable but cluttered | First-class mobile experience |
| Purpose | Unclear | Clear: "What's happening now?" |

---

**Decision:** Proceed with Phase 1. The current dashboard is functional but unfocused. This rebuild makes it a true mission control — clear, actionable, and mobile-friendly.
