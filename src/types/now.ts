// Types for Dashboard v3 — Now Tab

export type ActionType = 'deploy_approval' | 'review_signoff' | 'decision_pending' | 'budget_alert' | 'gate_failure' | 'blocker_escalation'
export type KanbanColumn = 'in_progress' | 'blocked' | 'review'
export type AgentStatusDot = 'active' | 'idle' | 'busy' | 'error'
export type StalenessLevel = 'fresh' | 'stale' | 'critical'

// Section 1: Needs You
export interface NeedsYouItem {
  id: string
  projectId: string
  projectName: string
  projectEmoji?: string
  actionType: ActionType
  title: string
  description: string
  stage?: string
  waitingSince: string
  actions: NeedsYouAction[]
}

export interface NeedsYouAction {
  label: string
  type: 'primary' | 'secondary' | 'default'
  href?: string
}

// Section 2: Active Work Kanban
export interface KanbanTask {
  id: string
  projectId: string
  projectName: string
  projectEmoji?: string
  title: string
  column: KanbanColumn
  assignedAgent: string | null
  timeActive: string
  context?: string
  blockerReason?: string
  blockerAgent?: string
  tokenCost?: number
}

export interface ProjectSummary {
  id: string
  name: string
  emoji?: string
  progress: number
  totalTasks: number
  completedTasks: number
  stage: string
  activeWorkers: number
  status: string
  blocker?: string | null
}

// Section 3: Ready for Deploy
export interface DeployReadyItem {
  id: string
  projectName: string
  projectEmoji?: string
  qaPassedAt: string
  branch: string
}

// Section 4: Mapped Out Work
export interface MappedOutProject {
  projectId: string
  projectName: string
  projectEmoji?: string
  tasks: MappedOutTask[]
}

export interface MappedOutTask {
  id: string
  title: string
  dependencies: string[]
  nextStep: string
  scope?: 'S' | 'M' | 'L'
}

// Section 5: Agent Status
export interface QueenAgentStatus {
  id: string
  name: string
  emoji: string
  role: string
  status: AgentStatusDot
  currentTask: string | null
  todayTasks: number
  todayCost: number
  color: string
}

export interface WorkerQueueItem {
  id: string
  status: 'active' | 'queued' | 'done'
  agentModel: string
  task: string
  project: string
  duration: string
  cost?: number
}

export interface ModelHealthItem {
  model: string
  status: 'healthy' | 'degraded' | 'down'
  failCount: number
}

// Section 6: Token Usage
export interface TokenBudget {
  todayCost: number
  budget: number
  usedPercent: number
  overBudget: boolean
}

export interface ProjectCostRow {
  projectId: string
  projectName: string
  todayCost: number
  sprintTotal: number
  sessions: number
  avgPerSession: number
}

export interface AgentCostRow {
  agentId: string
  agentName: string
  model: string
  tokensIn: number
  tokensOut: number
  tokensCached: number
  cost: number
}

// Section 7: Progress Log
export type EventType = 'pipeline' | 'agent' | 'cost' | 'decision' | 'github'

export interface ProgressEvent {
  id: string
  type: EventType
  title: string
  description: string
  projectId?: string
  projectName?: string
  agentId?: string
  timestamp: string
}

// Section 8: Recently Completed
export interface CompletedItem {
  id: string
  title: string
  projectName: string
  agentName: string
  completedAt: string
  tokenCost?: number
  type: 'task' | 'project'
}

// Detail Drawer
export interface DrawerContent {
  type: 'task' | 'project' | 'agent'
  id: string
  title: string
  data: Record<string, unknown>
}

// Staleness
export function getStaleness(updatedAt: string): StalenessLevel {
  const diff = Date.now() - new Date(updatedAt).getTime()
  const minutes = diff / 60000
  if (minutes > 60) return 'critical'
  if (minutes > 15) return 'stale'
  return 'fresh'
}

export function getStalenessBorder(level: StalenessLevel): string {
  switch (level) {
    case 'critical': return '2px solid var(--error)'
    case 'stale': return '2px solid var(--warning)'
    default: return '1px solid var(--border-subtle)'
  }
}

// Aggregate type returned by useNowData
export interface NowData {
  loading: boolean
  error: string | null
  refreshing: boolean
  isApiConnected: boolean
  lastUpdated: string
  lastUpdatedAgo: string
  refresh: () => Promise<void>

  // Section data
  needsYou: NeedsYouItem[]
  kanbanTasks: KanbanTask[]
  projectSummaries: ProjectSummary[]
  deployReady: DeployReadyItem[]
  mappedOut: MappedOutProject[]
  agents: QueenAgentStatus[]
  workerQueue: WorkerQueueItem[]
  modelHealth: ModelHealthItem[]
  tokenBudget: TokenBudget
  progressLog: ProgressEvent[]
  recentlyCompleted: CompletedItem[]

  // Counts for badges
  needsYouCount: number
  activeTaskCount: number
  blockedTaskCount: number
}
