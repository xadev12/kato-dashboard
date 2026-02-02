import { useState, useEffect, useCallback } from 'react'
import type { Project, Task, DashboardMeta, QueenAgent, Workers, ActivityLog } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const POLLING_INTERVAL = 10000 // 10 seconds

// Generic fetch helper with error handling
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error)
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
        // Transform database fields to frontend format
        const transformed = data.projects.map((p: any) => ({
          ...p,
          assignedQueen: p.assignedQueen || p.assigned_queen,
          timeInvested: p.timeInvested || p.time_invested,
          repoUrl: p.repoUrl || p.repo_url,
          tasks: (p.tasks || []).map((t: any) => ({
            ...t,
            assignedAgent: t.assignedAgent || t.assigned_agent,
            blockerReason: t.blockerReason || t.blocker_reason,
            actionRequired: t.actionRequired || t.action_required,
            estimatedTokenCost: t.estimatedTokenCost || t.estimated_token_cost,
            blockedOnQueen: t.blockedOnQueen || t.blocked_on_queen
          }))
        }))
        setProjects(transformed)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
    const interval = setInterval(fetchProjects, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchProjects])

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const result = await fetchApi<{ success: boolean }>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    if (result?.success) {
      await fetchProjects()
    }
    return result?.success || false
  }

  return { projects, loading, error, refresh: fetchProjects, updateProject }
}

// Hook for tasks
export const useTasks = (projectId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      if (projectId) {
        // Fetch tasks for specific project
        const project = await fetchApi<Project & { tasks: any[] }>(`/projects/${projectId}`)
        if (project?.tasks) {
          setTasks(project.tasks.map((t: any) => ({
            ...t,
            project_id: projectId,
            assignedAgent: t.assignedAgent || t.assigned_agent,
            blockerReason: t.blockerReason || t.blocker_reason,
            actionRequired: t.actionRequired || t.action_required
          })))
        }
      } else {
        // Fetch all tasks across projects
        const projects = await fetchApi<Project[]>('/projects')
        if (projects) {
          const allTasks = projects.flatMap((p: any) => 
            (p.tasks || []).map((t: any) => ({
              ...t,
              project_id: p.id,
              assignedAgent: t.assignedAgent || t.assigned_agent
            }))
          )
          setTasks(allTasks)
        }
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchTasks])

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const result = await fetchApi<{ success: boolean }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    if (result?.success) {
      await fetchTasks()
    }
    return result?.success || false
  }

  const createTask = async (task: Partial<Task>) => {
    const result = await fetchApi<{ success: boolean }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    })
    if (result?.success) {
      await fetchTasks()
    }
    return result?.success || false
  }

  return { tasks, loading, error, refresh: fetchTasks, updateTask, createTask }
}

// Hook for agents
export const useAgents = () => {
  const [queens, setQueens] = useState<QueenAgent[]>([])
  const [workers, setWorkers] = useState<Workers>({ active: [], queue: [], recent: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      // Fetch queens
      const agentsData = await fetchApi<any[]>('/agents')
      if (agentsData) {
        const transformed = agentsData.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          status: a.status,
          currentTask: a.current_task || a.currentTask,
          emoji: a.emoji,
          skills: Array.isArray(a.skills) ? a.skills : JSON.parse(a.skills || '[]'),
          description: a.description,
          color: a.color,
          stats: a.stats || {
            tasksCompleted: a.stats_tasks_completed || 0,
            successRate: a.stats_success_rate || 0,
            currentStreak: a.stats_current_streak || 0,
            weeklyVelocity: a.stats_weekly_velocity || 0
          },
          memoryStats: a.memoryStats || {
            totalEntries: a.memory_total_entries || 0,
            lastUpdated: a.memory_last_updated,
            activeContexts: a.memory_active_contexts || 0
          },
          subAgents: (a.subAgents || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            emoji: s.emoji,
            description: s.description,
            specialty: s.specialty,
            status: s.status,
            spawnCost: s.spawn_cost || s.spawnCost,
            spawnedCount: s.spawned_count || s.spawnedCount
          }))
        }))
        setQueens(transformed)
      }

      // Fetch workers
      const workersData = await fetchApi<Workers>('/workers')
      if (workersData) {
        setWorkers(workersData)
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 5000) // More frequent for agents
    return () => clearInterval(interval)
  }, [fetchAgents])

  return { queens, workers, loading, error, refresh: fetchAgents }
}

// Hook for dashboard meta/stats
export const useDashboardMeta = () => {
  const [meta, setMeta] = useState<DashboardMeta | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeta = useCallback(async () => {
    try {
      const stats = await fetchApi<DashboardMeta>('/stats')
      if (stats) {
        setMeta(stats)
        setLastUpdated(new Date().toISOString())
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMeta()
    const interval = setInterval(fetchMeta, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchMeta])

  return { meta, lastUpdated, loading, error, refresh: fetchMeta }
}

// Hook for activity feed
export const useActivity = (limit = 50) => {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = useCallback(async () => {
    try {
      const data = await fetchApi<ActivityLog[]>(`/activity?limit=${limit}`)
      if (data) {
        setActivities(data.map(a => ({
          ...a,
          metadata: typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata
        })))
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchActivity()
    const interval = setInterval(fetchActivity, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchActivity])

  return { activities, loading, error, refresh: fetchActivity }
}

// Hook for token stats
export const useTokenStats = (period: 'today' | 'week' | 'month' = 'week') => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const data = await fetchApi(`/tokens?period=${period}`)
      if (data) {
        setStats(data)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token stats')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchStats])

  return { stats, loading, error, refresh: fetchStats }
}

// Hook for agent memory
export const useAgentMemory = (agentId: string) => {
  const [memory, setMemory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMemory = useCallback(async () => {
    if (!agentId) return
    try {
      const data = await fetchApi<any[]>(`/memory/${agentId}`)
      if (data) {
        setMemory(data.map(m => ({
          ...m,
          tags: Array.isArray(m.tags) ? m.tags : JSON.parse(m.tags || '[]')
        })))
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch memory')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    fetchMemory()
    const interval = setInterval(fetchMemory, 30000) // Less frequent for memory
    return () => clearInterval(interval)
  }, [fetchMemory])

  return { memory, loading, error, refresh: fetchMemory }
}

// Hook for WebSocket real-time updates
export const useRealtimeUpdates = (onUpdate: (data: any) => void) => {
  useEffect(() => {
    const wsUrl = API_URL.replace(/^http/, 'ws').replace('/api', '/ws')
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[WebSocket] Connected to realtime updates')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type !== 'connected') {
          onUpdate(data)
        }
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e)
      }
    }

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error)
    }

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected')
    }

    return () => {
      ws.close()
    }
  }, [onUpdate])
}

// Legacy hooks for compatibility
export const useSubAgents = () => {
  const { queens, loading, error } = useAgents()
  const subAgents = queens.flatMap(q => q.subAgents || [])
  return { subAgents, loading, error }
}
