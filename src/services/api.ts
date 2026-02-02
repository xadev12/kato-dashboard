import type { Project, Task, ActivityLog, AgentStatus, ProjectStatus, TaskStatus } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_REAL_API = true // Set to false to use mock data

// Helper to fetch from API
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  if (!USE_REAL_API) return null
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.warn(`API fetch failed for ${endpoint}:`, error)
    return null
  }
}

// ---- Projects ----

export async function getProjects(): Promise<Project[]> {
  const data = await apiFetch<{ projects: Project[] }>('/projects')
  if (data?.projects) return data.projects
  
  // Fallback to JSON file
  try {
    const response = await fetch('/dashboard-data.json')
    if (response.ok) {
      const json = await response.json()
      if (json.projects) return json.projects
    }
  } catch (e) {
    console.warn('Failed to load dashboard-data.json')
  }
  
  return []
}

export async function getProject(id: string): Promise<Project | null> {
  const data = await apiFetch<Project>(`/projects/${id}`)
  if (data) return data
  
  const projects = await getProjects()
  return projects.find(p => p.id === id) || null
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<void> {
  const result = await apiFetch('/update', {
    method: 'POST',
    body: JSON.stringify({
      type: 'project',
      id,
      updates: { status },
      action: `status changed to ${status}`
    })
  })
  
  if (!result) {
    console.warn('Failed to update project status via API')
  }
}

// ---- Tasks ----

export async function getTasks(projectId?: string): Promise<Task[]> {
  const projects = await getProjects()
  const tasks = projects.flatMap(p => p.tasks || [])
  
  if (projectId) {
    return tasks.filter(t => t.project_id === projectId)
  }
  return tasks
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const result = await apiFetch('/update', {
    method: 'POST',
    body: JSON.stringify({
      type: 'task',
      id,
      updates: { 
        status,
        completed_at: status === 'done' ? new Date().toISOString() : null
      },
      action: `status changed to ${status}`
    })
  })
  
  if (!result) {
    console.warn('Failed to update task status via API')
  }
}

// ---- Activity ----

export async function getActivity(limit = 10): Promise<ActivityLog[]> {
  const data = await apiFetch<{ activity: ActivityLog[] }>(`/activity?limit=${limit}`)
  if (data?.activity) return data.activity
  return []
}

export async function addActivity(activity: Partial<ActivityLog>): Promise<void> {
  await apiFetch('/activity', {
    method: 'POST',
    body: JSON.stringify(activity)
  })
}

// ---- Agent Status ----

export async function getAgentStatus(): Promise<AgentStatus[]> {
  const data = await apiFetch<{ agents: any[] }>('/agents')
  if (data?.agents) {
    return data.agents.map(a => ({
      id: a.id,
      agent_name: a.name,
      status: a.status === 'active' ? 'working' : a.status,
      current_task: a.currentTask,
      last_seen: a.updatedAt
    }))
  }
  return []
}

// ---- Token Stats ----

export async function getTokenStats(period: 'today' | 'week' | 'month' = 'week') {
  const data = await apiFetch(`/tokens?period=${period}`)
  if (data) return data
  
  // Fallback to dashboard data
  try {
    const response = await fetch('/dashboard-data.json')
    if (response.ok) {
      const json = await response.json()
      return json.tokenStats
    }
  } catch (e) {
    console.warn('Failed to load token stats')
  }
  
  return null
}

// ---- Workers ----

export async function getWorkers() {
  const data = await apiFetch<{ workers: any }>('/workers')
  if (data?.workers) return data.workers
  
  // Fallback to dashboard data
  try {
    const response = await fetch('/dashboard-data.json')
    if (response.ok) {
      const json = await response.json()
      return json.agents?.workers || { active: [], queue: [], recent: [] }
    }
  } catch (e) {
    console.warn('Failed to load workers')
  }
  
  return { active: [], queue: [], recent: [] }
}

// ---- Full Dashboard ----

export async function getDashboardData() {
  const data = await apiFetch('/dashboard')
  if (data) return data
  
  // Fallback to dashboard-data.json
  try {
    const response = await fetch('/dashboard-data.json')
    if (response.ok) {
      return await response.json()
    }
  } catch (e) {
    console.warn('Failed to load dashboard data')
  }
  
  return null
}

// ---- Memory ----

export async function getMemory(agentId?: string, limit = 50) {
  const endpoint = agentId ? `/memory?agentId=${agentId}&limit=${limit}` : `/memory?limit=${limit}`
  const data = await apiFetch<{ memory: any[] }>(endpoint)
  return data?.memory || []
}
