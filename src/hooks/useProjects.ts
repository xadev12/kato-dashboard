import { useState, useEffect } from 'react'
import type { Project, Task, DashboardData, QueenAgent, Workers, DashboardMeta } from '../types'

// Fetch data from JSON file (in production, this would be an API)
const fetchDashboardData = async (): Promise<DashboardData | null> => {
  try {
    const response = await fetch('/dashboard-data.json')
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return null
  }
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDashboardData()
      if (data && data.projects) {
        setProjects(data.projects)
      }
      setLoading(false)
    }

    loadData()

    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  return { projects, loading }
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDashboardData()
      if (data && data.projects) {
        // Extract all tasks from all projects
        const allTasks: Task[] = []
        data.projects.forEach((project: Project) => {
          if (project.tasks) {
            project.tasks.forEach((task: Task) => {
              allTasks.push({
                ...task,
                project_id: project.id
              })
            })
          }
        })
        setTasks(allTasks)
      }
      setLoading(false)
    }

    loadData()

    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  return { tasks, loading }
}

// New hook for agent data
export const useAgents = () => {
  const [queens, setQueens] = useState<QueenAgent[]>([])
  const [workers, setWorkers] = useState<Workers>({ active: [], queue: [], recent: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDashboardData()
      if (data && data.agents) {
        setQueens(data.agents.queens)
        setWorkers(data.agents.workers)
      }
      setLoading(false)
    }

    loadData()

    // Auto-refresh every 5 seconds for agents (more frequent)
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  return { queens, workers, loading }
}

// Hook for dashboard meta/stats
export const useDashboardMeta = () => {
  const [meta, setMeta] = useState<DashboardMeta | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDashboardData()
      if (data) {
        setMeta(data.meta)
        setLastUpdated(data.lastUpdated)
      }
      setLoading(false)
    }

    loadData()

    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  return { meta, lastUpdated, loading }
}

// New hook for activity feed
export const useActivity = () => {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDashboardData()
      if (data && (data as any).activity) {
        setActivities((data as any).activity)
      }
      setLoading(false)
    }

    loadData()

    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  return { activities, loading }
}

// Hook for sub-agents (legacy compatibility)
export const useSubAgents = () => {
  const [subAgents, setSubAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDashboardData()
      if (data && (data as any).subAgents) {
        setSubAgents((data as any).subAgents)
      }
      setLoading(false)
    }

    loadData()

    // Auto-refresh every 5 seconds for sub-agents (more frequent)
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  return { subAgents, loading }
}
