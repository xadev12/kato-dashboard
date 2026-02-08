/**
 * Kato Dashboard v3 Backend
 *
 * Phase 1: Foundation
 * - Reads directly from source files (no SQLite)
 * - Unified /api/status endpoint
 * - Real-time data from pipeline.json, ROADMAP.md, session files
 */

import express from 'express'
import cors from 'cors'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import dotenv from 'dotenv'

// Source readers
import { getProjects, getActiveProjects, getProject } from './sources/projects.js'
import { parseRoadmap, getQueue, getSprintInfo } from './sources/roadmap.js'
import { getTokenStats, getQuickTokenStats, clearTokenCache } from './sources/tokens.js'
import { getAgents, getAgentsWithStatus, getGatewayInfo } from './sources/agents.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Error handling wrapper
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req, res) => {
  const gateway = getGatewayInfo()
  res.json({
    status: 'ok',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    gateway: gateway ? { port: gateway.port, mode: gateway.mode } : null
  })
})

// ============================================================================
// UNIFIED STATUS ENDPOINT - The main mission control endpoint
// ============================================================================

app.get('/api/status', asyncHandler(async (req: express.Request, res: express.Response) => {
  const [
    activeProjects,
    roadmap,
    agents,
    tokenStats
  ] = await Promise.all([
    getActiveProjects(),
    parseRoadmap(),
    getAgentsWithStatus(),
    getQuickTokenStats()
  ])

  // Find blocked items
  const blockedProjects = activeProjects.filter(p => p.status === 'blocked')
  const blockedTasks = activeProjects
    .flatMap(p => p.tasks.filter(t => t.status === 'blocked'))

  // Calculate system health
  const activeAgents = agents.filter(a => a.status === 'active')
  const dailyBudget = 20 // $20/day default
  const budgetUsedPercent = (tokenStats.today.cost / dailyBudget) * 100

  res.json({
    schemaVersion: '3.0',
    generatedAt: new Date().toISOString(),

    // Sprint info
    sprint: roadmap.sprint ? {
      name: roadmap.sprint.name,
      day: calculateSprintDay(roadmap.sprint.startDate),
      totalDays: 60,
      targets: roadmap.sprint.targets
    } : null,

    // Active work
    activeWork: {
      projects: activeProjects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        progress: p.progress,
        currentStage: p.currentStage,
        priority: p.priority,
        blocker: p.blockerReason,
        assignedQueen: p.assignedQueen,
        updatedAt: p.updatedAt
      })),
      blockedCount: blockedProjects.length + blockedTasks.length
    },

    // Queue (next items from roadmap)
    queue: roadmap.active.concat(roadmap.backlog.slice(0, 3)).slice(0, 5).map(item => ({
      id: item.id,
      feature: item.feature,
      project: item.project,
      priority: item.priority,
      complexity: item.complexity
    })),

    // System health
    systemHealth: {
      tokens: {
        today: tokenStats.today.tokensUsed,
        cost: tokenStats.today.cost,
        budget: dailyBudget,
        budgetUsedPercent: Math.round(budgetUsedPercent),
        overBudget: budgetUsedPercent > 100
      },
      agents: {
        total: agents.length,
        active: activeAgents.length,
        idle: agents.length - activeAgents.length,
        list: agents.map(a => ({
          id: a.id,
          name: a.name,
          status: a.status,
          currentTask: a.currentTask,
          emoji: a.emoji
        }))
      }
    },

    // Quick stats for header
    meta: {
      totalActiveProjects: activeProjects.length,
      totalBlockers: blockedProjects.length + blockedTasks.length,
      lastUpdated: new Date().toISOString()
    }
  })
}))

/**
 * Calculate current sprint day
 */
function calculateSprintDay(startDate?: string): number {
  if (!startDate) return 1

  // Parse "Feb 6" format
  const year = 2026 // Hardcoded for now
  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  }

  const match = startDate.match(/(\w+)\s+(\d+)/)
  if (!match) return 1

  const month = monthMap[match[1]]
  const day = parseInt(match[2])

  if (month === undefined) return 1

  const start = new Date(year, month, day)
  const now = new Date()
  const diffTime = now.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(1, diffDays)
}

// ============================================================================
// PROJECT ENDPOINTS
// ============================================================================

app.get('/api/projects', asyncHandler(async (req: express.Request, res: express.Response) => {
  const status = req.query.status as string | undefined
  let projects = await getProjects()

  if (status) {
    projects = projects.filter(p => p.status === status)
  }

  res.json(projects)
}))

app.get('/api/projects/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const project = await getProject(req.params.id)

  if (!project) {
    return res.status(404).json({ error: 'Project not found' })
  }

  res.json(project)
}))

// ============================================================================
// ROADMAP ENDPOINTS
// ============================================================================

app.get('/api/roadmap', asyncHandler(async (req: express.Request, res: express.Response) => {
  const roadmap = await parseRoadmap()
  res.json(roadmap)
}))

app.get('/api/queue', asyncHandler(async (req: express.Request, res: express.Response) => {
  const limit = parseInt(req.query.limit as string) || 5
  const queue = await getQueue(limit)
  res.json(queue)
}))

app.get('/api/sprint', asyncHandler(async (req: express.Request, res: express.Response) => {
  const sprint = await getSprintInfo()

  if (!sprint) {
    return res.status(404).json({ error: 'No active sprint found' })
  }

  res.json({
    ...sprint,
    day: calculateSprintDay(sprint.startDate),
    totalDays: 60
  })
}))

// ============================================================================
// AGENT ENDPOINTS
// ============================================================================

app.get('/api/agents', asyncHandler(async (req: express.Request, res: express.Response) => {
  const withStatus = req.query.status !== 'false'

  const agents = withStatus
    ? await getAgentsWithStatus()
    : getAgents()

  res.json(agents)
}))

// ============================================================================
// TOKEN ENDPOINTS
// ============================================================================

app.get('/api/tokens', asyncHandler(async (req: express.Request, res: express.Response) => {
  const period = (req.query.period as 'today' | 'week' | 'month') || 'today'
  const stats = await getTokenStats(period)
  res.json(stats)
}))

app.post('/api/tokens/refresh', asyncHandler(async (req: express.Request, res: express.Response) => {
  clearTokenCache()
  const stats = await getQuickTokenStats()
  res.json({ success: true, stats })
}))

// ============================================================================
// DASHBOARD DATA EXPORT
// ============================================================================

app.get('/api/dashboard-data', asyncHandler(async (req: express.Request, res: express.Response) => {
  // Generate dashboard-data.json format for static fallback
  const [projects, agents, tokenStats, roadmap] = await Promise.all([
    getProjects(),
    getAgentsWithStatus(),
    getQuickTokenStats(),
    parseRoadmap()
  ])

  const data = {
    schemaVersion: '3.0',
    lastUpdated: new Date().toISOString(),
    agents: {
      queens: agents.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        status: a.status,
        currentTask: a.currentTask,
        role: a.role,
        workspace: a.workspace,
        emoji: a.emoji
      })),
      workers: {
        specialists: [],
        active: [],
        queue: [],
        recent: []
      }
    },
    projects: projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status === 'done' ? 'done' : p.status === 'blocked' ? 'blocked' : 'in_progress',
      priority: p.priority === 'P1' ? 'high' : p.priority === 'P2' ? 'medium' : 'low',
      progress: p.progress,
      currentStage: p.currentStage,
      assignedQueen: p.assignedQueen,
      blocker: p.blockerReason,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      tasks: p.tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assignedAgent: t.assignedAgent,
        completed_at: t.completedAt,
        blockerReason: t.blockerReason
      }))
    })),
    roadmap: {
      sprint: roadmap.sprint,
      active: roadmap.active,
      backlog: roadmap.backlog.slice(0, 10)
    },
    meta: {
      totalProjects: projects.length,
      completedProjects: projects.filter(p => p.status === 'done').length,
      inProgressProjects: projects.filter(p => p.status === 'in_progress').length,
      blockedProjects: projects.filter(p => p.status === 'blocked').length,
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      tokenStats: {
        today: tokenStats.today,
        totalRequests: tokenStats.totalRequests
      }
    }
  }

  res.json(data)
}))

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Error]', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
})

// ============================================================================
// WEBSOCKET SERVER
// ============================================================================

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const clients = new Set<WebSocket>()
const clientSubscriptions = new Map<WebSocket, Set<string>>()

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected')
  clients.add(ws)
  clientSubscriptions.set(ws, new Set())

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())

      if (data.action === 'subscribe' && data.channel) {
        const subs = clientSubscriptions.get(ws)
        if (subs) {
          subs.add(data.channel)
          console.log(`[WebSocket] Client subscribed to: ${data.channel}`)

          // Send initial data
          if (data.channel === 'status') {
            const status = await getQuickStatus()
            ws.send(JSON.stringify({ type: 'status', data: status }))
          }
        }
      }

      if (data.action === 'unsubscribe' && data.channel) {
        clientSubscriptions.get(ws)?.delete(data.channel)
      }
    } catch {
      // Ignore invalid messages
    }
  })

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected')
    clients.delete(ws)
    clientSubscriptions.delete(ws)
  })

  ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }))
})

/**
 * Get quick status for WebSocket updates
 */
async function getQuickStatus() {
  const [activeProjects, agents, tokenStats] = await Promise.all([
    getActiveProjects(),
    getAgentsWithStatus(),
    getQuickTokenStats()
  ])

  return {
    activeProjects: activeProjects.length,
    blockedCount: activeProjects.filter(p => p.status === 'blocked').length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    tokenCost: tokenStats.today.cost,
    timestamp: new Date().toISOString()
  }
}

// Broadcast status updates every 30 seconds
setInterval(async () => {
  const status = await getQuickStatus()
  const message = JSON.stringify({ type: 'status', data: status })

  clients.forEach(client => {
    const subs = clientSubscriptions.get(client)
    if (client.readyState === WebSocket.OPEN && subs?.has('status')) {
      client.send(message)
    }
  })
}, 30000)

// ============================================================================
// START SERVER
// ============================================================================

server.listen(PORT, () => {
  console.log(`\n🚀 Kato Dashboard v3 Backend`)
  console.log(`   Version: 3.0.0 (Phase 1 - Foundation)`)
  console.log(`   API: http://localhost:${PORT}/api`)
  console.log(`   WebSocket: ws://localhost:${PORT}/ws`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`\n📂 Data Sources:`)
  console.log(`   Projects: /Users/devl/clawd/projects/*/pipeline.json`)
  console.log(`   Roadmap: /Users/devl/clawd/ROADMAP.md`)
  console.log(`   Tokens: ~/.openclaw/agents/*/sessions/*.jsonl`)
  console.log(`   Agents: ~/.openclaw/openclaw.json`)
  console.log()
})

export { server }
