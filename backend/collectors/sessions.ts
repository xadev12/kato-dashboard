/**
 * Session Collector
 * Parses .jsonl session files for agent activity
 * Extracts task completions, token usage, and agent actions
 */

import { db } from '../db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to session files
const OPENCLAW_HOME = process.env.OPENCLAW_HOME || '/Users/devl/clawd'
const SESSIONS_DIR = process.env.SESSIONS_DIR || path.join(OPENCLAW_HOME, 'sessions')
const LAST_SCAN_FILE = path.join(__dirname, '..', 'data', '.sessions-last-scan')

interface SessionEntry {
  timestamp: string
  level: string
  message: string
  agent?: string
  project?: string
  task?: string
  tokens?: number
  model?: string
  status?: 'started' | 'completed' | 'failed'
  duration?: number
}

interface ParsedSession {
  sessionId: string
  agentId: string
  projectId?: string
  taskId?: string
  startedAt: string
  completedAt?: string
  tokensUsed: number
  model: string
  status: 'active' | 'completed' | 'failed'
  activities: SessionActivity[]
}

interface SessionActivity {
  type: 'task_started' | 'task_completed' | 'subagent_spawned' | 'error' | 'info'
  timestamp: string
  message: string
  metadata?: any
}

/**
 * Parse a session JSONL file
 */
function parseSessionFile(filePath: string): ParsedSession | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').filter(l => l.trim())
    
    const activities: SessionActivity[] = []
    let sessionData: Partial<ParsedSession> = {
      tokensUsed: 0,
      model: 'unknown',
      status: 'active'
    }
    
    for (const line of lines) {
      try {
        const entry: SessionEntry = JSON.parse(line)
        
        // Extract session metadata from first entry
        if (!sessionData.sessionId && entry.agent) {
          sessionData.sessionId = path.basename(filePath, '.jsonl')
          sessionData.agentId = entry.agent
          sessionData.projectId = entry.project
          sessionData.taskId = entry.task
          sessionData.startedAt = entry.timestamp
          sessionData.model = entry.model || 'unknown'
        }
        
        // Track tokens
        if (entry.tokens) {
          sessionData.tokensUsed = (sessionData.tokensUsed || 0) + entry.tokens
        }
        
        // Track status changes
        if (entry.status) {
          if (entry.status === 'completed') {
            sessionData.status = 'completed'
            sessionData.completedAt = entry.timestamp
          } else if (entry.status === 'failed') {
            sessionData.status = 'failed'
            sessionData.completedAt = entry.timestamp
          }
        }
        
        // Parse activities from message
        const activity = parseActivityFromMessage(entry)
        if (activity) {
          activities.push(activity)
        }
        
      } catch (e) {
        // Skip invalid lines
      }
    }
    
    if (!sessionData.sessionId) return null
    
    return {
      sessionId: sessionData.sessionId,
      agentId: sessionData.agentId!,
      projectId: sessionData.projectId,
      taskId: sessionData.taskId,
      startedAt: sessionData.startedAt!,
      completedAt: sessionData.completedAt,
      tokensUsed: sessionData.tokensUsed || 0,
      model: sessionData.model!,
      status: sessionData.status as 'active' | 'completed' | 'failed',
      activities
    }
    
  } catch (error) {
    console.error(`[Sessions] Error parsing ${filePath}:`, error)
    return null
  }
}

/**
 * Parse activity from log message
 */
function parseActivityFromMessage(entry: SessionEntry): SessionActivity | null {
  const message = entry.message.toLowerCase()
  
  // Task started
  if (message.includes('started task') || message.includes('beginning work on')) {
    return {
      type: 'task_started',
      timestamp: entry.timestamp,
      message: entry.message,
      metadata: { agent: entry.agent, task: entry.task }
    }
  }
  
  // Task completed
  if (message.includes('completed task') || message.includes('finished') || message.includes('done')) {
    return {
      type: 'task_completed',
      timestamp: entry.timestamp,
      message: entry.message,
      metadata: { agent: entry.agent, task: entry.task, tokens: entry.tokens }
    }
  }
  
  // Sub-agent spawned
  if (message.includes('spawned') || message.includes('subagent') || message.includes('worker')) {
    return {
      type: 'subagent_spawned',
      timestamp: entry.timestamp,
      message: entry.message,
      metadata: { agent: entry.agent }
    }
  }
  
  // Error
  if (entry.level === 'error' || message.includes('error') || message.includes('failed')) {
    return {
      type: 'error',
      timestamp: entry.timestamp,
      message: entry.message,
      metadata: { level: entry.level }
    }
  }
  
  return null
}

/**
 * Get the last scan time
 */
function getLastScanTime(): number {
  try {
    if (fs.existsSync(LAST_SCAN_FILE)) {
      return parseInt(fs.readFileSync(LAST_SCAN_FILE, 'utf-8')) || 0
    }
  } catch (e) {
    console.error('Error reading last scan time:', e)
  }
  return 0
}

/**
 * Save the last scan time
 */
function saveLastScanTime(timestamp: number): void {
  try {
    fs.writeFileSync(LAST_SCAN_FILE, timestamp.toString())
  } catch (e) {
    console.error('Error saving last scan time:', e)
  }
}

/**
 * Record session to database
 */
function recordSession(session: ParsedSession): void {
  // Check if session exists
  const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(session.sessionId)
  
  if (existing) {
    // Update existing
    db.prepare(`
      UPDATE sessions 
      SET tokens_used = ?,
          status = ?,
          completed_at = ?,
          model = ?
      WHERE id = ?
    `).run(
      session.tokensUsed,
      session.status,
      session.completedAt,
      session.model,
      session.sessionId
    )
  } else {
    // Insert new
    db.prepare(`
      INSERT INTO sessions (id, agent_id, project_id, task_id, status, started_at, completed_at, tokens_used, model)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.sessionId,
      session.agentId,
      session.projectId,
      session.taskId,
      session.status,
      session.startedAt,
      session.completedAt,
      session.tokensUsed,
      session.model
    )
  }
  
  // Record activities
  for (const activity of session.activities) {
    const existingActivity = db.prepare(`
      SELECT id FROM activity 
      WHERE agent_id = ? AND timestamp = ? AND description = ?
    `).get(session.agentId, activity.timestamp, activity.message)
    
    if (!existingActivity) {
      let actionType = 'agent_action'
      if (activity.type === 'task_completed') actionType = 'task_updated'
      if (activity.type === 'error') actionType = 'status_changed'
      
      db.prepare(`
        INSERT INTO activity (id, action_type, description, project_id, task_id, agent_id, metadata, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        actionType,
        activity.message,
        session.projectId,
        session.taskId,
        session.agentId,
        JSON.stringify(activity.metadata),
        activity.timestamp
      )
    }
    
    // Update task status if completed
    if (activity.type === 'task_completed' && session.taskId) {
      db.prepare(`
        UPDATE tasks 
        SET status = 'done', completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(session.taskId)
    }
  }
  
  // Update agent stats
  if (session.status === 'completed') {
    db.prepare(`
      UPDATE agents 
      SET stats_tasks_completed = stats_tasks_completed + 1,
          stats_current_streak = stats_current_streak + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(session.agentId)
  }
  
  console.log(`[Sessions] Recorded session ${session.sessionId}: ${session.status}, ${session.tokensUsed} tokens`)
}

/**
 * Scan for session files
 */
function scanSessions(): string[] {
  if (!fs.existsSync(SESSIONS_DIR)) {
    console.log(`[Sessions] Directory not found: ${SESSIONS_DIR}`)
    return []
  }
  
  const files: string[] = []
  const entries = fs.readdirSync(SESSIONS_DIR)
  
  for (const entry of entries) {
    if (entry.endsWith('.jsonl')) {
      files.push(path.join(SESSIONS_DIR, entry))
    }
  }
  
  return files
}

/**
 * Main collection function
 */
async function collect(): Promise<void> {
  console.log('[Sessions] Starting collection...')
  
  const sessionFiles = scanSessions()
  console.log(`[Sessions] Found ${sessionFiles.length} session files`)
  
  let processed = 0
  
  for (const filePath of sessionFiles) {
    const session = parseSessionFile(filePath)
    if (session) {
      recordSession(session)
      processed++
    }
  }
  
  saveLastScanTime(Date.now())
  
  console.log(`[Sessions] Processed ${processed} sessions`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  collect().catch(console.error)
}

export { collect as collectSessionData }
