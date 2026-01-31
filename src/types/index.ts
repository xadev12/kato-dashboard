export type ProjectStatus = 'not_started' | 'in_progress' | 'done'
export type TaskStatus = 'queued' | 'in_progress' | 'done'
export type AgentState = 'idle' | 'active' | 'blocked'
export type QueenType = 'main' | 'product' | 'devops' | 'business'
export type ActionType = 'project_created' | 'task_created' | 'task_updated' | 'status_changed' | 'agent_action' | 'deploy' | 'commit'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  repo_url: string | null
  progress: number
  priority: 'high' | 'medium' | 'low'
  created_at: string
  updated_at: string
  assignedQueen: QueenType | null
  tasks: Task[]
}

export interface Task {
  id: string
  project_id?: string
  title: string
  description?: string
  status: TaskStatus
  assignedAgent?: string | null
  assigned_to?: string | null
  priority?: 'low' | 'medium' | 'high'
  created_at?: string
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

export interface QueenAgent {
  id: QueenType
  name: string
  type: 'queen'
  status: AgentState
  currentTask: string | null
}

export interface WorkerItem {
  specialist: string
  taskId: string
  queuedAt: string
}

export interface Workers {
  active: WorkerItem[]
  queue: WorkerItem[]
  recent: WorkerItem[]
}

export interface AgentsData {
  queens: QueenAgent[]
  workers: Workers
}

export interface DashboardMeta {
  totalProjects: number
  completedProjects: number
  inProgressProjects: number
  activeAgents: number
  queuedWorkers: number
}

export interface DashboardData {
  schemaVersion: string
  lastUpdated: string
  agents: AgentsData
  projects: Project[]
  meta: DashboardMeta
}

// Legacy interface for compatibility
export interface AgentStatus {
  id: string
  agent_name: string
  status: 'idle' | 'working' | 'completed'
  current_task: string | null
  last_seen: string
}
