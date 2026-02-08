/**
 * Token Usage Source Reader
 *
 * Aggregates token usage from session JSONL files
 * Path: ~/.openclaw/agents/{agentId}/sessions/{sessionId}.jsonl
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'

const AGENTS_DIR = '/Users/devl/.openclaw/agents'

export interface TokenUsage {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  totalTokens: number
  cost: {
    input: number
    output: number
    cacheRead: number
    cacheWrite: number
    total: number
  }
}

export interface SessionMessage {
  type: string
  id: string
  timestamp: string
  message?: {
    role: string
    usage?: TokenUsage
    model?: string
    provider?: string
  }
}

export interface AgentTokenStats {
  agentId: string
  agentName: string
  tokensUsed: number
  inputTokens: number
  outputTokens: number
  cost: number
  requests: number
}

export interface ModelTokenStats {
  modelId: string
  modelName: string
  tokensUsed: number
  inputTokens: number
  outputTokens: number
  cost: number
  requests: number
}

export interface TokenStats {
  period: string
  generatedAt: string
  totalTokensUsed: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  totalRequests: number
  avgTokensPerRequest: number
  today: {
    tokensUsed: number
    inputTokens: number
    outputTokens: number
    cost: number
    requests: number
  }
  agentBreakdown: AgentTokenStats[]
  modelBreakdown: ModelTokenStats[]
  dailyStats: {
    date: string
    tokensUsed: number
    cost: number
    requests: number
  }[]
}

/**
 * Parse a single JSONL session file
 */
async function parseSessionFile(filePath: string): Promise<{ usage: TokenUsage; model: string; provider: string; timestamp: string }[]> {
  const results: { usage: TokenUsage; model: string; provider: string; timestamp: string }[] = []

  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line) as SessionMessage

      if (entry.type === 'message' && entry.message?.usage) {
        results.push({
          usage: entry.message.usage,
          model: entry.message.model || 'unknown',
          provider: entry.message.provider || 'unknown',
          timestamp: entry.timestamp
        })
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  return results
}

/**
 * Get all session files for an agent
 */
function getSessionFiles(agentDir: string, since?: Date): string[] {
  const sessionsDir = path.join(agentDir, 'sessions')

  if (!fs.existsSync(sessionsDir)) {
    return []
  }

  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({
      path: path.join(sessionsDir, f),
      mtime: fs.statSync(path.join(sessionsDir, f)).mtime
    }))
    .filter(f => !since || f.mtime >= since)
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

  return files.map(f => f.path)
}

/**
 * Get token stats for a specific time period
 */
export async function getTokenStats(period: 'today' | 'week' | 'month' = 'today'): Promise<TokenStats> {
  const now = new Date()
  let since: Date

  switch (period) {
    case 'today':
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
  }

  const agentStats: Map<string, AgentTokenStats> = new Map()
  const modelStats: Map<string, ModelTokenStats> = new Map()
  const dailyStats: Map<string, { tokensUsed: number; cost: number; requests: number }> = new Map()

  let totalTokens = 0
  let totalInput = 0
  let totalOutput = 0
  let totalCost = 0
  let totalRequests = 0

  // Get all agent directories
  if (!fs.existsSync(AGENTS_DIR)) {
    console.warn(`[Sources] Agents directory not found: ${AGENTS_DIR}`)
    return createEmptyStats(period)
  }

  const agentDirs = fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))

  for (const agentDir of agentDirs) {
    const agentId = agentDir.name
    const agentPath = path.join(AGENTS_DIR, agentId)
    const sessionFiles = getSessionFiles(agentPath, since)

    // Limit to most recent 50 files per agent to avoid memory issues
    const filesToProcess = sessionFiles.slice(0, 50)

    for (const sessionFile of filesToProcess) {
      try {
        const usages = await parseSessionFile(sessionFile)

        for (const { usage, model, provider, timestamp } of usages) {
          const msgDate = new Date(timestamp)
          if (msgDate < since) continue

          const dateKey = msgDate.toISOString().split('T')[0]

          // Update totals
          totalTokens += usage.totalTokens
          totalInput += usage.input
          totalOutput += usage.output
          totalCost += usage.cost.total
          totalRequests++

          // Update agent stats
          const agentStat = agentStats.get(agentId) || {
            agentId,
            agentName: agentId,
            tokensUsed: 0,
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
            requests: 0
          }
          agentStat.tokensUsed += usage.totalTokens
          agentStat.inputTokens += usage.input
          agentStat.outputTokens += usage.output
          agentStat.cost += usage.cost.total
          agentStat.requests++
          agentStats.set(agentId, agentStat)

          // Update model stats
          const modelKey = `${provider}/${model}`
          const modelStat = modelStats.get(modelKey) || {
            modelId: modelKey,
            modelName: model,
            tokensUsed: 0,
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
            requests: 0
          }
          modelStat.tokensUsed += usage.totalTokens
          modelStat.inputTokens += usage.input
          modelStat.outputTokens += usage.output
          modelStat.cost += usage.cost.total
          modelStat.requests++
          modelStats.set(modelKey, modelStat)

          // Update daily stats
          const daily = dailyStats.get(dateKey) || { tokensUsed: 0, cost: 0, requests: 0 }
          daily.tokensUsed += usage.totalTokens
          daily.cost += usage.cost.total
          daily.requests++
          dailyStats.set(dateKey, daily)
        }
      } catch (err) {
        console.error(`[Sources] Failed to parse session file ${sessionFile}:`, err)
      }
    }
  }

  // Get today's stats
  const todayKey = now.toISOString().split('T')[0]
  const todayStats = dailyStats.get(todayKey) || { tokensUsed: 0, cost: 0, requests: 0 }

  return {
    period,
    generatedAt: now.toISOString(),
    totalTokensUsed: totalTokens,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalCost,
    totalRequests,
    avgTokensPerRequest: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
    today: {
      tokensUsed: todayStats.tokensUsed,
      inputTokens: 0, // Would need to track separately
      outputTokens: 0,
      cost: todayStats.cost,
      requests: todayStats.requests
    },
    agentBreakdown: Array.from(agentStats.values()),
    modelBreakdown: Array.from(modelStats.values()),
    dailyStats: Array.from(dailyStats.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }
}

/**
 * Create empty stats response
 */
function createEmptyStats(period: string): TokenStats {
  return {
    period,
    generatedAt: new Date().toISOString(),
    totalTokensUsed: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    totalRequests: 0,
    avgTokensPerRequest: 0,
    today: {
      tokensUsed: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      requests: 0
    },
    agentBreakdown: [],
    modelBreakdown: [],
    dailyStats: []
  }
}

/**
 * Get quick token stats (cached, lighter weight)
 * For real-time display, we cache and only update every 5 minutes
 */
let cachedStats: TokenStats | null = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getQuickTokenStats(): Promise<TokenStats> {
  const now = Date.now()

  if (cachedStats && (now - cacheTime) < CACHE_TTL) {
    return cachedStats
  }

  cachedStats = await getTokenStats('today')
  cacheTime = now
  return cachedStats
}

/**
 * Clear token stats cache
 */
export function clearTokenCache(): void {
  cachedStats = null
  cacheTime = 0
}
