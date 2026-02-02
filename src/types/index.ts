export type ProjectStatus = 'not_started' | 'in_progress' | 'done'
export type TaskStatus = 'queued' | 'in_progress' | 'done'
export type AgentState = 'idle' | 'active' | 'blocked'
export type QueenType = 'main' | 'product' | 'devops' | 'business' | 'brain'
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
  impact?: number
  effort?: number
  timeInvested?: number
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
  blockerReason?: string
  actionRequired?: string
  estimatedTokenCost?: number
  blockedOnQueen?: string | null
  progress?: number
}

export interface ActivityLog {
  id: string
  action_type: ActionType
  description: string
  metadata: Record<string, unknown> | null
  project_id: string | null
  timestamp: string
}

export interface SubAgent {
  id: string
  name: string
  emoji: string
  description: string
  specialty: string
  status: AgentState
  spawnCost: number
  spawnedCount: number
  currentTask?: string | null
}

export interface QueenAgent {
  id: QueenType
  name: string
  type: 'queen'
  status: AgentState
  currentTask: string | null
  taskStartedAt?: string | null
  emoji: string
  skills: string[]
  description: string
  color: string
  subAgents: SubAgent[]
  stats?: {
    tasksCompleted: number
    successRate: number
    currentStreak: number
    weeklyVelocity: number
  }
  memoryStats?: {
    totalEntries: number
    lastUpdated: string
    activeContexts: number
  }
}

export interface WorkerItem {
  specialist: string
  taskId: string
  queuedAt?: string
  spawnedAt?: string
  completedAt?: string
  eta?: string
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
  totalTokensUsed: number
  avgTokensPerTask: number
  tokenWastePercent: number
  parallelizationEfficiency: number
  totalCost?: number
}

export interface DashboardAction {
  id: string
  type: 'decision' | 'approval' | 'review' | 'completed' | 'note'
  title: string
  description?: string
  source: 'system' | 'agent' | 'user'
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  dueAt?: string | null
  timestamp?: string
}

export interface MemoryUpdate {
  id: string
  type: 'self_review' | 'daily_log' | 'preference' | 'lesson'
  title: string
  content: string
  timestamp: string
  agentId: string
}

export interface ModelTokenMetrics {
  modelId: string
  modelName: string
  tokensUsed: number
  cost: number
  requests: number
  percentage: string
}

export interface TodayTokenStats {
  tokensUsed: number
  cost: number
  requests: number
  sessions: number
}

export interface MonthlyTokenStats {
  limit: number
  used: number
  remaining: number
  projected: number
}

export interface TokenStats {
  period: string
  generatedAt: string
  totalTokensUsed: number
  totalCost: number
  totalRequests: number
  avgTokensPerRequest: number
  tokenWastePercent: number
  parallelizationEfficiency: number
  today: TodayTokenStats
  monthly: MonthlyTokenStats
  modelBreakdown: ModelTokenMetrics[]
  dailyStats?: DailyTokenStat[]
  agentBreakdown?: AgentTokenMetrics[]
}

export interface AgentTokenMetrics {
  agentId: string
  agentName: string
  tokensUsed: number
  cost: number
  requests: number
  avgTokensPerRequest: number
  successRate: number
}

export interface DailyTokenStat {
  date: string
  tokensUsed: number
  cost: number
  requests: number
  agentsActive: number
}

export interface CompletedProject {
  id: string
  name: string
  description: string
  status: 'archived'
  completedDate: string
  duration: string
  teamSize: number
  keyAchievements: string[]
  technologies: string[]
  repoUrl?: string
  demoUrl?: string
  impact: string
}

export interface DashboardData {
  schemaVersion: string
  lastUpdated: string
  agents: AgentsData
  projects: Project[]
  actions?: {
    pending: DashboardAction[]
    recent: DashboardAction[]
  }
  memory?: {
    recentUpdates: MemoryUpdate[]
    selfReviewEntries: number
    dailyLogEntries: number
    lastUpdated: string
  }
  tokenStats?: TokenStats
  completedProjects?: CompletedProject[]
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

export interface BlockedItem {
  id: string
  type: 'task' | 'agent'
  projectName: string
  title: string
  blockerDescription: string
  actionRequired: string
  estimatedTokenCost: number
  priority: 'high' | 'medium' | 'low'
  blockedSince: string
  assignedQueen: string | null
}

export interface MemoryEntry {
  id: string
  timestamp: string
  type: 'decision' | 'observation' | 'lesson' | 'preference'
  content: string
  tags: string[]
  projectId?: string
}

export interface Preference {
  id: string
  category: string
  value: string
  priority: 'high' | 'medium' | 'low'
  lastUpdated: string
}

export interface ActiveProjectContext {
  projectId: string
  projectName: string
  context: string
  lastAccessed: string
  importance: 'high' | 'medium' | 'low'
}

export interface AgentMemory {
  id: string
  agentId: string
  entries: MemoryEntry[]
  xavierPreferences: Preference[]
  activeProjects: ActiveProjectContext[]
  lastSynced: string
}

// All agents data for roster view
export const ALL_QUEEN_AGENTS: QueenAgent[] = [
  {
    id: 'main',
    name: 'Kato',
    type: 'queen',
    status: 'active',
    currentTask: 'Optimizing Kato Dashboard v3',
    taskStartedAt: '2026-02-03T02:15:00Z',
    emoji: '',
    skills: ['System Coordination', 'Task Routing', 'Context Management', 'Performance Optimization'],
    description: 'Primary coordinator. Routes tasks, manages context, and optimizes system-wide performance.',
    color: 'violet',
    subAgents: [
      { id: 'frontend', name: 'Frontend Specialist', emoji: '', specialty: 'React/TypeScript UI Development', description: 'UI/UX implementation with modern frameworks', status: 'active', spawnCost: 15000, spawnedCount: 15, currentTask: 'Dashboard v3 Rebuild' },
      { id: 'backend', name: 'Backend Specialist', emoji: '', specialty: 'API & Database Design', description: 'Server-side logic and data architecture', status: 'idle', spawnCost: 15000, spawnedCount: 9 },
      { id: 'fullstack', name: 'Full Stack Dev', emoji: '', specialty: 'End-to-End Development', description: 'Complete feature implementation', status: 'idle', spawnCost: 25000, spawnedCount: 6 }
    ],
    stats: { tasksCompleted: 187, successRate: 94, currentStreak: 12, weeklyVelocity: 15 },
    memoryStats: { totalEntries: 567, lastUpdated: '2026-02-03T02:10:00Z', activeContexts: 6 }
  },
  {
    id: 'product',
    name: 'Product Owner',
    type: 'queen',
    status: 'idle',
    currentTask: null,
    emoji: '',
    skills: ['Requirements Analysis', 'User Stories', 'Roadmap Planning', 'Stakeholder Communication'],
    description: 'Product vision and requirements. Defines what to build and why.',
    color: 'amber',
    subAgents: [
      { id: 'ux-researcher', name: 'UX Researcher', emoji: '', specialty: 'User Research & Testing', description: 'Gather and analyze user feedback', status: 'idle', spawnCost: 12000, spawnedCount: 7 },
      { id: 'spec-writer', name: 'Spec Writer', emoji: '', specialty: 'Technical Specifications', description: 'Detailed feature specifications', status: 'idle', spawnCost: 10000, spawnedCount: 11 }
    ],
    stats: { tasksCompleted: 95, successRate: 91, currentStreak: 4, weeklyVelocity: 8 },
    memoryStats: { totalEntries: 215, lastUpdated: '2026-02-02T18:00:00Z', activeContexts: 3 }
  },
  {
    id: 'devops',
    name: 'DevOps Engineer',
    type: 'queen',
    status: 'idle',
    currentTask: null,
    emoji: '',
    skills: ['CI/CD Pipelines', 'Infrastructure as Code', 'Monitoring', 'Security Hardening'],
    description: 'Infrastructure and deployment automation. Keeps systems running smoothly.',
    color: 'emerald',
    subAgents: [
      { id: 'sre', name: 'SRE Specialist', emoji: '', specialty: 'Site Reliability Engineering', description: 'System reliability and uptime', status: 'idle', spawnCost: 18000, spawnedCount: 5 },
      { id: 'security', name: 'Security Auditor', emoji: '', specialty: 'Security Reviews', description: 'Security assessment and hardening', status: 'idle', spawnCost: 15000, spawnedCount: 4 }
    ],
    stats: { tasksCompleted: 72, successRate: 97, currentStreak: 15, weeklyVelocity: 6 },
    memoryStats: { totalEntries: 158, lastUpdated: '2026-02-02T14:30:00Z', activeContexts: 2 }
  },
  {
    id: 'business',
    name: 'Business Strategist',
    type: 'queen',
    status: 'idle',
    currentTask: null,
    emoji: '',
    skills: ['Market Analysis', 'Competitive Research', 'Business Modeling', 'Growth Strategy'],
    description: 'Business strategy and market analysis. Identifies opportunities and risks.',
    color: 'blue',
    subAgents: [
      { id: 'market-analyst', name: 'Market Analyst', emoji: '', specialty: 'Market Research', description: 'Competitive and market analysis', status: 'idle', spawnCost: 14000, spawnedCount: 6 },
      { id: 'pricing', name: 'Pricing Specialist', emoji: '', specialty: 'Pricing Strategy', description: 'Pricing model optimization', status: 'idle', spawnCost: 13000, spawnedCount: 3 }
    ],
    stats: { tasksCompleted: 48, successRate: 88, currentStreak: 2, weeklyVelocity: 4 },
    memoryStats: { totalEntries: 125, lastUpdated: '2026-02-01T16:20:00Z', activeContexts: 2 }
  },
  {
    id: 'brain',
    name: 'Second Brain Keeper',
    type: 'queen',
    status: 'idle',
    currentTask: null,
    emoji: '',
    skills: ['Knowledge Management', 'Documentation', 'Pattern Recognition', 'Insight Synthesis'],
    description: 'Memory and knowledge management. Maintains system context and learns from patterns.',
    color: 'pink',
    subAgents: [
      { id: 'archivist', name: 'Knowledge Archivist', emoji: '', specialty: 'Documentation & Notes', description: 'Organize and maintain knowledge base', status: 'idle', spawnCost: 8000, spawnedCount: 9 },
      { id: 'qa', name: 'QA Specialist', emoji: '', specialty: 'Quality Assurance', description: 'Testing and quality validation', status: 'idle', spawnCost: 12000, spawnedCount: 13 },
      { id: 'ios', name: 'iOS Specialist', emoji: '', specialty: 'iOS Development', description: 'Swift/SwiftUI app development', status: 'idle', spawnCost: 20000, spawnedCount: 5 }
    ],
    stats: { tasksCompleted: 134, successRate: 95, currentStreak: 11, weeklyVelocity: 11 },
    memoryStats: { totalEntries: 892, lastUpdated: '2026-02-03T00:00:00Z', activeContexts: 8 }
  }
]
