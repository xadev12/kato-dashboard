# Kato Dashboard

A Mini Linear-style project dashboard for tracking the Kato multi-agent system. Built with React + TypeScript + Tailwind CSS + SQLite backend.

![Dark mode dashboard](https://img.shields.io/badge/theme-dark-030712) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![React](https://img.shields.io/badge/React-19-blue) ![Backend](https://img.shields.io/badge/backend-Express%20%2B%20SQLite-green)

## Features

- **Kanban Board** — Backlog → In Progress → Done columns
- **Project Cards** — Name, status, progress bar, GitHub link
- **Task Management** — Click to cycle task status
- **Agent Roster** — Queen agents with sub-agents and stats
- **Token Dashboard** — Real-time token usage and costs
- **Activity Feed** — Last 50 actions with timestamps
- **Memory Management** — Agent memory and preferences
- **Real-time Updates** — WebSocket for live data
- **PWA** — Installable, mobile-responsive dark mode design

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │      │   Backend API    │      │   Data Sources  │
│   (React)       │◄────►│   (Express)      │◄────►│   - GitHub      │
│                 │ WS   │                  │      │   - Gateway     │
│   Port 5173     │      │   Port 3001      │      │   - Sessions    │
└─────────────────┘      └──────────────────┘      │   - Memory      │
                            │                       └─────────────────┘
                            ▼
                     ┌──────────────────┐
                     │   SQLite DB      │
                     │   dashboard.db   │
                     └──────────────────┘
```

## Quick Start

### Option 1: Full Stack (Recommended)

```bash
# Start both backend and frontend
./start.sh
```

Or manually:

```bash
# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: Frontend
npm install && npm run dev
```

### Option 2: Frontend Only (Mock Data)

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Backend Setup

The backend is located in `/backend` and includes:

- **API Server**: Express.js with REST endpoints
- **Database**: SQLite with WAL mode
- **WebSocket**: Real-time updates
- **Collectors**: GitHub, Gateway, Sessions, Memory

```bash
cd backend

# Install dependencies
npm install

# Seed database
npm run seed

# Start development server (with hot reload)
npm run dev

# Or build and run production
npm run build
npm start
```

### Data Collectors

Collectors automatically gather data from various sources:

```bash
# Run all collectors
npm run collect:all

# Run individual collectors
npm run collect:github    # Polls GitHub repos every 5 min
npm run collect:gateway   # Captures gateway logs
npm run collect:sessions  # Parses session files
npm run collect:memory    # Watches MEMORY.md files
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/projects` | List all projects |
| `GET /api/agents` | List all agents |
| `GET /api/workers` | Worker queue status |
| `GET /api/tokens?period=week` | Token usage stats |
| `GET /api/activity` | Activity feed |
| `POST /api/update` | Agent status updates |
| `WS /ws` | WebSocket for real-time updates |

See [backend/README.md](backend/README.md) for full API documentation.

## Environment Variables

Create `.env` in the root:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001/api
```

## Deployment

### Frontend (Vercel)

```bash
npm run build
npx vercel --prod
```

### Backend

The backend can run alongside the frontend or as a separate service:

```bash
cd backend
npm run build
npm start
```

For production, consider:
- PM2: `pm2 start dist/server.js --name kato-dashboard-backend`
- Docker: Containerize with SQLite volume
- Fly.io/Railway: Deploy with persistent storage

## Project Structure

```
kato-dashboard/
├── backend/              # Express API server
│   ├── server.ts         # Main server
│   ├── db.ts             # Database connection
│   ├── schema.sql        # Database schema
│   ├── seed.ts           # Seed data
│   └── collectors/       # Data collection scripts
│       ├── index.ts      # Collector runner
│       ├── github.ts     # GitHub API collector
│       ├── gateway.ts    # Gateway log collector
│       ├── sessions.ts   # Session parser
│       └── memory.ts     # Memory file watcher
├── src/                  # Frontend React app
│   ├── components/       # UI components
│   ├── pages/            # Route pages
│   ├── hooks/            # React hooks (API integration)
│   ├── services/         # API clients
│   └── types/            # TypeScript types
├── data/                 # SQLite database
└── dist/                 # Production build
```

## Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4
- **Backend:** Express.js + better-sqlite3 + WebSocket
- **Build:** Vite 7
- **Deploy:** Vercel (frontend), Node.js (backend)

## Integration

Agents report status via HTTP POST:

```typescript
await fetch('http://localhost:3001/api/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agent: 'main',
    project: 'kato-dashboard',
    task: 'build backend',
    status: 'done',
    tokensUsed: 15000,
    timestamp: new Date().toISOString()
  })
})
```

## License

MIT
