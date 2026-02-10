# Dashboard Enhancement PRD - DRAFT

## Overview
Enhanced Kato Dashboard with autonomous operation visibility, opportunity detection, and real-time planning display.

## Open Questions for Xavier

### 1. Opportunity Scan Section
- What types of opportunities should be detected?
  - Blocked projects needing attention
  - Projects ready for next stage
  - ROADMAP items not yet started
  - Idle agents available
  - Sprint deadline reminders
  - Trading opportunities (FOMO signals)
  - Something else?

- How should opportunities be prioritized?
  - High/Medium/Low based on what criteria?
  - Should P0 ROADMAP items always be high priority?
  - Should trading signals get special treatment?

- What actions should be available per opportunity?
  - Just "view" or actual action buttons like "Start Project", "Assign Agent"?

### 2. Kato's Autonomous Queue
- What information do you want to see about my current tasks?
  - Just task name and project?
  - Progress percentage?
  - Estimated completion time?
  - Which agent is working on it?

- How should "planned" vs "current" tasks be distinguished?
  - Different colors? Sections? Tabs?

- Do you want to see system/maintenance tasks or just product work?
  - Pipeline engine runs
  - Token stats collection
  - Health checks

### 3. Visual Design
- What's the overall aesthetic direction?
  - Current: Dark mode, cyan accents
  - Should it feel more "mission control" / NASA-like?
  - More "trading terminal" vibe?
  - Something else?

- Any specific layout preferences?
  - Grid layout (current)
  - Sidebar navigation
  - Single scrollable page
  - Multiple pages/tabs

### 4. Data Refresh
- How often should each section update?
  - Opportunity Scan: 5 min (cron)
  - Kato's Queue: Real-time? 1 min? 5 min?
  - Project progress: On change? Polling?

- Do you want push notifications for critical opportunities?
  - Blocked projects
  - Sprint deadline warnings
  - Trading signals

### 5. Interactivity
- Should you be able to:
  - Click an opportunity to take action?
  - Drag-and-drop to reorder my queue?
  - Mark opportunities as "ignore"?
  - Add manual tasks to my queue?

### 6. Historical Data
- Do you want to see:
  - Past opportunities (archive)?
  - Completed tasks history?
  - Opportunity conversion rate (how many were acted on)?

### 7. Integration
- Should this integrate with:
  - Trading tools (FOMO app data)?
  - Calendar (upcoming events)?
  - Fitness data (Move app)?
  - GitHub (PRs, issues)?

## Proposed User Stories (Pending Your Input)

### US-001: Opportunity Scan Display
Display detected opportunities with priority, type, and action required.

### US-002: Kato's Real-time Queue
Show current, planned, and upcoming tasks with status and progress.

### US-003: Quick Actions
Allow taking action directly from opportunity cards.

### US-004: Historical View
Show completed tasks and past opportunities.

### US-005: Dashboard Customization
Allow toggling sections and setting refresh preferences.

## Technical Notes

### Existing Systems
- Opportunity scanner: `scripts/dashboard-scanner.js`
- Data file: `projects/kato-dashboard/public/dashboard-data.json`
- Current refresh: 5-second polling in `useDashboardData.ts`

### Data Flow
```
Cron (5min) → dashboard-scanner.js → dashboard-data.json
                                           ↓
React App ← useDashboardData.ts ← JSON fetch
```

### Components to Build/Modify
1. `OpportunityScan.tsx` - Already started
2. `KatoQueue.tsx` - Already started
3. `MissionControl.tsx` - Layout updates
4. New: `OpportunityCard.tsx`
5. New: `TaskCard.tsx`
6. New: `QuickActions.tsx`
