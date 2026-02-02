import express from 'express'
import cors from 'cors'
import { db } from './db.js'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Brave Search API configuration
const BRAVE_API_KEY = process.env.BRAVE_API_KEY
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search'

// GitHub Webhook configuration
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET

// Validate webhook signature
function verifyGitHubSignature(payload: string, signature: string): boolean {
  if (!GITHUB_WEBHOOK_SECRET) {
    console.error('[GitHub Webhook] GITHUB_WEBHOOK_SECRET not configured')
    return false
  }
  
  const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')
  
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  } catch {
    return false
  }
}

// Find project by repository URL
function findProjectByRepo(repoUrl: string): { id: string; repo_url: string } | null {
  // Normalize URL for matching
  const normalizedUrl = repoUrl.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '')
  
  const projects = db.prepare('SELECT id, repo_url FROM projects WHERE repo_url IS NOT NULL').all() as { id: string; repo_url: string }[]
  
  for (const project of projects) {
    if (project.repo_url) {
      const normalizedProjectUrl = project.repo_url.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '')
      if (normalizedUrl === normalizedProjectUrl || normalizedUrl.includes(normalizedProjectUrl) || normalizedProjectUrl.includes(normalizedUrl)) {
        return project
      }
    }
  }
  
  return null
}

// Update project progress based on GitHub activity
function updateProjectFromGitHubEvent(projectId: string, eventType: string, payload: any): void {
  const now = new Date().toISOString()
  
  // Calculate progress increment based on event type
  let progressIncrement = 0
  let activityDescription = ''
  
  switch (eventType) {
    case 'push':
      progressIncrement = 2
      const commitCount = payload.commits?.length || 1
      activityDescription = `Pushed ${commitCount} commit${commitCount > 1 ? 's' : ''} to repository`
      
      // Update commit count and last commit date
      db.prepare(`
        UPDATE projects 
        SET commit_count = COALESCE(commit_count, 0) + ?,
            last_commit_date = ?
        WHERE id = ?
      `).run(commitCount, now, projectId)
      break
      
    case 'pull_request':
      const prAction = payload.action
      if (prAction === 'opened') {
        progressIncrement = 5
        activityDescription = `Pull request opened: ${payload.pull_request?.title || 'Unknown'}`
        db.prepare('UPDATE projects SET open_prs_count = COALESCE(open_prs_count, 0) + 1 WHERE id = ?').run(projectId)
      } else if (prAction === 'closed' && payload.pull_request?.merged) {
        progressIncrement = 10
        activityDescription = `Pull request merged: ${payload.pull_request?.title || 'Unknown'}`
        db.prepare('UPDATE projects SET open_prs_count = MAX(0, COALESCE(open_prs_count, 0) - 1), progress = MIN(100, progress + 5) WHERE id = ?').run(projectId)
      } else if (prAction === 'closed') {
        progressIncrement = 3
        activityDescription = `Pull request closed: ${payload.pull_request?.title || 'Unknown'}`
        db.prepare('UPDATE projects SET open_prs_count = MAX(0, COALESCE(open_prs_count, 0) - 1) WHERE id = ?').run(projectId)
      }
      break
      
    case 'issues':
      const issueAction = payload.action
      if (issueAction === 'opened') {
        activityDescription = `Issue opened: ${payload.issue?.title || 'Unknown'}`
        db.prepare('UPDATE projects SET open_issues_count = COALESCE(open_issues_count, 0) + 1 WHERE id = ?').run(projectId)
      } else if (issueAction === 'closed') {
        progressIncrement = 3
        activityDescription = `Issue closed: ${payload.issue?.title || 'Unknown'}`
        db.prepare('UPDATE projects SET open_issues_count = MAX(0, COALESCE(open_issues_count, 0) - 1), progress = MIN(100, progress + 2) WHERE id = ?').run(projectId)
      }
      break
      
    case 'release':
      if (payload.action === 'published') {
        progressIncrement = 15
        activityDescription = `Release published: ${payload.release?.tag_name || 'Unknown'}`
        db.prepare('UPDATE projects SET last_release_date = ? WHERE id = ?').run(now, projectId)
        // Mark project as nearly complete on release
        db.prepare('UPDATE projects SET progress = MIN(100, progress + 10), status = CASE WHEN progress >= 90 THEN \'done\' ELSE status END WHERE id = ?').run(projectId)
      }
      break
  }
  
  // Update project progress
  if (progressIncrement > 0) {
    db.prepare('UPDATE projects SET progress = MIN(100, progress + ?) WHERE id = ?').run(progressIncrement, projectId)
  }
  
  // Update recent activity
  const currentActivity = db.prepare('SELECT recent_activity FROM projects WHERE id = ?').get(projectId) as { recent_activity: string | null } | undefined
  let activityList = []
  try {
    activityList = JSON.parse(currentActivity?.recent_activity || '[]')
  } catch {
    activityList = []
  }
  
  // Add new activity to the beginning, keep last 10
  activityList.unshift({
    type: eventType,
    description: activityDescription,
    timestamp: now
  })
  activityList = activityList.slice(0, 10)
  
  db.prepare('UPDATE projects SET recent_activity = ? WHERE id = ?').run(JSON.stringify(activityList), projectId)
  
  // Log to activity feed
  if (activityDescription) {
    logActivity('commit', activityDescription, projectId, null, null, { eventType, payload: { action: payload.action } })
  }
  
  // Broadcast update to WebSocket clients
  broadcastUpdate({
    type: 'github_webhook',
    projectId,
    eventType,
    timestamp: now
  })
}

// Log webhook attempt
function logWebhookAttempt(eventId: string, eventType: string, repository: string, signatureValid: boolean, error?: string): void {
  console.log(`[GitHub Webhook] ${eventId} | ${eventType} | ${repository} | Valid: ${signatureValid}${error ? ' | Error: ' + error : ''}`)
}

// Simple in-memory rate limiter for Brave Search
// Brave free tier: 1 query/second, 2000/month
const rateLimiter = {
  lastRequest: 0,
  minInterval: 1000, // 1 second between requests
  monthlyCount: 0,
  monthlyLimit: 2000,
  
  canRequest(): boolean {
    const now = Date.now()
    return (now - this.lastRequest >= this.minInterval) && (this.monthlyCount < this.monthlyLimit)
  },
  
  recordRequest(): void {
    this.lastRequest = Date.now()
    this.monthlyCount++
  },
  
  getRetryAfter(): number {
    const now = Date.now()
    return Math.ceil((this.minInterval - (now - this.lastRequest)) / 1000)
  }
}

// Middleware
app.use(cors())

// Error handling middleware
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// POST /api/webhook/github - GitHub webhook endpoint (must be before express.json() middleware)
app.post('/api/webhook/github', express.raw({ type: 'application/json' }), asyncHandler(async (req: express.Request, res: express.Response) => {
  const eventType = req.headers['x-github-event'] as string
  const eventId = req.headers['x-github-delivery'] as string
  const signature = req.headers['x-hub-signature-256'] as string
  
  // Get raw body for signature verification
  const rawBody = req.body as Buffer
  const payloadString = rawBody.toString('utf-8')
  
  // Parse payload
  let payload: any
  try {
    payload = JSON.parse(payloadString)
  } catch {
    logWebhookAttempt(eventId || 'unknown', eventType || 'unknown', 'unknown', false, 'Invalid JSON payload')
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid JSON payload',
      timestamp: new Date().toISOString()
    })
  }
  
  const repository = payload.repository?.name || payload.repository?.full_name || 'unknown'
  const repositoryUrl = payload.repository?.html_url || payload.repository?.url
  
  // Check if webhook secret is configured
  if (!GITHUB_WEBHOOK_SECRET) {
    logWebhookAttempt(eventId || 'unknown', eventType || 'unknown', repository, false, 'Webhook secret not configured')
    console.error('[GitHub Webhook] GITHUB_WEBHOOK_SECRET environment variable not set')
    return res.status(500).json({ 
      success: false, 
      error: 'Webhook secret not configured on server',
      timestamp: new Date().toISOString()
    })
  }
  
  // Verify signature
  const signatureValid = signature ? verifyGitHubSignature(payloadString, signature) : false
  
  // Log the attempt
  logWebhookAttempt(eventId || 'unknown', eventType || 'unknown', repository, signatureValid)
  
  // Store the event in database
  const stmt = db.prepare(`
    INSERT INTO github_events (event_id, event_type, repository, repository_url, action, payload, signature_valid)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  
  let eventDbId: number
  try {
    const result = stmt.run(
      eventId || crypto.randomUUID(),
      eventType || 'unknown',
      repository,
      repositoryUrl,
      payload.action || null,
      payloadString,
      signatureValid ? 1 : 0
    )
    eventDbId = result.lastInsertRowid as number
  } catch (err) {
    console.error('[GitHub Webhook] Failed to store event:', err)
  }
  
  // Reject if signature is invalid
  if (!signatureValid) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid webhook signature',
      timestamp: new Date().toISOString()
    })
  }
  
  // Only process supported events
  const supportedEvents = ['push', 'pull_request', 'issues', 'release']
  if (!supportedEvents.includes(eventType)) {
    return res.status(200).json({ 
      success: true, 
      event: eventType,
      repository,
      message: 'Event type not processed',
      timestamp: new Date().toISOString()
    })
  }
  
  // Find matching project
  const project = repositoryUrl ? findProjectByRepo(repositoryUrl) : null
  
  if (project) {
    // Update project based on event
    updateProjectFromGitHubEvent(project.id, eventType, payload)
    
    // Mark event as processed
    db.prepare('UPDATE github_events SET processed = 1, project_id = ? WHERE id = ?').run(project.id, eventDbId!)
    
    res.status(200).json({
      success: true,
      event: eventType,
      repository,
      projectUpdated: project.id,
      timestamp: new Date().toISOString()
    })
  } else {
    res.status(200).json({
      success: true,
      event: eventType,
      repository,
      message: 'No matching project found',
      timestamp: new Date().toISOString()
    })
  }
}))

// Global JSON parsing middleware (after webhook route)
app.use(express.json())

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// GET /api/webhook/github/events - Get recent GitHub webhook events
app.get('/api/webhook/github/events', asyncHandler(async (req: express.Request, res: express.Response) => {
  const limit = parseInt(req.query.limit as string) || 50
  const eventType = typeof req.query.type === 'string' ? req.query.type : undefined
  const repository = typeof req.query.repository === 'string' ? req.query.repository : undefined
  
  let query = `
    SELECT ge.*, p.name as project_name 
    FROM github_events ge
    LEFT JOIN projects p ON ge.project_id = p.id
    WHERE 1=1
  `
  const params: any[] = []
  
  if (eventType) {
    query += ' AND ge.event_type = ?'
    params.push(eventType)
  }
  
  if (repository) {
    query += ' AND ge.repository LIKE ?'
    params.push(`%${repository}%`)
  }
  
  query += ' ORDER BY ge.created_at DESC LIMIT ?'
  params.push(limit)
  
  const events = db.prepare(query).all(...params)
  
  res.json(events.map((e: any) => ({
    id: e.id,
    eventId: e.event_id,
    eventType: e.event_type,
    repository: e.repository,
    repositoryUrl: e.repository_url,
    action: e.action,
    signatureValid: e.signature_valid === 1,
    processed: e.processed === 1,
    projectId: e.project_id,
    projectName: e.project_name,
    createdAt: e.created_at
  })))
}))

// GET /api/projects - List all projects with tasks
app.get('/api/projects', asyncHandler(async (req: express.Request, res: express.Response) => {
  const projects = db.prepare(`
    SELECT p.*, 
           COUNT(t.id) as task_count,
           SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks
    FROM projects p
    LEFT JOIN tasks t ON p.id = t.project_id
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all()

  // Get tasks for each project
  const projectsWithTasks = projects.map((p: any) => {
    const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC').all(p.id)
    return {
      ...p,
      tasks: tasks || [],
      assignedQueen: p.assigned_queen,
      timeInvested: p.time_invested,
      repo_url: p.repo_url
    }
  })

  res.json(projectsWithTasks)
}))

// GET /api/projects/:id - Get single project
app.get('/api/projects/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!project) {
    return res.status(404).json({ error: 'Project not found' })
  }

  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id)
  
  res.json({
    ...project,
    tasks,
    assignedQueen: project.assigned_queen,
    timeInvested: project.time_invested
  })
}))

// POST /api/projects - Create new project
app.post('/api/projects', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id, name, description, repo_url, priority = 'medium', assigned_queen, impact, effort } = req.body
  
  const stmt = db.prepare(`
    INSERT INTO projects (id, name, description, repo_url, priority, assigned_queen, impact, effort, status, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'not_started', 0)
  `)
  
  stmt.run(id || crypto.randomUUID(), name, description, repo_url, priority, assigned_queen, impact, effort)
  
  // Log activity
  logActivity('project_created', `Project "${name}" created`, id, null, null, { priority })
  
  res.status(201).json({ success: true })
}))

// PATCH /api/projects/:id - Update project
app.patch('/api/projects/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const updates = req.body
  const allowedFields = ['name', 'description', 'status', 'progress', 'priority', 'assigned_queen', 'impact', 'effort', 'repo_url']
  
  const fields = Object.keys(updates).filter(k => allowedFields.includes(k))
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' })
  }
  
  const setClause = fields.map(f => `${f} = ?`).join(', ')
  const values = fields.map(f => updates[f])
  values.push(req.params.id)
  
  db.prepare(`UPDATE projects SET ${setClause} WHERE id = ?`).run(...values)
  
  if (updates.status) {
    logActivity('status_changed', `Project status changed to ${updates.status}`, req.params.id, null, null, updates)
  }
  
  res.json({ success: true })
}))

// GET /api/agents - Get all agents (queens and sub-agents)
app.get('/api/agents', asyncHandler(async (req: express.Request, res: express.Response) => {
  // Get all queen agents
  const queens = db.prepare('SELECT * FROM agents ORDER BY name').all()
  
  // Get sub-agents for each queen
  const queensWithSubs = await Promise.all(queens.map(async (q: any) => {
    const subAgents = db.prepare('SELECT * FROM sub_agents WHERE parent_id = ?').all(q.id)
    
    return {
      id: q.id,
      name: q.name,
      type: q.type,
      status: q.status,
      currentTask: q.current_task,
      emoji: q.emoji,
      skills: JSON.parse(q.skills || '[]'),
      description: q.description,
      color: q.color,
      stats: {
        tasksCompleted: q.stats_tasks_completed,
        successRate: q.stats_success_rate,
        currentStreak: q.stats_current_streak,
        weeklyVelocity: q.stats_weekly_velocity
      },
      memoryStats: {
        totalEntries: q.memory_total_entries,
        lastUpdated: q.memory_last_updated,
        activeContexts: q.memory_active_contexts
      },
      subAgents: subAgents.map((s: any) => ({
        id: s.id,
        name: s.name,
        emoji: s.emoji,
        description: s.description,
        specialty: s.specialty,
        status: s.status,
        spawnCost: s.spawn_cost,
        spawnedCount: s.spawned_count
      }))
    }
  }))
  
  res.json(queensWithSubs)
}))

// GET /api/agents/:id - Get single agent with memory
app.get('/api/agents/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id)
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' })
  }
  
  const subAgents = db.prepare('SELECT * FROM sub_agents WHERE parent_id = ?').all(req.params.id)
  const memory = db.prepare('SELECT * FROM memory WHERE agent_id = ? ORDER BY timestamp DESC LIMIT 50').all(req.params.id)
  const preferences = db.prepare('SELECT * FROM preferences WHERE agent_id = ?').all(req.params.id)
  const contexts = db.prepare('SELECT * FROM project_contexts WHERE agent_id = ?').all(req.params.id)
  
  res.json({
    ...agent,
    skills: JSON.parse(agent.skills || '[]'),
    subAgents,
    memory,
    preferences,
    activeProjects: contexts
  })
}))

// GET /api/memory/:agentId - Get agent memory
app.get('/api/memory/:agentId', asyncHandler(async (req: express.Request, res: express.Response) => {
  const entries = db.prepare(`
    SELECT * FROM memory 
    WHERE agent_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 100
  `).all(req.params.agentId)
  
  res.json(entries.map((e: any) => ({
    ...e,
    tags: JSON.parse(e.tags || '[]')
  })))
}))

// POST /api/memory - Add memory entry
app.post('/api/memory', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { agent_id, type, content, tags, project_id } = req.body
  
  const stmt = db.prepare(`
    INSERT INTO memory (id, agent_id, type, content, tags, project_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(crypto.randomUUID(), agent_id, type, content, JSON.stringify(tags || []), project_id)
  
  // Update agent memory stats
  db.prepare(`
    UPDATE agents 
    SET memory_total_entries = (SELECT COUNT(*) FROM memory WHERE agent_id = ?),
        memory_last_updated = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(agent_id, agent_id)
  
  res.status(201).json({ success: true })
}))

// GET /api/workers - Get worker queue status
app.get('/api/workers', asyncHandler(async (req: express.Request, res: express.Response) => {
  const active = db.prepare(`
    SELECT * FROM workers WHERE status = 'active' ORDER BY spawned_at DESC
  `).all()
  
  const queue = db.prepare(`
    SELECT * FROM workers WHERE status = 'queued' ORDER BY queued_at ASC
  `).all()
  
  const recent = db.prepare(`
    SELECT * FROM workers WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 10
  `).all()
  
  res.json({
    active: active.map((w: any) => ({
      specialist: w.specialist,
      taskId: w.task_id,
      queuedAt: w.queued_at,
      spawnedAt: w.spawned_at,
      eta: w.eta
    })),
    queue: queue.map((w: any) => ({
      specialist: w.specialist,
      taskId: w.task_id,
      queuedAt: w.queued_at
    })),
    recent: recent.map((w: any) => ({
      specialist: w.specialist,
      taskId: w.task_id,
      completedAt: w.completed_at
    }))
  })
}))

// GET /api/tokens - Get token usage stats
app.get('/api/tokens', asyncHandler(async (req: express.Request, res: express.Response) => {
  const period = req.query.period as string || 'today'
  
  let dateFilter: string
  const now = new Date()
  
  switch (period) {
    case 'today':
      dateFilter = now.toISOString().split('T')[0]
      break
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFilter = weekAgo.toISOString().split('T')[0]
      break
    case 'month':
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateFilter = monthAgo.toISOString().split('T')[0]
      break
    default:
      dateFilter = now.toISOString().split('T')[0]
  }
  
  // Aggregate token usage
  const stats = db.prepare(`
    SELECT 
      SUM(tokens_used) as total_tokens,
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(cost) as total_cost,
      SUM(session_count) as total_sessions,
      date
    FROM tokens
    WHERE date >= ?
    GROUP BY date
    ORDER BY date ASC
  `).all(dateFilter)
  
  // Agent breakdown
  const agentBreakdown = db.prepare(`
    SELECT 
      agent_id,
      SUM(tokens_used) as tokens_used,
      SUM(cost) as cost,
      SUM(session_count) as sessions
    FROM tokens
    WHERE date >= ?
    GROUP BY agent_id
  `).all(dateFilter)
  
  // Model breakdown
  const modelBreakdown = db.prepare(`
    SELECT 
      model,
      SUM(tokens_used) as tokens_used,
      SUM(input_tokens) as input_tokens,
      SUM(output_tokens) as output_tokens,
      SUM(cost) as cost,
      SUM(session_count) as sessions
    FROM tokens
    WHERE date >= ? AND model IS NOT NULL
    GROUP BY model
  `).all(dateFilter)
  
  const totalTokens = stats.reduce((sum: number, s: any) => sum + (s.total_tokens || 0), 0)
  const totalCost = stats.reduce((sum: number, s: any) => sum + (s.total_cost || 0), 0)
  const totalSessions = stats.reduce((sum: number, s: any) => sum + (s.total_sessions || 0), 0)
  
  res.json({
    period,
    generatedAt: new Date().toISOString(),
    totalTokensUsed: totalTokens,
    totalCost,
    avgTokensPerTask: totalSessions > 0 ? Math.round(totalTokens / totalSessions) : 0,
    sessionCount: totalSessions,
    dailyStats: stats.map((s: any) => ({
      date: s.date,
      tokensUsed: s.total_tokens,
      inputTokens: s.total_input,
      outputTokens: s.total_output,
      cost: s.total_cost,
      sessions: s.total_sessions
    })),
    agentBreakdown: agentBreakdown.map((a: any) => ({
      agentId: a.agent_id,
      tokensUsed: a.tokens_used,
      cost: a.cost,
      sessions: a.sessions
    })),
    modelBreakdown: modelBreakdown.map((m: any) => ({
      modelId: m.model,
      modelName: m.model,
      tokensUsed: m.tokens_used,
      inputTokens: m.input_tokens,
      outputTokens: m.output_tokens,
      cost: m.cost,
      sessions: m.sessions
    }))
  })
}))

// GET /api/activity - Get activity feed
app.get('/api/activity', asyncHandler(async (req: express.Request, res: express.Response) => {
  const limit = parseInt(req.query.limit as string) || 50
  
  const activities = db.prepare(`
    SELECT * FROM activity
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit)
  
  res.json(activities.map((a: any) => ({
    id: a.id,
    action_type: a.action_type,
    description: a.description,
    project_id: a.project_id,
    task_id: a.task_id,
    agent_id: a.agent_id,
    metadata: JSON.parse(a.metadata || '{}'),
    timestamp: a.timestamp
  })))
}))

// POST /api/activity - Log activity
app.post('/api/activity', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { action_type, description, project_id, task_id, agent_id, metadata } = req.body
  
  logActivity(action_type, description, project_id, task_id, agent_id, metadata)
  
  res.status(201).json({ success: true })
}))

// POST /api/update - Main update endpoint for agents
app.post('/api/update', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { agent, project, task, status, tokensUsed, timestamp, model, cost = 0 } = req.body
  
  console.log(`[Update] Agent: ${agent}, Project: ${project}, Task: ${task}, Status: ${status}, Tokens: ${tokensUsed}`)
  
  // Update agent status
  if (agent) {
    db.prepare(`
      UPDATE agents 
      SET status = ?, current_task = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status === 'done' ? 'idle' : 'active', status === 'done' ? null : task, agent)
  }
  
  // Update task status
  if (task && status) {
    const taskExists = db.prepare('SELECT id FROM tasks WHERE id = ?').get(task)
    if (taskExists) {
      db.prepare(`
        UPDATE tasks 
        SET status = ?, completed_at = CASE WHEN ? = 'done' THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = ?
      `).run(status, status, task)
    }
  }
  
  // Log token usage
  if (tokensUsed && tokensUsed > 0) {
    const date = (timestamp ? new Date(timestamp) : new Date()).toISOString().split('T')[0]
    
    // Try to update existing record
    const existing = db.prepare(`
      SELECT id FROM tokens WHERE date = ? AND agent_id = ? AND (model = ? OR (model IS NULL AND ? IS NULL))
    `).get(date, agent, model, model)
    
    if (existing) {
      db.prepare(`
        UPDATE tokens 
        SET tokens_used = tokens_used + ?,
            cost = cost + ?,
            session_count = session_count + 1
        WHERE id = ?
      `).run(tokensUsed, cost, existing.id)
    } else {
      db.prepare(`
        INSERT INTO tokens (date, agent_id, model, tokens_used, cost, session_count)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(date, agent, model, tokensUsed, cost)
    }
  }
  
  // Log activity
  logActivity('agent_action', `Agent ${agent} ${status} task "${task}"`, project, task, agent, req.body)
  
  // Broadcast update to WebSocket clients
  broadcastUpdate({ type: 'agent_update', agent, project, task, status, timestamp })
  
  res.json({ success: true, received: true })
}))

// POST /api/tasks - Create new task
app.post('/api/tasks', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id, project_id, title, description, priority, assigned_agent, estimated_token_cost } = req.body
  
  const stmt = db.prepare(`
    INSERT INTO tasks (id, project_id, title, description, priority, assigned_agent, estimated_token_cost, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'queued')
  `)
  
  stmt.run(id || crypto.randomUUID(), project_id, title, description, priority, assigned_agent, estimated_token_cost)
  
  logActivity('task_created', `Task "${title}" created`, project_id, id, assigned_agent, { priority })
  
  res.status(201).json({ success: true })
}))

// PATCH /api/tasks/:id - Update task
app.patch('/api/tasks/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const updates = req.body
  const allowedFields = ['title', 'description', 'status', 'priority', 'assigned_agent', 'blocker_reason', 'action_required']
  
  const fields = Object.keys(updates).filter(k => allowedFields.includes(k))
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' })
  }
  
  const setClause = fields.map(f => `${f} = ?`).join(', ')
  const values = fields.map(f => updates[f])
  
  if (updates.status === 'done') {
    fields.push('completed_at')
    values.push(new Date().toISOString())
  }
  
  values.push(req.params.id)
  
  db.prepare(`UPDATE tasks SET ${setClause}${updates.status === 'done' ? ', completed_at = ?' : ''} WHERE id = ?`).run(...values)
  
  res.json({ success: true })
}))

// GET /api/dashboard - Dashboard summary
app.get('/api/dashboard', asyncHandler(async (req: express.Request, res: express.Response) => {
  const projectStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
    FROM projects
  `).get()
  
  const activeAgents = db.prepare(`
    SELECT COUNT(*) as count FROM agents WHERE status = 'active'
  `).get()
  
  const queuedWorkers = db.prepare(`
    SELECT COUNT(*) as count FROM workers WHERE status = 'queued'
  `).get()
  
  const tokenStats = db.prepare(`
    SELECT 
      SUM(tokens_used) as total_tokens,
      SUM(cost) as total_cost
    FROM tokens
    WHERE date >= date('now', '-7 days')
  `).get()
  
  res.json({
    schemaVersion: '2.0',
    lastUpdated: new Date().toISOString(),
    meta: {
      totalProjects: projectStats?.total || 0,
      completedProjects: projectStats?.completed || 0,
      inProgressProjects: projectStats?.in_progress || 0,
      activeAgents: activeAgents?.count || 0,
      queuedWorkers: queuedWorkers?.count || 0,
      totalTokensUsed: tokenStats?.total_tokens || 0,
      totalCost: tokenStats?.total_cost || 0,
      avgTokensPerTask: 0,
      tokenWastePercent: 0,
      parallelizationEfficiency: 0
    }
  })
}))

// GET /api/stats - Dashboard stats (alias)
app.get('/api/stats', asyncHandler(async (req: express.Request, res: express.Response) => {
  const projectStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
    FROM projects
  `).get()
  
  const activeAgents = db.prepare(`
    SELECT COUNT(*) as count FROM agents WHERE status = 'active'
  `).get()
  
  const queuedWorkers = db.prepare(`
    SELECT COUNT(*) as count FROM workers WHERE status = 'queued'
  `).get()
  
  const today = new Date().toISOString().split('T')[0]
  const tokenStats = db.prepare(`
    SELECT SUM(tokens_used) as total FROM tokens WHERE date = ?
  `).get(today)
  
  res.json({
    totalProjects: projectStats?.total || 0,
    completedProjects: projectStats?.completed || 0,
    inProgressProjects: projectStats?.in_progress || 0,
    activeAgents: activeAgents?.count || 0,
    queuedWorkers: queuedWorkers?.count || 0,
    totalTokensUsed: tokenStats?.total || 0
  })
}))

// POST /api/collect/:source - Trigger data collection
app.post('/api/collect/:source', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { source } = req.params
  const validCollectors = ['github', 'gateway', 'sessions', 'memory']
  
  if (!validCollectors.includes(source)) {
    return res.status(400).json({ error: 'Invalid collector' })
  }
  
  try {
    const { stdout, stderr } = await execAsync(`cd ${__dirname} && tsx collectors/${source}.ts`)
    console.log(`Collector ${source} output:`, stdout)
    if (stderr) console.error(`Collector ${source} errors:`, stderr)
    
    res.json({ success: true, collector: source, output: stdout })
  } catch (error) {
    console.error(`Collector ${source} failed:`, error)
    res.status(500).json({ error: 'Collector failed', details: (error as Error).message })
  }
}))

// POST /api/search - Brave Search API endpoint
app.post('/api/search', asyncHandler(async (req: express.Request, res: express.Response) => {
  // Check if API key is configured
  if (!BRAVE_API_KEY) {
    return res.status(503).json({
      error: 'Search service unavailable',
      message: 'BRAVE_API_KEY is not configured. Please set the environment variable.'
    })
  }

  // Validate request body
  const { query, count = 10 } = req.body
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Query parameter is required and must be a string'
    })
  }

  // Validate count parameter
  const resultCount = Math.min(Math.max(1, parseInt(count as string) || 10), 20) // Max 20 results

  // Check rate limit
  if (!rateLimiter.canRequest()) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many search requests. Please try again later.',
      retryAfter: rateLimiter.getRetryAfter()
    })
  }

  try {
    // Construct search URL
    const searchUrl = new URL(BRAVE_API_URL)
    searchUrl.searchParams.append('q', query)
    searchUrl.searchParams.append('count', resultCount.toString())

    console.log(`[Brave Search] Query: "${query}", Count: ${resultCount}`)

    // Make request to Brave Search API
    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json'
      }
    })

    // Record the request for rate limiting
    rateLimiter.recordRequest()

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Brave Search] API error: ${response.status} - ${errorText}`)
      
      if (response.status === 401 || response.status === 403) {
        return res.status(503).json({
          error: 'Search service unavailable',
          message: 'Invalid API key or subscription issue'
        })
      }
      
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Brave API rate limit reached. Please try again later.'
        })
      }
      
      throw new Error(`Brave API returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    // Parse and format results
    const results = data.web?.results?.map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      description: result.description || '',
      age: result.age || null,
      favicon: result.profile?.img || null
    })) || []

    console.log(`[Brave Search] Found ${results.length} results for "${query}"`)

    // Log activity
    logActivity('search_performed', `Search query: "${query}" (${results.length} results)`, null, null, null, { query, resultCount: results.length })

    res.json({
      success: true,
      query,
      resultCount: results.length,
      results,
      searchTime: data.searchTime || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Brave Search] Error:', error)
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
}))

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

// Helper function to log activity
function logActivity(
  actionType: string, 
  description: string, 
  projectId: string | null = null, 
  taskId: string | null = null,
  agentId: string | null = null,
  metadata: any = null
) {
  const stmt = db.prepare(`
    INSERT INTO activity (id, action_type, description, project_id, task_id, agent_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(crypto.randomUUID(), actionType, description, projectId, taskId, agentId, JSON.stringify(metadata))
}

// Create HTTP server
const server = createServer(app)

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' })

const clients = new Set<any>()

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected')
  clients.add(ws)
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('[WebSocket] Received:', data)
    } catch (e) {
      // Ignore non-JSON messages
    }
  })
  
  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected')
    clients.delete(ws)
  })
  
  // Send initial connection confirmation
  ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }))
})

function broadcastUpdate(data: any) {
  const message = JSON.stringify(data)
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message)
    }
  })
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Kato Dashboard Backend running on port ${PORT}`)
  console.log(`📊 API: http://localhost:${PORT}/api`)
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`)
  console.log(`✅ Health: http://localhost:${PORT}/health`)
})

export { broadcastUpdate }
