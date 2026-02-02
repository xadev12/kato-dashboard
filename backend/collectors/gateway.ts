/**
 * Gateway Collector
 * Hooks into OpenClaw gateway logs to capture request data
 * Tracks tokens, models, agents, and costs in real-time
 */

import { db } from '../db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to OpenClaw logs (adjust based on actual location)
const OPENCLAW_HOME = process.env.OPENCLAW_HOME || '/Users/devl/clawd'
const GATEWAY_LOG_PATH = process.env.GATEWAY_LOG_PATH || path.join(OPENCLAW_HOME, 'logs', 'gateway.log')
const DATA_DIR = path.join(OPENCLAW_HOME, 'kato-dashboard', 'backend', 'data')
const LAST_READ_POSITION_FILE = path.join(DATA_DIR, '.gateway-last-position')

interface GatewayEntry {
  timestamp: string
  agent_id: string
  model: string
  tokens_used?: number
  input_tokens?: number
  output_tokens?: number
  cache_read_tokens?: number
  cache_write_tokens?: number
  cost?: number
  session_id?: string
  project_id?: string
  task_id?: string
  status: 'success' | 'error'
  error_message?: string
}

/**
 * Parse gateway log lines for token usage data
 */
function parseGatewayLog(line: string): GatewayEntry | null {
  try {
    // Try JSON format first
    const json = JSON.parse(line)
    if (json.type === 'request' || json.type === 'completion') {
      return {
        timestamp: json.timestamp || new Date().toISOString(),
        agent_id: json.agent_id || json.agent || 'unknown',
        model: json.model || 'unknown',
        tokens_used: json.tokens_used || json.total_tokens,
        input_tokens: json.input_tokens,
        output_tokens: json.output_tokens,
        cache_read_tokens: json.cache_read_tokens,
        cache_write_tokens: json.cache_write_tokens,
        cost: json.cost,
        session_id: json.session_id,
        project_id: json.project_id,
        task_id: json.task_id,
        status: json.error ? 'error' : 'success',
        error_message: json.error
      }
    }
  } catch {
    // Try parsing structured log format
    // Example: [2024-01-15T10:30:00Z] AGENT:main MODEL:claude-sonnet-4 TOKENS:15000
    const tokenMatch = line.match(/TOKENS:(\d+)/)
    const agentMatch = line.match(/AGENT:(\w+)/)
    const modelMatch = line.match(/MODEL:([\w-]+)/)
    const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\]/)
    
    if (tokenMatch && agentMatch) {
      return {
        timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
        agent_id: agentMatch[1],
        model: modelMatch ? modelMatch[1] : 'unknown',
        tokens_used: parseInt(tokenMatch[1]),
        status: 'success'
      }
    }
  }
  
  return null
}

/**
 * Get the last read position from file
 */
function getLastPosition(): number {
  try {
    if (fs.existsSync(LAST_READ_POSITION_FILE)) {
      return parseInt(fs.readFileSync(LAST_READ_POSITION_FILE, 'utf-8')) || 0
    }
  } catch (e) {
    console.error('Error reading last position:', e)
  }
  return 0
}

/**
 * Save the last read position
 */
function saveLastPosition(position: number): void {
  try {
    fs.writeFileSync(LAST_READ_POSITION_FILE, position.toString())
  } catch (e) {
    console.error('Error saving last position:', e)
  }
}

/**
 * Record token usage to database
 */
function recordTokenUsage(entry: GatewayEntry): void {
  const date = entry.timestamp.split('T')[0]
  
  // Check for existing record
  const existing = db.prepare(`
    SELECT id FROM tokens 
    WHERE date = ? AND agent_id = ? AND model = ?
  `).get(date, entry.agent_id, entry.model)
  
  if (existing) {
    // Update existing
    db.prepare(`
      UPDATE tokens 
      SET tokens_used = tokens_used + ?,
          input_tokens = input_tokens + ?,
          output_tokens = output_tokens + ?,
          cache_read_tokens = cache_read_tokens + ?,
          cache_write_tokens = cache_write_tokens + ?,
          cost = cost + ?,
          session_count = session_count + 1
      WHERE id = ?
    `).run(
      entry.tokens_used || 0,
      entry.input_tokens || 0,
      entry.output_tokens || 0,
      entry.cache_read_tokens || 0,
      entry.cache_write_tokens || 0,
      entry.cost || 0,
      existing.id
    )
  } else {
    // Insert new
    db.prepare(`
      INSERT INTO tokens (date, agent_id, model, tokens_used, input_tokens, output_tokens, 
                         cache_read_tokens, cache_write_tokens, cost, session_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      date,
      entry.agent_id,
      entry.model,
      entry.tokens_used || 0,
      entry.input_tokens || 0,
      entry.output_tokens || 0,
      entry.cache_read_tokens || 0,
      entry.cache_write_tokens || 0,
      entry.cost || 0
    )
  }
  
  // Update agent stats
  if (entry.tokens_used) {
    db.prepare(`
      UPDATE agents 
      SET stats_tasks_completed = stats_tasks_completed + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(entry.agent_id)
  }
  
  console.log(`[Gateway] Recorded ${entry.tokens_used || 0} tokens for ${entry.agent_id} using ${entry.model}`)
}

/**
 * Record session information
 */
function recordSession(entry: GatewayEntry): void {
  if (!entry.session_id) return
  
  const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(entry.session_id)
  
  if (existing) {
    // Update existing session
    db.prepare(`
      UPDATE sessions 
      SET tokens_used = tokens_used + ?,
          input_tokens = input_tokens + ?,
          output_tokens = output_tokens + ?,
          cost = cost + ?,
          status = ?
      WHERE id = ?
    `).run(
      entry.tokens_used || 0,
      entry.input_tokens || 0,
      entry.output_tokens || 0,
      entry.cost || 0,
      entry.status === 'error' ? 'failed' : 'active',
      entry.session_id
    )
  } else {
    // Create new session
    db.prepare(`
      INSERT INTO sessions (id, agent_id, project_id, task_id, status, tokens_used, input_tokens, output_tokens, model, cost, started_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.session_id,
      entry.agent_id,
      entry.project_id,
      entry.task_id,
      entry.status === 'error' ? 'failed' : 'active',
      entry.tokens_used || 0,
      entry.input_tokens || 0,
      entry.output_tokens || 0,
      entry.model,
      entry.cost || 0,
      entry.timestamp
    )
  }
}

/**
 * Process gateway log file
 */
function processGatewayLog(): number {
  if (!fs.existsSync(GATEWAY_LOG_PATH)) {
    console.log(`[Gateway] Log file not found: ${GATEWAY_LOG_PATH}`)
    return 0
  }
  
  const lastPosition = getLastPosition()
  const stats = fs.statSync(GATEWAY_LOG_PATH)
  
  if (stats.size <= lastPosition) {
    console.log('[Gateway] No new data to process')
    return 0
  }
  
  const file = fs.openSync(GATEWAY_LOG_PATH, 'r')
  const bufferSize = Math.min(stats.size - lastPosition, 1024 * 1024) // Max 1MB at a time
  const buffer = Buffer.alloc(bufferSize)
  
  fs.readSync(file, buffer, 0, bufferSize, lastPosition)
  fs.closeSync(file)
  
  const content = buffer.toString('utf-8')
  const lines = content.split('\n')
  
  let processed = 0
  
  for (const line of lines) {
    if (!line.trim()) continue
    
    const entry = parseGatewayLog(line)
    if (entry) {
      recordTokenUsage(entry)
      recordSession(entry)
      processed++
    }
  }
  
  saveLastPosition(lastPosition + bufferSize)
  
  return processed
}

/**
 * Alternative: Query gateway via CLI if available
 */
async function queryGatewayCLI(): Promise<GatewayEntry[]> {
  try {
    const { stdout } = await execAsync('openclaw gateway status --json 2>/dev/null || echo "[]"')
    const data = JSON.parse(stdout)
    
    if (Array.isArray(data)) {
      return data.map((d: any) => ({
        timestamp: d.timestamp || new Date().toISOString(),
        agent_id: d.agent || 'unknown',
        model: d.model || 'unknown',
        tokens_used: d.tokens,
        input_tokens: d.inputTokens,
        output_tokens: d.outputTokens,
        cost: d.cost,
        status: 'success'
      }))
    }
  } catch (e) {
    // CLI not available or failed
  }
  
  return []
}

/**
 * Main collection function
 */
async function collect(): Promise<void> {
  console.log('[Gateway] Starting collection...')
  
  // Try file-based collection first
  const processed = processGatewayLog()
  
  // Also try CLI query if available
  const cliEntries = await queryGatewayCLI()
  for (const entry of cliEntries) {
    recordTokenUsage(entry)
    recordSession(entry)
  }
  
  const total = processed + cliEntries.length
  console.log(`[Gateway] Processed ${total} entries`)
  
  // Log activity
  if (total > 0) {
    db.prepare(`
      INSERT INTO activity (id, action_type, description, metadata)
      VALUES (?, 'agent_action', ?, ?)
    `).run(
      crypto.randomUUID(),
      `Gateway collector processed ${total} requests`,
      JSON.stringify({ entriesProcessed: total })
    )
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  collect().catch(console.error)
}

export { collect as collectGatewayData }
