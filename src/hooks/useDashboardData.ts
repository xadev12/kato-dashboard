import { useState, useEffect, useCallback, useMemo } from 'react'

// Types for v3 dashboard data
export interface SprintInfo {
  name: string
  day: number
  totalDays: number
  startDate: string
  endDate: string
  targets: Array<{ metric: string; target: string; deadline: string }>
  philosophy: string
}

export interface ActiveProject {
  id: string
  name: string
  status: 'in_progress' | 'blocked' | 'not_started' | 'done'
  progress: number
  currentStage: string
  priority: string
  blocker: string | null
  assignedQueen: string | null
  updatedAt: string
}

export interface QueueItem {
  id: string
  feature: string
  project: string
  priority: string
  complexity: string | null
}

export interface AgentStatus {
  id: string
  name: string
  status: 'idle' | 'active' | 'blocked'
  currentTask: string | null
  emoji: string | null
}

export interface SystemHealth {
  tokens: {
    today: number
    cost: number
    budget: number
    budgetUsedPercent: number
    overBudget: boolean
  }
  agents: {
    total: number
    active: number
    idle: number
    list: AgentStatus[]
  }
}

// Opportunity scan types
export interface Opportunity {
  id: string
  type: 'blocker' | 'ready' | 'opportunity' | 'suggestion' | 'deadline' | 'idea' | 'system'
  category?: 'project' | 'system' | 'external' | 'roadmap'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  project?: string
  source?: string
  action: string
  discoveredAt: string
  expiresAt: string
  status?: 'active' | 'acted' | 'dismissed' | 'expired'
  actedAt?: string
  dismissedAt?: string
}

export interface OpportunityScan {
  lastScan: string
  items: Opportunity[]
  scanCount: number
  metrics?: {
    conversionRate: number
    totalSeen: number
    totalConverted: number
    totalIgnored: number
    currentActive: number
  }
}

// Kato queue types
export interface Subtask {
  id: string
  title: string
  status: 'done' | 'in_progress' | 'pending'
}

export interface KatoTask {
  id: string
  type: 'current' | 'planned' | 'upcoming' | 'system'
  title: string
  project?: string
  projectId?: string
  status: string
  assignedAgent?: string
  startedAt?: string
  estimatedComplete?: string
  plannedFor?: string
  reason?: string
  hasSubtasks?: boolean
  subtaskCount?: number
  subtaskProgress?: number | null
  subtasks?: Subtask[]
}

export interface KatoQueue {
  lastUpdated: string
  tasks: KatoTask[]
  mode: 'autonomous' | 'manual'
}

export interface DashboardV3Data {
  schemaVersion: string
  lastUpdated: string
  generatedAt?: string
  sprint: SprintInfo
  activeWork: {
    projects: ActiveProject[]
    blockedCount: number
  }
  queue: QueueItem[]
  systemHealth: SystemHealth
  opportunities?: OpportunityScan
  katoQueue?: KatoQueue
  // Legacy data for compatibility
  projects?: any[]
  agents?: any
  meta?: any
}

// System task types for the SystemPanel
export interface SystemTaskInfo {
  id: string
  title: string
  status: string
  lastRunAt?: string
  lastStatus?: 'ok' | 'warning' | 'error'
  nextRunAt?: string
  interval?: string
  detail?: string
}

const POLLING_INTERVAL = 5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Estimate cost from token count when actual cost isn't available
// Blended rate: ~$3/1M tokens (mix of input/output across models)
function estimateCostFromTokens(tokensUsed: number): number {
  return (tokensUsed / 1_000_000) * 3
}

// Derive systemHealth from static dashboard-data.json fields
function deriveSystemHealth(data: any): SystemHealth {
  const tokenStats = data?.meta?.tokenStats?.today
  const agents = data?.agents?.queens || []
  const dailyBudget = 20

  const tokensUsed = tokenStats?.tokensUsed || 0
  // Use actual cost if available, otherwise estimate from token count
  const cost = tokenStats?.cost > 0 ? tokenStats.cost : estimateCostFromTokens(tokensUsed)
  const budgetUsedPercent = dailyBudget > 0 ? Math.round((cost / dailyBudget) * 100) : 0

  const activeAgents = agents.filter((a: any) => a.status === 'active')

  return {
    tokens: {
      today: tokensUsed,
      cost,
      budget: dailyBudget,
      budgetUsedPercent,
      overBudget: budgetUsedPercent > 100
    },
    agents: {
      total: agents.length,
      active: activeAgents.length,
      idle: agents.length - activeAgents.length,
      list: agents.map((a: any) => ({
        id: a.id,
        name: a.name,
        status: a.status || 'idle',
        currentTask: a.currentTask || null,
        emoji: a.emoji || null
      }))
    }
  }
}

async function fetchDashboardData(): Promise<DashboardV3Data | null> {
  // Try live API first
  try {
    const response = await fetch(`${API_BASE_URL}/api/status?t=${Date.now()}`, {
      headers: { 'Content-Type': 'application/json' }
    })
    if (response.ok) {
      const data = await response.json()
      // Normalize: ensure lastUpdated exists
      if (data.generatedAt && !data.lastUpdated) {
        data.lastUpdated = data.generatedAt
      }
      return data
    }
  } catch (err) {
    console.warn('[Dashboard] API unavailable, falling back to JSON:', err)
  }
  
  // Fallback to static JSON
  try {
    const response = await fetch('/dashboard-data.json?t=' + Date.now())
    if (!response.ok) throw new Error('Fetch failed')
    const data = await response.json()
    // Normalize: ensure lastUpdated exists
    if (data.generatedAt && !data.lastUpdated) {
      data.lastUpdated = data.generatedAt
    }
    // Derive systemHealth from static JSON fields if missing
    if (!data.systemHealth) {
      data.systemHealth = deriveSystemHealth(data)
    }
    return data
  } catch {
    return null
  }
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardV3Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isApiConnected, setIsApiConnected] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const result = await fetchDashboardData()
      if (result) {
        setData(result)
        setError(null)
        // Check if we got data from API (has schemaVersion) vs JSON fallback
        setIsApiConnected(!!result.schemaVersion && !!result.generatedAt)
      }
    } catch (err) {
      setError('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [refresh])

  // Computed values
  const activeProjects = useMemo(() =>
    data?.activeWork?.projects?.filter(p => p.status === 'in_progress') || [],
    [data]
  )

  const blockedProjects = useMemo(() =>
    data?.activeWork?.projects?.filter(p => p.status === 'blocked') || [],
    [data]
  )

  const queue = useMemo(() =>
    data?.queue?.filter(q => q.priority === 'P1').slice(0, 5) || [],
    [data]
  )

  const lastUpdatedAgo = useMemo(() => {
    if (!data?.lastUpdated) return 'Unknown'
    const diff = Date.now() - new Date(data.lastUpdated).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }, [data?.lastUpdated])

  // Extract system tasks from katoQueue and enrich with metadata
  const systemTasks = useMemo((): SystemTaskInfo[] => {
    const katoSystemTasks = data?.katoQueue?.tasks?.filter(t => t.type === 'system') || []
    // Also check for systemTasks array at top level (if backend provides it)
    const topLevelTasks: SystemTaskInfo[] = (data as any)?.systemTasks || []

    const fromKato: SystemTaskInfo[] = katoSystemTasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      lastRunAt: t.startedAt,
      lastStatus: t.status === 'queued' ? undefined : t.status === 'error' ? 'error' as const : 'ok' as const,
      nextRunAt: t.plannedFor,
      interval: t.reason === 'Regular maintenance' ? '30m' : undefined,
      detail: t.reason
    }))

    // Merge, preferring top-level tasks (more detailed) over kato-derived ones
    const merged = [...topLevelTasks]
    for (const task of fromKato) {
      if (!merged.find(t => t.id === task.id)) {
        merged.push(task)
      }
    }
    return merged
  }, [data])

  // Token stats for SystemPanel
  const tokenStatsForPanel = useMemo(() => {
    const meta = (data as any)?.meta?.tokenStats?.today
    const health = data?.systemHealth?.tokens
    return {
      todayCost: health?.cost || 0,
      tokensUsed: health?.today || meta?.tokensUsed || 0,
      requests: meta?.requests || 0,
      inputTokens: meta?.inputTokens || 0,
      outputTokens: meta?.outputTokens || 0
    }
  }, [data])

  return {
    data,
    loading,
    refreshing,
    error,
    isApiConnected,
    refresh,
    // Computed
    sprint: data?.sprint || null,
    activeProjects,
    blockedProjects,
    queue,
    systemHealth: data?.systemHealth || null,
    opportunities: data?.opportunities,
    katoQueue: data?.katoQueue,
    systemTasks,
    tokenStatsForPanel,
    lastUpdated: data?.lastUpdated || '',
    lastUpdatedAgo,
    activeCount: activeProjects.length,
    blockedCount: data?.activeWork?.blockedCount || 0
  }
}

// Hook for token stats (simplified for v3)
export function useTokenBudget() {
  const { data } = useDashboardData()

  return useMemo(() => {
    const tokens = data?.systemHealth?.tokens
    if (!tokens) {
      return {
        todayCost: 0,
        budget: 20,
        usedPercent: 0,
        remaining: 20,
        overBudget: false
      }
    }
    return {
      todayCost: tokens.cost,
      budget: tokens.budget,
      usedPercent: tokens.budgetUsedPercent,
      remaining: tokens.budget - tokens.cost,
      overBudget: tokens.overBudget
    }
  }, [data])
}

// Hook for active agents
export function useActiveAgents() {
  const { data } = useDashboardData()

  return useMemo(() => {
    const agents = data?.systemHealth?.agents
    if (!agents) {
      return {
        total: 0,
        active: 0,
        idle: 0,
        list: []
      }
    }
    return agents
  }, [data])
}
