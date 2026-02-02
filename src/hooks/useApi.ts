import { useState, useEffect, useCallback } from 'react'
import type { Project, QueenAgent, Task, DashboardMeta } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

interface ApiResponse<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

// Generic fetch hook
export function useApi<T>(endpoint: string, options?: RequestInit, pollInterval = 10000): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error(`Error fetching ${endpoint}:`, err)
    } finally {
      setLoading(false)
    }
  }, [endpoint, options])

  useEffect(() => {
    fetchData()

    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, pollInterval])

  return { data, loading, error, refetch: fetchData }
}

// Projects hook
export function useProjects(pollInterval = 10000) {
  const { data, loading, error, refetch } = useApi<{ projects: Project[] }>('/projects', {}, pollInterval)
  return { projects: data?.projects || [], loading, error, refetch }
}

// Single project hook
export function useProject(id: string) {
  const { data, loading, error, refetch } = useApi<Project>(`/projects/${id}`, {}, 10000)
  return { project: data, loading, error, refetch }
}

// Tasks hook - extracts all tasks from projects
export function useTasks(pollInterval = 10000) {
  const { projects, loading, error } = useProjects(pollInterval)
  
  const tasks = projects.flatMap((project: Project) => 
    project.tasks?.map((task: Task) => ({
      ...task,
      project_id: project.id,
      project_name: project.name
    })) || []
  )

  return { tasks, loading, error }
}

// Agents hook
export function useAgents(pollInterval = 5000) {
  const { data, loading, error, refetch } = useApi<{ agents: QueenAgent[] }>('/agents', {}, pollInterval)
  return { agents: data?.agents || [], loading, error, refetch }
}

// Workers hook
export function useWorkers(pollInterval = 5000) {
  const { data, loading, error } = useApi<{ active: any[]; queue: any[]; recent: any[] }>('/workers', {}, pollInterval)
  return { 
    workers: {
      active: data?.active || [],
      queue: data?.queue || [],
      recent: data?.recent || []
    }, 
    loading, 
    error 
  }
}

// Token stats hook
export function useTokenStats(period: 'today' | 'week' | 'month' = 'week') {
  const { data, loading, error } = useApi<any>(`/tokens?period=${period}`, {}, 30000)
  return { stats: data, loading, error }
}

// Activity feed hook
export function useActivity(limit = 50, pollInterval = 10000) {
  const { data, loading, error } = useApi<{ activities: any[] }>(`/activity?limit=${limit}`, {}, pollInterval)
  return { activities: data?.activities || [], loading, error }
}

// Memory hook
export function useMemory(agentId: string) {
  const { data, loading, error } = useApi<any>(`/memory/${agentId}`, {}, 60000)
  return { memory: data, loading, error }
}

// Dashboard meta hook
export function useDashboardMeta(pollInterval = 10000) {
  const { data, loading, error } = useApi<{ meta: DashboardMeta; lastUpdated: string }>('/dashboard', {}, pollInterval)
  return { 
    meta: data?.meta, 
    lastUpdated: data?.lastUpdated,
    loading, 
    error 
  }
}

// Update function for agents to report status
export async function reportAgentUpdate(payload: {
  agent: string
  project?: string
  task?: string
  status: string
  tokensUsed?: number
  metadata?: Record<string, unknown>
}) {
  const response = await fetch(`${API_BASE_URL}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString()
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to report update: ${response.status}`)
  }

  return response.json()
}
