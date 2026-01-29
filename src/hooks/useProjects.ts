import { useState, useEffect } from 'react'
import type { Project, Task } from '../types'

// Fetch data from JSON file (in production, this would be an API)
const fetchDashboardData = async () => {
  try {
    // In development, Vite serves files from public/
    // We'll copy dashboard-data.json to public/ folder
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
        // Transform data to match Project type
        const mappedProjects = data.projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          progress: p.progress,
          repo_url: p.repo_url,
          created_at: p.created_at,
          updated_at: p.updated_at
        }))
        setProjects(mappedProjects)
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
        data.projects.forEach((project: any) => {
          if (project.tasks) {
            project.tasks.forEach((task: any) => {
              allTasks.push({
                id: task.id,
                project_id: project.id,
                title: task.title,
                description: task.note || '',
                status: task.status,
                created_at: project.created_at,
                completed_at: task.completed_at || null
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

// New hook for activity feed
export const useActivity = () => {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDashboardData()
      if (data && data.activity) {
        setActivities(data.activity)
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

// Hook for sub-agents
export const useSubAgents = () => {
  const [subAgents, setSubAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDashboardData()
      if (data && data.subAgents) {
        setSubAgents(data.subAgents)
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
