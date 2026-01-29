export type ProjectStatus = 'backlog' | 'in_progress' | 'done'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type ActionType = 'project_created' | 'task_created' | 'task_updated' | 'status_changed' | 'agent_action' | 'deploy' | 'commit'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  repo_url: string | null
  progress: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string
  status: TaskStatus
  assigned_to?: string | null
  priority?: 'low' | 'medium' | 'high'
  created_at: string
  completed_at: string | null
}

export interface ActivityLog {
  id: string
  action_type: ActionType
  description: string
  metadata: Record<string, unknown> | null
  project_id: string | null
  timestamp: string
}

export interface AgentStatus {
  id: string
  agent_name: string
  status: 'idle' | 'working' | 'completed'
  current_task: string | null
  last_seen: string
}
