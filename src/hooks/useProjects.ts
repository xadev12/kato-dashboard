import { useState, useEffect, useCallback } from 'react'
import type { Project, DashboardMeta, QueenAgent, Workers, CompletedProject, DashboardAction, MemoryUpdate, TokenStats } from '../types'

// VITE_API_URL should be the base URL without /api suffix
const API_URL = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') 
      ? import.meta.env.VITE_API_URL 
      : `${import.meta.env.VITE_API_URL}/api`)
  : 'http://localhost:3001/api'
const POLLING_INTERVAL = 5000 // 5 seconds for more real-time feel

// Generic fetch helper with error handling and timeout
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error)
    return null
  }
}

// Fallback to JSON file when API is unavailable
async function fetchFallbackData(): Promise<any> {
  try {
    const response = await fetch('/dashboard-data.json?t=' + Date.now())
    if (!response.ok) throw new Error('Fallback fetch failed')
    return await response.json()
  } catch {
    return null
  }
}

// Hook for projects
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      const data = await fetchApi<{projects: Project[]}>('/projects')
      if (data?.projects) {
        setProjects(data.projects)
        setError(null)
      } else {
        const fallback = await fetchFallbackData()
        if (fallback?.projects) {
          setProjects(fallback.projects)
          setError(null)
        }
      }
    } catch (err) {
      const fallback = await fetchFallbackData()
      if (fallback?.projects) {
        setProjects(fallback.projects)
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
    const interval = setInterval(fetchProjects, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchProjects])

  return { projects, loading, error, refresh: fetchProjects }
}

// Hook for agents with real-time status
export const useAgents = () => {
  const [queens, setQueens] = useState<QueenAgent[]>([])
  const [workers, setWorkers] = useState<Workers>({ active: [], queue: [], recent: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      // Fetch from API first
      const agentsData = await fetchApi<{queens: QueenAgent[], workers: Workers}>('/agents')
      if (agentsData) {
        setQueens(agentsData.queens || [])
        setWorkers(agentsData.workers || { active: [], queue: [], recent: [] })
        setError(null)
      } else {
        // Fallback to JSON
        const fallback = await fetchFallbackData()
        if (fallback?.agents) {
          setQueens(fallback.agents.queens || [])
          setWorkers(fallback.agents.workers || { active: [], queue: [], recent: [] })
          setError(null)
        }
      }
    } catch (err) {
      const fallback = await fetchFallbackData()
      if (fallback?.agents) {
        setQueens(fallback.agents.queens || [])
        setWorkers(fallback.agents.workers || { active: [], queue: [], recent: [] })
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchAgents])

  return { queens, workers, loading, error, refresh: fetchAgents }
}

// Hook for dashboard meta/stats
export const useDashboardMeta = () => {
  const [meta, setMeta] = useState<DashboardMeta | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const fetchMeta = useCallback(async () => {
    try {
      const stats = await fetchApi<DashboardMeta>('/stats')
      if (stats) {
        setMeta(stats)
        setLastUpdated(new Date().toISOString())
      } else {
        const fallback = await fetchFallbackData()
        if (fallback?.meta) {
          setMeta(fallback.meta)
          setLastUpdated(fallback.lastUpdated || new Date().toISOString())
        }
      }
    } catch {
      const fallback = await fetchFallbackData()
      if (fallback?.meta) {
        setMeta(fallback.meta)
        setLastUpdated(fallback.lastUpdated || new Date().toISOString())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMeta()
    const interval = setInterval(fetchMeta, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchMeta])

  return { meta, lastUpdated, loading, refresh: fetchMeta }
}

// Hook for actions
export const useActions = () => {
  const [pending, setPending] = useState<DashboardAction[]>([])
  const [recent, setRecent] = useState<DashboardAction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActions = useCallback(async () => {
    try {
      const data = await fetchApi<{pending: DashboardAction[], recent: DashboardAction[]}>('/actions')
      if (data) {
        setPending(data.pending || [])
        setRecent(data.recent || [])
      } else {
        const fallback = await fetchFallbackData()
        if (fallback?.actions) {
          setPending(fallback.actions.pending || [])
          setRecent(fallback.actions.recent || [])
        }
      }
    } catch {
      const fallback = await fetchFallbackData()
      if (fallback?.actions) {
        setPending(fallback.actions.pending || [])
        setRecent(fallback.actions.recent || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActions()
    const interval = setInterval(fetchActions, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchActions])

  return { pending, recent, loading, refresh: fetchActions, count: pending.length }
}

// Hook for memory updates
export const useMemory = () => {
  const [updates, setUpdates] = useState<MemoryUpdate[]>([])
  const [stats, setStats] = useState({ selfReviewEntries: 0, dailyLogEntries: 0, lastUpdated: '' })
  const [loading, setLoading] = useState(true)

  const fetchMemory = useCallback(async () => {
    try {
      const data = await fetchApi<{recentUpdates: MemoryUpdate[], selfReviewEntries: number, dailyLogEntries: number, lastUpdated: string}>('/memory')
      if (data) {
        setUpdates(data.recentUpdates || [])
        setStats({
          selfReviewEntries: data.selfReviewEntries || 0,
          dailyLogEntries: data.dailyLogEntries || 0,
          lastUpdated: data.lastUpdated || ''
        })
      } else {
        const fallback = await fetchFallbackData()
        if (fallback?.memory) {
          setUpdates(fallback.memory.recentUpdates || [])
          setStats({
            selfReviewEntries: fallback.memory.selfReviewEntries || 0,
            dailyLogEntries: fallback.memory.dailyLogEntries || 0,
            lastUpdated: fallback.memory.lastUpdated || ''
          })
        }
      }
    } catch {
      const fallback = await fetchFallbackData()
      if (fallback?.memory) {
        setUpdates(fallback.memory.recentUpdates || [])
        setStats({
          selfReviewEntries: fallback.memory.selfReviewEntries || 0,
          dailyLogEntries: fallback.memory.dailyLogEntries || 0,
          lastUpdated: fallback.memory.lastUpdated || ''
        })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMemory()
    const interval = setInterval(fetchMemory, 30000) // Less frequent for memory
    return () => clearInterval(interval)
  }, [fetchMemory])

  return { updates, stats, loading, refresh: fetchMemory }
}

// Hook for token stats
export const useTokenStats = () => {
  const [stats, setStats] = useState<TokenStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/token-stats.json?t=' + Date.now())
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch token stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // 30 seconds for token stats
    return () => clearInterval(interval)
  }, [fetchStats])

  return { stats, loading, refresh: fetchStats }
}

// Hook for completed projects
export const useCompletedProjects = () => {
  const [projects, setProjects] = useState<CompletedProject[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    try {
      const data = await fetchApi<{ completedProjects: CompletedProject[] }>('/completed-projects')
      if (data?.completedProjects) {
        setProjects(data.completedProjects)
      } else {
        const fallback = await fetchFallbackData()
        if (fallback?.completedProjects) {
          setProjects(fallback.completedProjects)
        }
      }
    } catch {
      const fallback = await fetchFallbackData()
      if (fallback?.completedProjects) {
        setProjects(fallback.completedProjects)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
    const interval = setInterval(fetchProjects, 60000)
    return () => clearInterval(interval)
  }, [fetchProjects])

  return { projects, loading, refresh: fetchProjects }
}

// Legacy hooks for compatibility
export const useTasks = (_projectId?: string) => {
  const { projects } = useProjects()
  const tasks = projects.flatMap(p => 
    (p.tasks || []).map(t => ({ ...t, project_id: p.id }))
  )
  return { tasks, loading: false, error: null }
}

export const useSubAgents = () => {
  const { queens, loading, error } = useAgents()
  const subAgents = queens.flatMap(q => q.subAgents || [])
  return { subAgents, loading, error }
}

// Activity hook for ActivityFeed component
export const useActivity = () => {
  const [activities, setActivities] = useState<Array<{
    id: string
    type: string
    title: string
    description: string
    timestamp: string
    agent?: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await fetchFallbackData()
        if (data?.actions?.recent) {
          setActivities(data.actions.recent.map((a: any, i: number) => ({
            id: a.id || `act-${i}`,
            type: a.type || 'info',
            title: a.title || 'Activity',
            description: a.description || '',
            timestamp: a.createdAt || new Date().toISOString(),
            agent: a.from || 'System'
          })))
        }
      } catch (err) {
        setError('Failed to load activity')
      } finally {
        setLoading(false)
      }
    }
    fetchActivity()
    const interval = setInterval(fetchActivity, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  return { activities, loading, error }
}
