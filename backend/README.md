# Kato Dashboard Backend

Real-time backend API for the Kato Dashboard multi-agent system.

## Architecture

- **Database**: SQLite with WAL mode for better concurrency
- **API Server**: Express.js with TypeScript
- **Real-time**: WebSocket for live updates
- **Collectors**: Modular data collection scripts

## Quick Start

```bash
# Install dependencies
npm install

# Seed database with initial data
npm run seed

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects with tasks
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PATCH /api/projects/:id` - Update project

### Agents
- `GET /api/agents` - List all queen agents with sub-agents
- `GET /api/agents/:id` - Get single agent with memory
- `GET /api/memory/:agentId` - Get agent memory entries

### Workers
- `GET /api/workers` - Get worker queue status (active, queued, recent)

### Token Stats
- `GET /api/tokens?period=today|week|month` - Get token usage statistics

### Activity
- `GET /api/activity?limit=50` - Get activity feed
- `POST /api/activity` - Log new activity

### Updates
- `POST /api/update` - Main endpoint for agents to report status

### System
- `GET /health` - Health check
- `GET /api/stats` - Dashboard statistics
- `POST /api/collect/:source` - Trigger data collection (github|gateway|sessions|memory)

## Data Collectors

Collectors run automatically or can be triggered manually:

```bash
# Run all collectors
npm run collect:all

# Run individual collectors
npm run collect:github    # Polls GitHub for repo activity
npm run collect:gateway   # Captures OpenClaw gateway logs
npm run collect:sessions  # Parses session .jsonl files
npm run collect:memory    # Watches MEMORY.md for changes
```

### GitHub Collector
- Polls repos every 5 minutes
- Updates project progress based on commits/PRs
- Auto-detects project status changes

### Gateway Collector
- Captures token usage from OpenClaw gateway
- Records sessions and costs
- Real-time or near real-time

### Session Collector
- Parses `.jsonl` session files
- Extracts agent activity and task completions
- Updates task status automatically

### Memory Collector
- Watches MEMORY.md and daily memory files
- Extracts decisions, observations, lessons
- Updates freshness scores over time

## Database Schema

See `schema.sql` for full schema definition.

Key tables:
- `projects` - Project metadata, status, progress
- `tasks` - Individual tasks with assignments
- `agents` - Queen agents with stats
- `sub_agents` - Specialist sub-agents
- `workers` - Active and queued workers
- `sessions` - Session logs with token usage
- `tokens` - Aggregated token usage by date/agent/model
- `activity` - Activity feed
- `memory` - Agent memory entries

## Environment Variables

```bash
# Server
PORT=3001
DASHBOARD_DB_PATH=./data/dashboard.db

# Paths (auto-detected if not set)
OPENCLAW_HOME=/Users/devl/clawd
GATEWAY_LOG_PATH=/Users/devl/clawd/logs/gateway.log
SESSIONS_DIR=/Users/devl/clawd/sessions
MEMORY_PATH=/Users/devl/clawd/memory
```

## WebSocket Real-time Updates

Connect to `ws://localhost:3001/ws` for real-time updates.

Message format:
```json
{
  "type": "agent_update",
  "agent": "main",
  "project": "kato-dashboard",
  "task": "build backend",
  "status": "done",
  "timestamp": "2026-02-02T12:00:00Z"
}
```

## Development

```bash
# Watch mode with auto-restart
npm run dev

# Type checking
npx tsc --noEmit

# Reset database
npm run db:reset
```

## Production Deployment

```bash
# Build
npm run build

# Start server
npm start

# Or with PM2
pm2 start dist/server.js --name kato-dashboard-backend
```

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
    model: 'claude-sonnet-4',
    timestamp: new Date().toISOString()
  })
})
```
