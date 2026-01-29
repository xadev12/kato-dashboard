import { supabase, isSupabaseConfigured } from './supabase'
import { mockProjects, mockTasks, mockActivity, mockAgentStatus } from '../data/mock'
import type { Project, Task, ActivityLog, AgentStatus, ProjectStatus, TaskStatus } from '../types'

// ---- Projects ----

export async function getProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) return mockProjects

  const { data, error } = await supabase!
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return mockProjects
  }
  return data as Project[]
}

export async function getProject(id: string): Promise<Project | null> {
  if (!isSupabaseConfigured) return mockProjects.find(p => p.id === id) || null

  const { data, error } = await supabase!
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching project:', error)
    return mockProjects.find(p => p.id === id) || null
  }
  return data as Project
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<void> {
  if (!isSupabaseConfigured) {
    const p = mockProjects.find(p => p.id === id)
    if (p) p.status = status
    return
  }

  await supabase!.from('projects').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
}

// ---- Tasks ----

export async function getTasks(projectId?: string): Promise<Task[]> {
  if (!isSupabaseConfigured) {
    return projectId ? mockTasks.filter(t => t.project_id === projectId) : mockTasks
  }

  let query = supabase!.from('tasks').select('*').order('created_at', { ascending: true })
  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) {
    console.error('Error fetching tasks:', error)
    return projectId ? mockTasks.filter(t => t.project_id === projectId) : mockTasks
  }
  return data as Task[]
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  if (!isSupabaseConfigured) {
    const t = mockTasks.find(t => t.id === id)
    if (t) {
      t.status = status
      t.completed_at = status === 'done' ? new Date().toISOString() : null
    }
    return
  }

  await supabase!.from('tasks').update({
    status,
    completed_at: status === 'done' ? new Date().toISOString() : null,
  }).eq('id', id)
}

// ---- Activity ----

export async function getActivity(limit = 10): Promise<ActivityLog[]> {
  if (!isSupabaseConfigured) return mockActivity.slice(0, limit)

  const { data, error } = await supabase!
    .from('activity_log')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching activity:', error)
    return mockActivity.slice(0, limit)
  }
  return data as ActivityLog[]
}

// ---- Agent Status ----

export async function getAgentStatus(): Promise<AgentStatus[]> {
  if (!isSupabaseConfigured) return mockAgentStatus

  const { data, error } = await supabase!
    .from('agent_status')
    .select('*')
    .order('last_seen', { ascending: false })

  if (error) {
    console.error('Error fetching agent status:', error)
    return mockAgentStatus
  }
  return data as AgentStatus[]
}
