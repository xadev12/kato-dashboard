# Design Spec: Kato Dashboard v3

**Product:** Kato Dashboard
**Date:** 2026-03-10
**Aesthetic:** Warm wabi-sabi command center — dense but breathable, calm authority
**References:** Linear (information density + keyboard nav), Apple Fitness+ (warm palette), Notion (structured progressive disclosure)

---

## Visual Aesthetic & Mood

**Overall feel:** A warm, confident command center that feels like a well-organized workshop — everything in its place, nothing hidden when it matters. Cream backgrounds with brown accents create a calm authority that doesn't fatigue during long monitoring sessions. Information density is high but never cluttered — whitespace breathes between sections, and progressive disclosure keeps noise at bay.

**Key words:** warm, precise, dense, calm, authoritative

**Anti-patterns:** No generic SaaS blue. No dark-mode-by-default terminal aesthetic. No gradients for decoration. No rounded-everything bubbly startup look. No heavy charting libraries — sparklines and bars only.

---

## Color System

Inherits the established wabi-sabi palette from `src/index.css`. No new tokens unless specified.

```css
:root {
  /* Backgrounds */
  --bg-primary: #FAF9F7;       /* Main page background */
  --bg-secondary: #FFFFFF;     /* Cards, containers */
  --bg-tertiary: #F5F4F2;      /* Alternate card backgrounds */
  --bg-muted: #EFEDE9;         /* Interactive element backgrounds */

  /* Primary accent — warm brown */
  --accent-primary: #8B7355;
  --accent-primary-light: #A69580;
  --accent-primary-muted: #D4C4B0;

  /* Semantic — warm variants */
  --success: #7A9E7E;          /* Moving, healthy, passed */
  --success-light: #A8C4AA;
  --success-muted: #E8F0E9;
  --warning: #C9A959;          /* Slow, approaching limit, amber borders */
  --warning-light: #DFC77E;
  --warning-muted: #F5EDD3;
  --error: #B87A7A;            /* Blocked, stale, over budget, needs attention */
  --error-light: #D4A0A0;
  --error-muted: #F2E0E0;

  /* Text hierarchy */
  --text-primary: #2C2C2C;
  --text-secondary: #6B6B6B;
  --text-tertiary: #9B9B9B;
  --text-muted: #B5B5B5;

  /* Borders — brown-tinted transparency */
  --border-subtle: rgba(139, 115, 85, 0.08);
  --border-medium: rgba(139, 115, 85, 0.15);
  --border-strong: rgba(139, 115, 85, 0.25);

  /* Shadows — warm-tinted */
  --shadow-sm: 0 1px 2px rgba(139, 115, 85, 0.04);
  --shadow-md: 0 4px 12px rgba(139, 115, 85, 0.06);
  --shadow-lg: 0 8px 24px rgba(139, 115, 85, 0.08);
  --shadow-xl: 0 16px 48px rgba(139, 115, 85, 0.10);

  /* NEW: Needs You — urgent red accent for the pinned section */
  --needs-you-bg: #FEF6F5;
  --needs-you-border: rgba(184, 122, 122, 0.25);
  --needs-you-dot: #C75050;
}
```

### Stale Data Border Colors

Applied as `border-left: 3px solid <color>` on any card with stale data:

| Condition | Border Color | Badge |
|-----------|-------------|-------|
| Fresh (< 15 min) | None (default) | None |
| Amber (15 min – 1 hr) | `var(--warning)` | None |
| Stale (> 1 hr) | `var(--error)` | "stale" badge in `badge-error` |

### Pipeline Health Colors

Used on project cards in the Pipeline Board:

| State | Color | Meaning |
|-------|-------|---------|
| Moving | `var(--success)` | Activity in last 2 hours |
| Slow | `var(--warning)` | No activity 2–12 hours |
| Blocked | `var(--error)` | Explicit blocker or no activity > 12 hours |

---

## Typography Scale

Inherits existing system. Key usage mapping:

```css
:root {
  --font-display: 'Inter', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

| Element | Size | Weight | Color | Tracking |
|---------|------|--------|-------|----------|
| Tab label (active) | 14px (text-sm) | 600 | `--text-primary` | normal |
| Section title | 18px (text-lg) | 600 | `--text-primary` | -0.01em |
| Card title | 14px (text-sm) | 500 | `--text-primary` | normal |
| Card subtitle / meta | 13px | 400 | `--text-secondary` | normal |
| Badge text | 11px | 600 | semantic | 0.04em uppercase |
| Stat number (hero) | 24px (text-2xl) | 700 | `--text-primary` | -0.02em |
| Stat label | 12px (text-xs) | 400 | `--text-tertiary` | 0.02em uppercase |
| Timestamp / relative time | 12px (text-xs) | 400 | `--text-muted` | normal |
| Mono values (costs, IDs) | 13px | 400 | `--text-secondary` | normal, `font-mono` |

---

## Spacing System (4px base)

Inherits existing scale. Key layout-level usage:

| Context | Token | Value |
|---------|-------|-------|
| Page horizontal padding | `px-4 sm:px-6 lg:px-8` | 16/24/32px |
| Page max-width | `max-w-7xl` | 80rem (1280px) |
| Section vertical gap | `space-y-6` | 24px |
| Card internal padding | `p-5` | 20px |
| Card gap (grid) | `gap-4` | 16px |
| Element gap (within card) | `gap-2` / `gap-3` | 8/12px |
| Tight inline gap | `gap-1.5` | 6px |
| Kanban column gap | `gap-4` | 16px |
| Accordion header height | `py-3` | 12px top/bottom |

---

## Border Radius

| Element | Token | Value |
|---------|-------|-------|
| Cards, drawers | `rounded-xl` | 12px |
| Buttons, inputs | `rounded-lg` | 8px |
| Badges, pills | `rounded-md` | 6px |
| Status dots | `rounded-full` | 9999px |
| Progress bars | `rounded-full` | 9999px |

---

## Shadow System

| Level | Token | Usage |
|-------|-------|-------|
| Resting card | `--shadow-sm` | Default card state |
| Hovered card | `--shadow-md` | Card hover, dropdown menus |
| Drawer overlay | `--shadow-lg` | Detail drawer |
| Modal | `--shadow-xl` | Search overlay, shortcut help |

---

## Global Elements

### Top Bar

**Sticky header** (`position: sticky; top: 0; z-index: 50`). Full width, `--bg-primary` background with bottom border `--border-subtle`.

```
┌──────────────────────────────────────────────────────────────────┐
│  ☰ Kato    [ Now ]  [ Pipeline ]              🔍 Search   ↻ 2m │
└──────────────────────────────────────────────────────────────────┘
```

**Layout:** `flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8`

| Element | Position | Details |
|---------|----------|---------|
| Logo + "Kato" | Left | Text "Kato" in `--text-primary`, font-semibold |
| Tab pills | Center | Two pill buttons in `--bg-muted` container, `rounded-lg` container, `rounded-md` pills. Active: `--bg-secondary` with `--shadow-sm`. Inactive: transparent |
| "Needs You" badge | On "Now" tab | Red dot (`--needs-you-dot`) with count, `min-w-[18px] h-[18px]`, pulsing animation when > 0 |
| Search trigger | Right | `icon-btn` with magnifying glass icon. Click opens overlay |
| Sync indicator | Right | Relative timestamp "2m ago" in `--text-muted`, `text-xs`. Click = manual refresh. Spinner animation during refresh |

**Mobile (< 768px):** Tab pills remain centered. Search icon only (no text). Sync timestamp hidden, replaced by dot indicator (green/amber/red).

### Global Search Overlay

Triggered by clicking search icon or pressing `/`.

```
┌──────────────────────────────────────────────┐
│  🔍 Search projects, tasks, agents...        │
├──────────────────────────────────────────────┤
│  Projects                                     │
│    📦 MoveApp — implementation (3 active)     │
│    💎 DeFi Dashboard — qa                     │
│  Tasks                                        │
│    ✓ Implement auth middleware (Codex)         │
│  Agents                                       │
│    🏯 Kato — active                           │
│  Activity                                     │
│    [2m] Move Weight → qa stage                │
└──────────────────────────────────────────────┘
```

- **Container:** Fixed overlay, `inset-x-4 top-16`, `max-w-xl mx-auto`, `--bg-secondary`, `--shadow-xl`, `rounded-xl`
- **Input:** Auto-focused, full-width, no border, `text-base`, placeholder in `--text-muted`
- **Results:** Grouped by type with section headers in `--text-tertiary` uppercase `text-xs`. Max 3 results per group. Each result: title + subtitle in a clickable row
- **Keyboard:** Arrow keys navigate, Enter selects, Escape closes
- **Backdrop:** Semi-transparent `rgba(0,0,0,0.15)`, click to dismiss

### Keyboard Shortcut Overlay

Triggered by `?`. Modal centered on screen.

```
┌────────────────────────────┐
│  Keyboard Shortcuts        │
├────────────────────────────┤
│  1       Switch to Now     │
│  2       Switch to Pipeline│
│  /       Focus search      │
│  r       Refresh data      │
│  ?       This help         │
│  Esc     Close overlay     │
└────────────────────────────┘
```

- `max-w-sm`, centered, `--bg-secondary`, `--shadow-xl`, `rounded-xl`, `p-6`
- Key names in `font-mono`, `--bg-muted` pill
- Dismiss on Escape or backdrop click

### Collector Health Footer

Fixed bottom strip or footer row below all content.

```
┌──────────────────────────────────────────────────────────────────┐
│  ● Gateway  ● GitHub  ● Sessions  ● Memory  ● Pipeline  ○ Linear│
└──────────────────────────────────────────────────────────────────┘
```

- `flex gap-4`, `text-xs`, `--text-muted`
- Each: status dot (8px circle) + source name
- Green (`--success`): collector ran within expected interval
- Amber (`--warning`): collector ran but > 1.5x interval
- Red (`--error`) / hollow circle: collector failed or > 2x interval
- Hover tooltip: "Last collected: 2m ago"

---

## Tab 1: Now (`/`)

The command center. Eight sections in descending urgency. Renders inside `max-w-7xl mx-auto`.

### Component Hierarchy

```
<NowTab>
  <NeedsYouSection />           ← always visible, pinned
  <ActiveWorkSection>           ← always visible
    <ProjectSummaryRow />*      ← one per active project
    <KanbanBoard>
      <KanbanColumn title="In Progress">
        <TaskCard />*
      </KanbanColumn>
      <KanbanColumn title="Blocked">
        <TaskCard />*
      </KanbanColumn>
      <KanbanColumn title="Ready for Review">
        <TaskCard />*
      </KanbanColumn>
    </KanbanBoard>
  </ActiveWorkSection>
  <ReadyForDeploySection />     ← visible when non-empty, else 1-line collapsed
  <CollapsibleSection title="Mapped Out Work" defaultOpen={false}>
    <MappedOutList />
  </CollapsibleSection>
  <CollapsibleSection title="Agent Status" defaultOpen={true}>
    <AgentStatusSection>
      <AgentStatusCard />*      ← 5 queen cards
      <WorkerQueueTable />
      <ModelHealthStrip />
    </AgentStatusSection>
  </CollapsibleSection>
  <CollapsibleSection title="Token Usage" defaultOpen={false}>
    <TokenUsageSection>
      <DailyBudgetBar />
      <SpendSparkline />
      <BreakdownTables />       ← by project + by agent/model
      <RateLimitCards />
    </TokenUsageSection>
  </CollapsibleSection>
  <CollapsibleSection title="Progress Log" defaultOpen={false}>
    <ProgressLog>
      <EventFilterBar />
      <ActivityFeedItem />*
    </ProgressLog>
  </CollapsibleSection>
  <CollapsibleSection title="Recently Completed" defaultOpen={false}>
    <RecentlyCompletedList />
  </CollapsibleSection>
  <DetailDrawer />              ← slide-in from right, conditionally rendered
</NowTab>
```

---

### Section 1: Needs You

**Always visible. Cannot be scrolled past (sticky until scrolled through).**

**Container:** `--needs-you-bg` background, `--needs-you-border` border, `rounded-xl`, `p-5`. Red left border accent `border-l-4` using `--needs-you-dot`.

**Header:** "Needs You" with pulsing red dot when items > 0. Count badge.

**Empty state:** Green-tinted card with checkmark icon. "All clear — nothing needs you right now." Subtext: "Last cleared: 2h ago" in `--text-muted`.

**Card layout:** Vertical stack, `gap-3`.

**Action Card:**

```
┌──────────────────────────────────────────────────────┐
│  📦 MoveApp — Deploy Approval                       │
│  "Approve deploy for Move Weight Tracking"           │
│  Stage: deploy  ·  Waiting: 2h 14m                   │
│  [ Open ]  [ Approve ]  [ Defer ]                    │
└──────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Project emoji + name | `text-sm font-medium --text-primary` |
| Action type | `badge` with semantic color (Deploy=success, Review=accent, Decision=warning, Budget=error) |
| Description | `text-sm --text-secondary`, 1 line |
| Stage + wait time | `text-xs --text-muted`, dot separator |
| Action buttons | `btn-sm`. Primary action = `btn-primary`. Others = `btn-secondary` |
| Sort order | Longest waiting first |

**Data requirements:**
```typescript
interface NeedsYouItem {
  id: string
  projectId: string
  projectName: string
  projectEmoji: string
  type: 'deploy' | 'review' | 'decision' | 'budget' | 'blocker' | 'testflight' | 'day7' | 'linear'
  title: string
  description: string
  stage: string
  waitingSince: string  // ISO timestamp
  actions: Array<{ label: string; type: 'primary' | 'secondary'; action: string }>
}
```

**Phase 1 signals (hard only):**
1. Projects in `deploy` stage → type `deploy`
2. Linear issues assigned to Xavier → type `linear`
3. Tasks with explicit `blockerReason` needing human → type `blocker`

---

### Section 2: Active Work

**Always visible.** Two sub-sections: project summary rows, then Kanban columns.

#### Project Summary Rows

Horizontal strip above Kanban. One row per active project. `flex flex-col gap-2 mb-4`.

```
┌──────────────────────────────────────────────────────┐
│  📦 MoveApp  [========>      ] 5/8 tasks             │
│  Stage: implementation  ·  2 active workers          │
└──────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Container | `card` with `p-3` (compact) |
| Row layout | `flex items-center gap-3` |
| Emoji + name | `text-sm font-medium` |
| Progress bar | `flex-1 max-w-48`, existing `progress-bar` component |
| Task count | `text-xs --text-secondary font-mono` |
| Stage | `badge badge-primary` |
| Worker count | `text-xs --text-muted` |

**Data:** Derived from `Project` + `Task[]`. Filter to projects with `status === 'in_progress'`.

#### Kanban Board

Three columns. On mobile: horizontal scroll with snap.

**Desktop (>= 1024px):** Three equal columns, `grid grid-cols-3 gap-4`.
**Tablet (768–1023px):** Three columns, narrower.
**Mobile (< 768px):** Horizontal scroll, `flex overflow-x-auto snap-x snap-mandatory gap-4`, each column `min-w-[280px] snap-center`.

**Column header:**

```
┌──────────────────┐
│  In Progress (3) │
├──────────────────┤
│  [TaskCard]      │
│  [TaskCard]      │
│  [TaskCard]      │
└──────────────────┘
```

- Header: `text-sm font-medium --text-secondary`, count in `--text-muted`
- Column: `bg-[var(--bg-tertiary)] rounded-xl p-3`, `flex flex-col gap-2`
- Column colors: In Progress = default, Blocked = `border-l-2` with `--error`, Review = `border-l-2` with `--warning`

**Task Card (compact):**

```
┌──────────────────────────────────────┐
│  [MoveApp] Implement auth middleware │
│  Agent: Codex  ·  12m active         │
│  Context: auth middleware for API    │
└──────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Container | `card p-3`, clickable (opens detail drawer) |
| Project tag | `text-xs --text-muted` inline before title |
| Task title | `text-sm font-medium --text-primary`, 1-line clamp |
| Agent + duration | `text-xs --text-secondary` |
| Context line | `text-xs --text-muted`, 1-line clamp, italic |
| Blocked indicator | If in Blocked column: `--error` left border, blocker reason replaces context line in `--error` color |

**Data requirements:**
```typescript
interface ActiveTask {
  id: string
  projectId: string
  projectName: string
  projectEmoji: string
  title: string
  status: 'in_progress' | 'blocked' | 'review'
  assignedAgent: string | null
  startedAt: string
  context: string          // What's being worked on
  blockerReason?: string   // If blocked
  blockedBy?: string       // Who/what is blocking
  estimatedTokenCost?: number
  worktree?: string        // Git worktree path
  branch?: string          // Git branch
  filesTouched?: string[]  // Files modified
}
```

---

### Section 3: Ready for Deploy

**Visible when items exist. Collapses to single line when empty.**

**Non-empty state:** Horizontal strip of deploy-ready cards.

```
┌──────────────────────────────────────────────────────┐
│  📦 MoveApp — Ready to deploy                       │
│  QA passed: 2h ago  ·  Branch: main                 │
│  [ Deploy Now ]  [ View Details ]                    │
└──────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Container | `card` with `border-l-4` using `--success` |
| Layout | `flex items-center justify-between` |
| Title | `text-sm font-medium --text-primary` with emoji |
| Meta | `text-xs --text-secondary` |
| Deploy button | `btn-primary btn-sm` |
| Details button | `btn-secondary btn-sm` |

**Empty state:** Single line: "Nothing ready for deploy." in `--text-muted`, `text-sm`.

**Data:** Projects where all tasks are `done` and stage is `qa` (passed) or `deploy`.

---

### Section 4: Mapped Out Work

**Collapsible, collapsed by default.** Uses `CollapsibleSection`.

Grouped by project. Each project shows queued tasks.

```
┌──────────────────────────────────────────────────────┐
│  📦 MoveApp (4 queued tasks)                         │
│  ├─ Add weight history chart  [M]  Depends: API done │
│  ├─ Export to Health app      [L]  Next: after chart  │
│  ├─ Dark mode support         [S]  Ready to start     │
│  └─ Onboarding flow           [M]  Depends: design    │
└──────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Project header | `text-sm font-semibold --text-primary` with emoji + count |
| Task row | `flex items-center gap-2 py-1.5`, border-bottom `--border-subtle` |
| Task title | `text-sm --text-primary` |
| Scope badge | `badge badge-neutral` with S/M/L |
| Dependency | `text-xs --text-muted` |

**Data:** Tasks with `status === 'queued'`, grouped by `project_id`.

---

### Section 5: Agent Status

**Collapsible, expanded by default.** Three sub-sections.

#### Queen Agent Cards

5 cards in a responsive grid.

**Desktop:** `grid grid-cols-5 gap-4`
**Tablet:** `grid grid-cols-3 gap-3` (wraps to 2 rows)
**Mobile:** `grid grid-cols-2 gap-3` (Kato card spans full width on top, others 2-col)

Uses existing `AgentStatusCard` component with its established patterns (emoji, status dot, current task, stats).

**Agent card layout (compact for v3):**

```
┌──────────────────────┐
│  🏯 Kato             │
│  ● Active            │
│  "Reviewing QA..."   │
│  12 tasks · $2.40    │
└──────────────────────┘
```

| Element | Style |
|---------|-------|
| Container | `card p-4` |
| Emoji + name | `text-sm font-semibold` |
| Status dot | 8px circle, color by state (green/grey/amber/red), `animate-soft-pulse` when active |
| Current task | `text-xs --text-secondary`, 2-line clamp |
| Stats | `text-xs --text-muted font-mono` |
| Click | Opens agent detail drawer |

#### Worker Queue Table

Compact table below agent cards.

```
┌─────────┬────────────┬──────────────────┬──────────┬──────────┐
│ Status  │ Agent      │ Task             │ Project  │ Duration │
├─────────┼────────────┼──────────────────┼──────────┼──────────┤
│ ● Active│ Codex 5.3  │ implement auth   │ MoveApp  │ 4m       │
│ ○ Queued│ —          │ design review    │ Aura     │ waiting  │
│ ✓ Done  │ Claude 4.6 │ write tests      │ DeFi     │ 8m $0.32 │
└─────────┴────────────┴──────────────────┴──────────┴──────────┘
```

| Element | Style |
|---------|-------|
| Container | `overflow-x-auto` for mobile |
| Table | `w-full text-sm` |
| Header row | `text-xs --text-muted uppercase tracking-wide`, `border-b --border-subtle` |
| Cell padding | `py-2 px-3` |
| Status dot | Inline 6px circle |
| Active row | Slight `--bg-muted` background |
| Done row | `--text-muted` text color, strikethrough on task name |
| Cost | `font-mono text-xs` |

**Data:** From `SubAgent[]` / worker queue data.

#### Model Health Strip

Horizontal row of model indicators.

```
Codex: ● healthy   Claude: ● healthy   Kimi: ○ degraded (1 fail)   MiniMax: ● healthy
```

| Element | Style |
|---------|-------|
| Container | `flex flex-wrap gap-4`, `p-3 rounded-lg bg-[var(--bg-tertiary)]` |
| Each model | `flex items-center gap-1.5 text-xs` |
| Dot | 6px circle. Healthy = `--success`, degraded = `--warning`, down = `--error` |
| Model name | `font-medium --text-secondary` |
| Status label | `--text-muted` |
| Failure count | `font-mono` in parentheses |

**Data:**
```typescript
interface ModelHealth {
  model: string
  status: 'healthy' | 'degraded' | 'down'
  failureCount: number    // in 15-min window
  circuitBreaker: 'closed' | 'half-open' | 'open'
  fallbackChain: string[] // e.g., ['Claude 4.6', 'Kimi K2.5']
}
```

---

### Section 6: Token Usage & Rate Limits

**Collapsible, collapsed by default.**

#### Daily Budget Bar

```
$8.42 / $20.00 today    [==========>                    ] 42%
```

| Element | Style |
|---------|-------|
| Container | `card p-5` |
| Amount | `text-2xl font-bold --text-primary font-mono` |
| Budget | `text-sm --text-muted font-mono` |
| Bar | `progress-bar h-3 rounded-full`, width 100% |
| Fill color | Green (< 60%) → amber (60–85%) → red (> 85%) using semantic colors |
| Percentage | `text-sm font-medium` right-aligned |

#### 7-Day Spend Sparkline

Minimal inline sparkline (SVG, no library). 7 vertical bars or line chart, one per day.

| Element | Style |
|---------|-------|
| Container | `h-12 w-full` inline SVG |
| Bars/line | `--accent-primary` fill, `--accent-primary-muted` for past days |
| Budget pace line | Dashed horizontal line at $20 level, `--error` if current pace exceeds |
| Labels | Day abbreviations below in `text-[10px] --text-muted` |

**Implementation:** Pure SVG component, no D3/Recharts. Calculate bar heights as percentage of max daily spend.

#### Breakdown Tables

Side-by-side on desktop, stacked on mobile.

**By Project:**

| Project | Today | Sprint Total | Sessions | Avg $/session |
|---------|-------|-------------|----------|---------------|

**By Agent + Model:**

| Agent | Model | Tokens (in/out/cache) | Cost | Efficiency |
|-------|-------|-----------------------|------|------------|

| Element | Style |
|---------|-------|
| Tables | Same style as Worker Queue table |
| Cost values | `font-mono` |
| Desktop | `grid grid-cols-2 gap-4` |
| Mobile | `flex flex-col gap-4` |

#### Rate Limit Cards

Per-model cards showing current usage vs cap.

```
┌──────────────────────────┐
│  Claude 4.6              │
│  [=======>     ] 65%     │
│  32K / 50K tokens/min    │
│  Circuit: closed         │
│  Fallback: Kimi → MiniMax│
└──────────────────────────┘
```

| Element | Style |
|---------|-------|
| Cards | `grid grid-cols-2 sm:grid-cols-4 gap-3` |
| Each card | `card-muted p-3` |
| Model name | `text-sm font-medium` |
| Progress bar | `progress-bar h-1.5` with semantic color |
| Values | `text-xs --text-secondary font-mono` |

**Data:**
```typescript
interface TokenStats {
  dailySpend: number
  dailyBudget: number
  weeklySpend: number[]     // 7 values, most recent last
  byProject: Array<{
    project: string
    today: number
    sprintTotal: number
    sessions: number
    avgPerSession: number
  }>
  byAgentModel: Array<{
    agent: string
    model: string
    tokensIn: number
    tokensOut: number
    tokensCached: number
    cost: number
    efficiency: number      // output tokens per dollar
  }>
  rateLimits: Array<{
    model: string
    currentUsage: number
    cap: number
    unit: string            // 'tokens/min', 'requests/min'
    circuitBreaker: 'closed' | 'half-open' | 'open'
    failureCount: number
    fallbackChain: string[]
  }>
}
```

---

### Section 7: Progress Log

**Collapsible, collapsed by default.**

#### Event Filter Bar

```
[ All ] [ Pipeline ] [ Agent ] [ Cost ] [ Decision ] [ GitHub ]    🔍 Filter...    Project ▼  Agent ▼
```

| Element | Style |
|---------|-------|
| Container | `flex flex-wrap gap-2 mb-3` |
| Type pills | `btn-sm`, active = `btn-primary`, inactive = `btn-ghost` |
| Search input | `input` component, `max-w-48` |
| Dropdowns | `select` styled with `input` pattern, `max-w-32` |

#### Activity Feed

```
┌──────────────────────────────────────────────────────┐
│  2m   [stage]     Move Weight → qa stage (gate pass) │
│  5m   [agent]     Codex spawned for task-7            │
│  8m   [cost]      Budget alert: 80% daily limit       │
│ 12m   [decision]  Aura: TestFlight cert — needs Xavier│
│ 15m   [github]    3 commits to move-weight-tracking   │
└──────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Container | `flex flex-col`, virtualized list for > 100 items |
| Row | `flex items-start gap-3 py-2`, border-bottom `--border-subtle` |
| Timestamp | `text-xs --text-muted font-mono w-8 shrink-0` right-aligned |
| Type badge | `badge` with semantic color. Pipeline=accent, Agent=neutral, Cost=warning, Decision=error, GitHub=success |
| Description | `text-sm --text-primary` |
| Decision events | Highlighted with `--needs-you-bg` background |

**Retention:** 30 days in feed. Older data searchable via search overlay.

**Data:**
```typescript
interface ActivityEvent {
  id: string
  timestamp: string
  type: 'pipeline' | 'agent' | 'cost' | 'decision' | 'github'
  description: string
  projectId?: string
  agentId?: string
  metadata?: Record<string, unknown>
}
```

---

### Section 8: Recently Completed

**Collapsible, collapsed by default.**

List of tasks and projects completed in last 7 days.

```
┌──────────────────────────────────────────────────────┐
│  ✓ Auth middleware — MoveApp · Codex · 45m · $1.20   │
│  ✓ CI pipeline — DeFi · Yuki · 2h · $0.80           │
│  ✓ Landing page — Aura · Claude 4.6 · 1.5h · $3.40  │
└──────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Row | `flex items-center gap-3 py-2`, border-bottom `--border-subtle` |
| Checkmark | `--success` color |
| Task title | `text-sm --text-primary` |
| Project | `text-xs --text-secondary` |
| Agent | `text-xs --text-muted` |
| Duration + cost | `text-xs --text-muted font-mono` |

---

### Detail Drawer

**Slide-in panel from right.** Used for task, project, and agent deep-dives.

| Property | Value |
|----------|-------|
| Width | `max-w-md` (448px), full width on mobile |
| Animation | `transform translateX(100%) → translateX(0)`, 300ms, `ease-spring` |
| Backdrop | `rgba(0,0,0,0.1)`, click to dismiss |
| Z-index | 40 (below header at 50) |
| Background | `--bg-secondary` |
| Shadow | `--shadow-xl` |
| Close | X button top-right + Escape key |
| Border | Left border `--border-subtle` |

**Task drawer content:**
- Task title + status badge
- Project link
- Current agent + time active
- Worktree / branch / files touched
- Blocker details (if blocked) with suggested next steps
- Token cost estimate
- Activity history for this task

**Agent drawer content:**
- Agent name + emoji + status
- Current task + context
- Recent activity (last 24h)
- Token breakdown by model
- Active project assignments
- Memory stats (entry count, last updated)

---

## Tab 2: Pipeline (`/pipeline`)

### Component Hierarchy

```
<PipelineTab>
  <PipelineBoardSection>
    <StageColumn stage="idea">
      <PipelineProjectCard />*
    </StageColumn>
    <StageColumn stage="prd" />
    <StageColumn stage="tech_spec" />
    <StageColumn stage="implementation" />
    <StageColumn stage="qa" />
    <StageColumn stage="code_audit" />
    <StageColumn stage="deploy" />
    <StageColumn stage="live" />
    <GateInspector />           ← appears on click between stages
  </PipelineBoardSection>
  <RoadmapTableSection>
    <RoadmapFilterBar />
    <RoadmapTable />
  </RoadmapTableSection>
  <CollapsibleSection title="Research & Intelligence" defaultOpen={true}>
    <KojiResearchSection>
      <ResearchCard />*
    </KojiResearchSection>
  </CollapsibleSection>
</PipelineTab>
```

---

### Section A: Pipeline Board

Horizontal swim-lane with stage columns.

**Desktop (>= 1024px):** Full horizontal layout. If columns overflow, horizontal scroll with `overflow-x-auto`.
**Mobile (< 768px):** Horizontal scroll with snap, each column `min-w-[200px]`.

```
┌─────────┬─────────┬───────────┬────────────────┬────────┬───────────┬────────┬────────┐
│  idea   │  prd    │ tech_spec │ implementation │   qa   │code_audit │ deploy │  live  │
├─────────┼─────────┼───────────┼────────────────┼────────┼───────────┼────────┼────────┤
│         │         │           │  [MoveApp]     │        │  [DeFi]   │        │ [Blog] │
│         │ [Aura]  │           │  [Tracker]     │        │           │        │        │
└─────────┴─────────┴───────────┴────────────────┴────────┴───────────┴────────┴────────┘
      ▲         ▲          ▲            ▲           ▲          ▲          ▲
    gates    gates      gates        gates       gates      gates      gates
```

**Stage column:**

| Element | Style |
|---------|-------|
| Container | `flex flex-col gap-2 min-w-[140px]` |
| Header | `text-xs font-medium --text-muted uppercase tracking-wide py-2 px-3`, `bg-[var(--bg-tertiary)] rounded-t-lg` |
| Body | `flex-1 p-2`, `bg-[var(--bg-tertiary)] rounded-b-lg` min-height: 120px |
| Gate boundary | Clickable 4px gap between columns with hover indicator (dashed line) |

**Pipeline Project Card:**

```
┌──────────────────────┐
│  📦 MoveApp          │
│  Day 4/7             │
│  ●● Kato, Codex      │
│  [=====>   ] 5/8     │
│  🔴 1 blocker        │
└──────────────────────┘
```

| Element | Style |
|---------|-------|
| Container | `card p-3`, border-left color by health (green/amber/red), clickable |
| Name + emoji | `text-sm font-medium` |
| Day counter | `text-xs --text-muted` |
| Agents | Stacked dots or initials, `text-xs` |
| Progress | Mini progress bar, `h-1` |
| Blocker | Red dot + count in `text-xs --error` |
| Health border | Left border 3px: `--success` / `--warning` / `--error` |

**Gate Inspector (click between stages):**

Appears as a popover/tooltip anchored to the gate boundary.

```
┌───────────────────────────┐
│  Gate: prd → tech_spec    │
│  ✓ PRD complete           │
│  ✓ PRD reviewed           │
│  ✗ Tech lead sign-off     │
│  Last checked: 5m ago     │
└───────────────────────────┘
```

| Element | Style |
|---------|-------|
| Container | `card p-4 max-w-xs`, positioned absolute, `--shadow-lg` |
| Title | `text-sm font-semibold` |
| Criteria | List with check/cross icons, `text-xs` |
| Pass = `--success`, fail = `--error` |
| Timestamp | `text-xs --text-muted` |

**Data:**
```typescript
interface PipelineProject {
  id: string
  name: string
  emoji: string
  stage: 'idea' | 'prd' | 'prd_review' | 'tech_spec' | 'spec_review' | 'implementation' | 'qa' | 'code_audit' | 'deploy' | 'live'
  dayInStage: number
  totalDays: number          // for X/7 cycle display
  assignedAgents: string[]
  taskProgress: { done: number; total: number }
  health: 'moving' | 'slow' | 'blocked'
  blockers: Array<{ reason: string; since: string }>
  lastActivity: string       // ISO timestamp
}

interface GateCriteria {
  fromStage: string
  toStage: string
  criteria: Array<{ label: string; passed: boolean }>
  lastChecked: string
}
```

---

### Section B: Roadmap Queue

Searchable, sortable table parsed from `ROADMAP.md`.

**Filter bar:**

```
[ All ] [ Backlog ] [ Active ] [ Done ] [ Killed ]    🔍 Search...    Priority ▼
```

Same filter pattern as Progress Log.

**Table:**

| Rank | Product | Score | Status | Stage | Day X/7 | Next Step | Revenue Target |
|------|---------|-------|--------|-------|---------|-----------|----------------|

| Element | Style |
|---------|-------|
| Table | `w-full text-sm`, horizontal scroll on mobile |
| Header | Same as Worker Queue header style |
| Rank | `font-mono text-xs --text-muted` |
| Product | `font-medium --text-primary` |
| Score | `font-mono`, color by quartile |
| Status | `badge` with semantic color |
| Row hover | `bg-[var(--bg-tertiary)]` |
| Sortable headers | Click to sort, arrow indicator |

**Data:**
```typescript
interface RoadmapItem {
  rank: number
  name: string
  score: number
  status: 'backlog' | 'active' | 'done' | 'killed'
  stage: string | null
  dayInCycle: number | null
  nextStep: string
  revenueTarget: string | null
  assignedAgent: string | null
}
```

---

### Section C: Koji Research

**Collapsible, expanded by default.**

List of research entries, sorted by recency.

```
┌──────────────────────────────────────────────────────┐
│  Competitive Analysis: Fitness App Market Q1 2026    │
│  Summary of key findings from App Store analysis...  │
│  2026-03-08  ·  #fitness  #market  #competitor       │
│  [ Expand ▼ ]                                        │
└──────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Card | `card p-4`, clickable to expand |
| Title | `text-sm font-semibold --text-primary` |
| Summary | `text-sm --text-secondary`, 2-line clamp |
| Date + tags | `text-xs --text-muted`, tags as `badge badge-neutral` |
| Expanded | Full markdown content rendered below summary |

**Empty state:** "No recent research. Koji runs competitive scans on a monthly cadence." in `--text-muted`.

**Data:**
```typescript
interface ResearchEntry {
  id: string
  title: string
  summary: string
  content: string           // Full markdown
  date: string
  tags: string[]
  source: 'koji-output' | 'koji-memory'
}
```

---

## Interaction Patterns & State Management

### State Architecture

Single React context + `useReducer` for dashboard state. No external state library.

```typescript
interface DashboardState {
  activeTab: 'now' | 'pipeline'
  data: DashboardData | null
  loading: boolean
  error: string | null
  lastSync: string | null
  collapsedSections: Record<string, boolean>
  searchQuery: string
  searchOpen: boolean
  shortcutHelpOpen: boolean
  activeDrawer: {
    type: 'task' | 'project' | 'agent' | null
    id: string | null
  }
  filters: {
    activityTypes: string[]
    activityProject: string | null
    activityAgent: string | null
    roadmapStatus: string | null
    roadmapPriority: string | null
  }
}
```

### Data Fetching

- **Primary:** `fetch` to `localhost:3001/api` endpoints via Vite proxy
- **Fallback:** `fetch('/dashboard-data.json')` when backend unavailable
- **Refresh:** Auto-poll every 30 seconds for general data, 5 seconds for "Needs You" section
- **Manual refresh:** `r` key or click sync button
- **Tab focus:** Re-fetch on `visibilitychange` event when tab becomes visible
- **Loading states:** Skeleton placeholders (pulsing `--bg-muted` blocks) for each section independently

### Optimistic Updates

Action buttons (Approve, Defer, Dismiss) update UI immediately and POST to backend. On failure, revert with toast notification.

### URL State

- Tab selection synced to URL: `/` = Now, `/pipeline` = Pipeline
- Drawer state NOT in URL (ephemeral)
- Search query NOT in URL (ephemeral)
- Filter state NOT in URL (ephemeral, resets on tab switch)

---

## Responsive Breakpoints

```css
/* Mobile-first */
--bp-sm: 640px;    /* Small phones → larger phones */
--bp-md: 768px;    /* Phones → tablets */
--bp-lg: 1024px;   /* Tablets → laptops */
--bp-xl: 1280px;   /* Laptops → desktops */
```

**Primary target: iPhone (iOS Safari, 390px viewport width)**

### Key Responsive Behaviors

| Component | Mobile (< 768px) | Tablet (768–1023px) | Desktop (>= 1024px) |
|-----------|-------------------|---------------------|----------------------|
| Top bar tabs | Centered, compact | Centered | Centered |
| Secondary nav | Horizontal scroll strip below header | Inline in header | Inline in header |
| Needs You cards | Full width, stacked | Full width, stacked | Full width, stacked |
| Kanban columns | Horizontal scroll, snap, min-w-280px | 3 columns, tight | 3 equal columns |
| Agent cards | 2-col grid (Kato full-width top) | 3-col grid | 5-col single row |
| Worker queue | Horizontal scroll table | Full table | Full table |
| Token breakdown | Stacked tables | Stacked tables | Side-by-side grid-cols-2 |
| Rate limit cards | 2-col grid | 2-col grid | 4-col grid |
| Pipeline board | Horizontal scroll, snap | Horizontal scroll | Full horizontal |
| Roadmap table | Card view (stacked fields) | Horizontal scroll table | Full table |
| Detail drawer | Full-screen overlay | Max-w-md from right | Max-w-md from right |
| Search overlay | Full-screen | Centered max-w-xl | Centered max-w-xl |

### iOS Safari Considerations

- **Safe area insets:** Use `env(safe-area-inset-*)` for bottom padding (home indicator)
- **Sticky positioning:** Test `position: sticky` behavior — iOS Safari has known quirks with nested scroll containers. Avoid nesting sticky inside overflow containers
- **Viewport height:** Use `dvh` (dynamic viewport height) instead of `vh` to account for Safari's collapsing address bar
- **Touch targets:** Minimum 44x44px for all interactive elements (Apple HIG)
- **Rubber-band scrolling:** Horizontal scroll containers need `-webkit-overflow-scrolling: touch`
- **Font size:** Minimum 16px for inputs to prevent iOS auto-zoom

---

## Animation & Interaction

```css
:root {
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

| Interaction | Duration | Easing | Details |
|-------------|----------|--------|---------|
| Card hover | `--duration-fast` | `--ease-default` | Border darken, shadow increase, translate-y -1px |
| Section collapse/expand | `--duration-normal` | `--ease-out` | Height animation + fade |
| Drawer open | `--duration-slow` | `--ease-spring` | translateX(100% → 0) + backdrop fade |
| Drawer close | 200ms | `--ease-default` | translateX(0 → 100%) + backdrop fade |
| Search overlay | `--duration-normal` | `--ease-out` | Fade in + scale(0.98 → 1) |
| Tab switch | `--duration-fast` | `--ease-default` | Active pill background slide |
| Status dot pulse | 2s infinite | ease-in-out | Opacity 1 → 0.7 → 1 |
| Needs You badge pulse | 1.5s infinite | ease-in-out | Scale 1 → 1.1 → 1, opacity pulse |
| Skeleton loading | 1.5s infinite | ease-in-out | Background gradient sweep left → right |
| Refresh spinner | 1s infinite | linear | rotate(0 → 360deg) |
| Toast notification | 200ms in, 150ms out | `--ease-out` | translateY(100% → 0), auto-dismiss after 3s |

**Reduced motion:** Wrap all animations in `@media (prefers-reduced-motion: no-preference)`. When reduced motion preferred: instant transitions, no pulsing, static indicators.

---

## Accessibility (WCAG AA)

### Color Contrast

All text must meet WCAG AA contrast ratios against their backgrounds:

| Combination | Ratio Required | Current Status |
|-------------|---------------|----------------|
| `--text-primary` on `--bg-primary` | 4.5:1 (normal text) | #2C2C2C on #FAF9F7 = ~13:1 (pass) |
| `--text-secondary` on `--bg-primary` | 4.5:1 | #6B6B6B on #FAF9F7 = ~5.2:1 (pass) |
| `--text-tertiary` on `--bg-primary` | 4.5:1 | #9B9B9B on #FAF9F7 = ~2.9:1 (fail for body text — use only for decorative/supplementary) |
| `--text-muted` on `--bg-primary` | 3:1 (large text only) | #B5B5B5 on #FAF9F7 = ~1.9:1 (fail — use only alongside other indicators) |
| Badge text on badge bg | 4.5:1 | Verify each combination |

**Rule:** `--text-tertiary` and `--text-muted` must never be the sole means of conveying information. Always pair with icons, badges, or positional context.

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus through interactive elements |
| `Enter` / `Space` | Activate focused element |
| `Escape` | Close drawer, search overlay, popover |
| `1` – `2` | Switch tabs (global) |
| `/` | Open search (global) |
| `r` | Refresh (global) |
| `?` | Shortcut help (global) |
| Arrow keys | Navigate search results, table rows |

- All interactive elements must have visible focus indicators: `outline: 2px solid var(--accent-primary); outline-offset: 2px`
- Skip-to-content link as first focusable element
- Focus trap in drawer and search overlay

### ARIA Labels

| Component | ARIA |
|-----------|------|
| Tab navigation | `role="tablist"`, `role="tab"`, `aria-selected` |
| Collapsible sections | `aria-expanded`, `aria-controls` |
| Status dots | `aria-label="Status: active"` (don't rely on color alone) |
| Badge counts | `aria-label="3 items need your attention"` |
| Progress bars | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Search input | `role="combobox"`, `aria-expanded`, `aria-activedescendant` |
| Drawer | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Activity feed | `role="log"`, `aria-live="polite"` for new items |
| Kanban columns | `role="group"`, `aria-label="In Progress tasks"` |
| Action buttons | Clear labels: "Approve deploy for MoveApp" not just "Approve" |

### Screen Reader

- Announce "Needs You" count changes with `aria-live="assertive"`
- Announce data refresh completion with `aria-live="polite"`
- Table column headers properly associated with `<th scope="col">`
- Drawer content reads in logical order (title → body → actions)

---

## Visual QA Checklist

- [ ] Uses design system tokens exclusively (no hardcoded colors/spacing)
- [ ] Typography hierarchy clear: section title > card title > meta > muted
- [ ] Spacing follows 4px grid (all values multiples of 4px)
- [ ] All animations smooth at 60fps; respect `prefers-reduced-motion`
- [ ] Warm wabi-sabi aesthetic maintained — no cold blues, no generic SaaS
- [ ] Mobile-first: tested on 390px width (iPhone), iOS Safari
- [ ] Safe area insets applied for bottom nav/fixed elements
- [ ] Touch targets >= 44x44px
- [ ] Input text >= 16px (prevent iOS auto-zoom)
- [ ] Focus states visible on all interactive elements
- [ ] Loading skeletons for all async sections
- [ ] Stale data indicators (amber/red borders) functioning
- [ ] Empty states for all sections (meaningful, not just "No data")
- [ ] Collector health footer visible and accurate
- [ ] Keyboard shortcuts working without conflicting with browser defaults
- [ ] Drawer and search overlay trap focus correctly
- [ ] Color contrast meets WCAG AA for all text combinations
- [ ] Screen reader announces Needs You changes
- [ ] No horizontal overflow on mobile (except intentional scroll containers)
