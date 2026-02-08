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

export interface DashboardV3Data {
  schemaVersion: string
  lastUpdated: string
  sprint: SprintInfo
  activeWork: {
    projects: ActiveProject[]
    blockedCount: number
  }
  queue: QueueItem[]
  systemHealth: SystemHealth
  // Legacy data for compatibility
  projects?: any[]
  agents?: any
  meta?: any
}

const POLLING_INTERVAL = 5000

async function fetchDashboardData(): Promise<DashboardV3Data | null> {
  try {
    const response = await fetch('/dashboard-data.json?t=' + Date.now())
    if (!response.ok) throw new Error('Fetch failed')
    return await response.json()
  } catch {
    return null
  }
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardV3Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const result = await fetchDashboardData()
      if (result) {
        setData(result)
        setError(null)
      }
    } catch (err) {
      setError('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
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

  return {
    data,
    loading,
    error,
    refresh,
    // Computed
    sprint: data?.sprint || null,
    activeProjects,
    blockedProjects,
    queue,
    systemHealth: data?.systemHealth || null,
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
