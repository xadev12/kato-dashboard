# CLAUDE.md — Kato Dashboard

## Overview

Project management and agent monitoring dashboard for the OpenClaw multi-agent system. Shows project status, agent activity, task boards, token usage, and memory management.

**Status:** Active, deployed
**URL:** https://kato-dashboard.vercel.app
**Backend:** Local Express server on Mac mini (port 3001)

## Tech Stack

- **Frontend:** React 19 + Vite + React Router v7
- **Styling:** Tailwind CSS, custom design system
- **Backend:** Express 5 + better-sqlite3 (local)
- **Data:** SQLite database + JSON fallback (`dashboard-data.json`)
- **Deployment:** Vercel (frontend), local Mac mini (backend)
- **TypeScript:** Strict mode via `tsc -b`

## Project Structure

```
kato-dashboard/
├── src/
│   ├── App.tsx              # Routes: /, /legacy, /actions, /roster, /memory, /tokens, /projects/:id
│   ├── main.tsx
│   ├── types/index.ts       # Type definitions
│   ├── components/
│   │   ├── Layout.tsx       # Shell with sidebar navigation
│   │   ├── AgentStatusCard.tsx
│   │   ├── AgentIndicator.tsx
│   │   ├── KanbanBoard.tsx  # Task board
│   │   ├── TaskCard.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── GlobalStatsPanel.tsx
│   │   ├── WorkerQueuePanel.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── SearchBar.tsx
│   │   ├── QuickActions.tsx
│   │   ├── CompletedProjects.tsx
│   │   ├── WebSearch.tsx
│   │   └── ActivityFeed.tsx
│   ├── pages/
│   │   ├── AgentDashboard.tsx  # Main page (/)
│   │   ├── Dashboard.tsx       # Legacy page (/legacy)
│   │   ├── ProjectDetail.tsx
│   │   ├── AgentRoster.tsx
│   │   ├── MemoryManager.tsx
│   │   ├── TokenDashboard.tsx
│   │   ├── SearchPage.tsx
│   │   └── MyActions.tsx
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   └── useApi.ts
│   ├── services/
│   │   ├── api.ts           # API client (localhost:3001 + JSON fallback)
│   │   └── supabase.ts
│   └── data/mock.ts
├── backend/
│   ├── server.ts            # Express server (port 3001)
│   ├── db.ts                # SQLite database
│   ├── seed.ts              # Seed script
│   └── collectors/          # Data collectors
│       ├── index.ts
│       ├── github.ts        # GitHub stats
│       ├── gateway.ts       # OpenClaw gateway stats
│       ├── sessions.ts      # Session data
│       ├── memory.ts        # Agent memory
│       └── runner.ts        # Runner stats
├── public/
│   └── dashboard-data.json  # Static fallback data
├── vite.config.ts
└── eslint.config.js
```

## Local Development

```bash
npm install

# Frontend only
npm run dev

# Backend only
npm run server:dev

# Both (recommended)
npm run start:all    # Runs frontend + backend concurrently

# Seed database
npm run db:seed

# Tests
npm run test         # Run tests (vitest)
npm run test:watch   # Watch mode

# Run data collectors
npm run collect:all
npm run collect:github
npm run collect:gateway
npm run collect:sessions
npm run collect:memory
```

## Environment Variables

`.env`:
```
VITE_API_URL=http://localhost:3001/api    # Backend API
VITE_SUPABASE_URL=...                     # Optional
VITE_SUPABASE_ANON_KEY=...               # Optional
```

## Architecture Notes

- Frontend falls back to `dashboard-data.json` if backend API is unavailable
- Backend runs locally on Mac mini — NOT deployed publicly
- Auto-sync cron updates `dashboard-data.json` and deploys to Vercel every 10 minutes
- Active agents: Kato, Yuki, Koji, Sora, Karin (Bel, Fel, Kenji archived — replaced by CLI-Direct)

## Design Notes

- Dark theme dashboard with status indicators
- Kanban board for task management
- Agent status cards with real-time monitoring
- Token usage tracking and visualization
- Reference: Notion structured layout, Obsidian information density

## Known Issues

- WorkerQueuePanel had timestamp field mismatch bug (v2 schema)
- TypeScript interfaces may not match actual `dashboard-data.json` schema — always verify
- Backend collectors need proper OpenClaw gateway access

## Deploy

```bash
# Frontend (Vercel)
vercel --prod

# Backend stays local — runs on Mac mini
npm run server
```

## Automation

Dashboard auto-sync runs via cron:
```bash
node scripts/update-progress.js complete-task project-id task-id
node scripts/update-progress.js add-activity code "Description" project-id
```

## Quality Checklist

Before deploying:
- [ ] `npm run build` passes (includes tsc)
- [ ] `npm run dev` starts without errors
- [ ] Verify `dashboard-data.json` matches TypeScript types
- [ ] Check both frontend and backend start correctly
- [ ] Test on mobile viewport
