import { useState, useEffect, useCallback } from 'react'
import type { Project, Task, ActivityLog, AgentStatus } from '../types'
import { getProjects, getTasks, getActivity, getAgentStatus } from '../services/api'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const data = await getProjects()
    setProjects(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { projects, loading, refetch: fetch }
}

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const data = await getTasks(projectId)
    setTasks(data)
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetch() }, [fetch])
  return { tasks, loading, refetch: fetch }
}

export function useActivity(limit = 10) {
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActivity(limit).then(data => {
      setActivity(data)
      setLoading(false)
    })
  }, [limit])

  return { activity, loading }
}

export function useAgentStatus() {
  const [agents, setAgents] = useState<AgentStatus[]>([])

  useEffect(() => {
    getAgentStatus().then(setAgents)
    const interval = setInterval(() => getAgentStatus().then(setAgents), 5000)
    return () => clearInterval(interval)
  }, [])

  return { agents }
}
