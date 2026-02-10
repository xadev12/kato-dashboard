import { memo, useMemo, useState, useCallback } from 'react'
import { useProjects, useAgents, useDashboardMeta, useActions } from '../hooks/useProjects'
import { ProjectCard } from '../components/ProjectCard'
import { AgentFilterPanel } from '../components/AgentFilterPanel'
import { UserActionsPanel } from '../components/UserActionsPanel'
import { WorkerQueuePanel } from '../components/WorkerQueuePanel'
import { GlobalStatsPanel } from '../components/GlobalStatsPanel'
import { SearchBar } from '../components/SearchBar'
import type { QueenType, Task } from '../types'

type FilterType = 'all' | 'in_progress' | 'done' | 'not_started'

export function AgentDashboard() {
  const { projects, loading: projectsLoading, refresh: refreshProjects } = useProjects()
  const { queens, workers, loading: agentsLoading, refresh: refreshAgents } = useAgents()
  const { meta, lastUpdated, loading: metaLoading, refresh: refreshMeta } = useDashboardMeta()
  const { pending: pendingActions, loading: actionsLoading, refresh: refreshActions } = useActions()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterType>('all')
  const [agentFilter, setAgentFilter] = useState<QueenType | null>(null)
  const [focusMode, setFocusMode] = useState(false)

  const loading = projectsLoading || agentsLoading || metaLoading

  // Toggle focus mode
  const toggleFocusMode = () => {
    if (focusMode) {
      setFocusMode(false)
      setAgentFilter(null)
      setStatusFilter('all')
    } else {
      setFocusMode(true)
      setAgentFilter('main')
      setStatusFilter('in_progress')
    }
  }

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = projects

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    if (agentFilter) {
      filtered = filtered.filter(p => p.assignedQueen === agentFilter)
    }
    
    if (focusMode) {
      filtered = filtered.filter(p => p.priority === 'high' || p.priority === 'medium')
      filtered = [...filtered].sort((a, b) => b.progress - a.progress)
    }

    return filtered
  }, [projects, searchQuery, statusFilter, agentFilter, focusMode])

  // Get all live tasks across projects
  const liveTasks = useMemo(() => {
    const tasks: (Task & { projectName: string; projectId: string })[] = []
    projects.forEach(project => {
      if (project.tasks) {
        project.tasks.forEach(task => {
          if (task.status === 'in_progress') {
            tasks.push({ ...task, projectName: project.name, projectId: project.id })
          }
        })
      }
    })
    return tasks.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
  }, [projects])

  // Get queued tasks
  const queuedTasks = useMemo(() => {
    const tasks: (Task & { projectName: string; projectId: string })[] = []
    projects.forEach(project => {
      if (project.tasks) {
        project.tasks.forEach(task => {
          if (task.status === 'queued') {
            tasks.push({ ...task, projectName: project.name, projectId: project.id })
          }
        })
      }
    })
    return tasks
  }, [projects])

  // Active queen agents count
  const activeQueens = queens.filter(q => q.status === 'active').length
  const activeSubAgents = queens.flatMap(q => q.subAgents || []).filter(s => s.status === 'active').length

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshProjects(),
      refreshAgents(),
      refreshMeta(),
      refreshActions()
    ])
  }, [refreshProjects, refreshAgents, refreshMeta, refreshActions])

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Agent Coordination</h1>
              <span className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20">
                v3.0
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Real-time multi-agent task tracking and project coordination
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!actionsLoading && pendingActions.length > 0 && (
              <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                </span>
                <span className="text-xs font-medium text-rose-400">{pendingActions.length} pending</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <GlobalStatsPanel meta={meta} lastUpdated={lastUpdated} />
      </div>

      {/* Live Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              Live Tasks
              {liveTasks.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20 animate-pulse">
                  {liveTasks.length} active
                </span>
              )}
            </h2>
            <span className="text-xs text-[var(--text-tertiary)]">Real-time updates</span>
          </div>
          
          {liveTasks.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8 text-center">
              <div className="w-12 h-12 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">No active tasks</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">All workers are idle or queued</p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveTasks.map((task) => (
                <LiveTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}

          {/* Queued Tasks */}
          {queuedTasks.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                  Queued
                  <span className="px-2 py-0.5 rounded-full bg-gray-500/10 text-[var(--text-secondary)] text-xs border border-gray-500/20">
                    {queuedTasks.length}
                  </span>
                </h3>
              </div>
              {queuedTasks.map((task) => (
                <QueuedTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Worker Queue & User Actions */}
        <div className="space-y-6">
          <UserActionsPanel
            onRefresh={handleRefresh}
          />
          
          <WorkerQueuePanel workers={workers} />
          
          {/* Quick Stats */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">System Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatusItem 
                label="Active Queens" 
                value={activeQueens} 
                color={activeQueens > 0 ? 'amber' : 'gray'}
                pulse={activeQueens > 0}
              />
              <StatusItem 
                label="Active Workers" 
                value={activeSubAgents + workers.active.length} 
                color={activeSubAgents > 0 || workers.active.length > 0 ? 'emerald' : 'gray'}
                pulse={activeSubAgents > 0 || workers.active.length > 0}
              />
              <StatusItem 
                label="Queued" 
                value={workers.queue.length + queuedTasks.length} 
                color={workers.queue.length > 0 || queuedTasks.length > 0 ? 'amber' : 'gray'}
              />
              <StatusItem 
                label="Projects" 
                value={projects.length} 
                color="violet"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Agent Status Section with Filters */}
      <div className="space-y-4">
        <AgentFilterPanel agents={queens} />
      </div>

      {/* Projects Section */}
      <div className="space-y-6 pt-4 border-t border-[var(--border-subtle)]">
        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              Projects
              <span className="text-sm font-normal text-[var(--text-tertiary)]">
                ({filteredProjects.length} of {projects.length})
              </span>
              {focusMode && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                  Focus Mode
                </span>
              )}
            </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 w-full sm:w-auto">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search projects..."
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={toggleFocusMode}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border flex items-center gap-1.5 ${
                  focusMode
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={focusMode ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029"} 
                  />
                </svg>
                {focusMode ? 'Focus On' : 'Focus'}
              </button>
              
              <div className="w-px h-6 bg-white/[0.1] mx-1" />
              
              <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="All" count={projects.length} />
              <FilterButton active={statusFilter === 'in_progress'} onClick={() => setStatusFilter('in_progress')} label="Active" count={projects.filter(p => p.status === 'in_progress').length} accent />
              <FilterButton active={statusFilter === 'done'} onClick={() => setStatusFilter('done')} label="Done" count={projects.filter(p => p.status === 'done').length} />
              
              <div className="w-px h-6 bg-white/[0.1] mx-1" />
              
              <select
                value={agentFilter || ''}
                onChange={(e) => setAgentFilter(e.target.value as QueenType || null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)] focus:outline-none focus:border-violet-500/30"
              >
                <option value="">All Agents</option>
                <option value="main">Main</option>
                <option value="product">Product</option>
                <option value="devops">DevOps</option>
                <option value="business">Business</option>
                <option value="brain">Brain</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <LoadingGrid />
        ) : filteredProjects.length === 0 ? (
          <EmptyState hasSearch={!!searchQuery || statusFilter !== 'all' || !!agentFilter} onClear={() => {
            setSearchQuery('')
            setStatusFilter('all')
            setAgentFilter(null)
          }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Live Task Card
function LiveTaskCard({ task }: { task: Task & { projectName: string; projectId: string } }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-amber-500/20 bg-[var(--bg-secondary)] p-4 transition-all duration-200 hover:border-amber-500/30">
      {/* Active indicator */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 animate-pulse" />
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-[var(--text-tertiary)]">{task.projectName}</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20">
              IN PROGRESS
            </span>
          </div>
          <h4 className="font-medium text-[var(--text-primary)] truncate">{task.title}</h4>
          {task.assignedAgent && (
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Assigned to: {task.assignedAgent}</p>
          )}
        </div>
        
        {task.progress !== undefined && (
          <div className="w-16">
            <div className="h-1.5 bg-[var(--bg-muted)] rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="text-xs text-amber-400 text-right block mt-1">{task.progress}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Queued Task Card
function QueuedTaskCard({ task }: { task: Task & { projectName: string; projectId: string } }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 opacity-70 hover:opacity-100 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-[var(--text-tertiary)]">{task.projectName}</span>
            <span className="px-1.5 py-0.5 rounded bg-gray-500/10 text-[var(--text-secondary)] text-[10px] font-medium border border-gray-500/20">
              QUEUED
            </span>
          </div>
          <h4 className="font-medium text-[var(--text-secondary)] truncate">{task.title}</h4>
        </div>
      </div>
    </div>
  )
}

// Status Item Component
function StatusItem({ label, value, color, pulse = false }: { label: string; value: number; color: string; pulse?: boolean }) {
  const colorClasses: Record<string, string> = {
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    violet: 'text-violet-400',
    gray: 'text-[var(--text-secondary)]'
  }
  
  return (
    <div className="text-center p-3 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-subtle)]">
      <div className={`text-xl font-bold ${colorClasses[color]} ${pulse ? 'animate-pulse' : ''}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{label}</div>
    </div>
  )
}

// Filter Button
const FilterButton = memo(function FilterButton({
  active, onClick, label, count, accent
}: { active: boolean; onClick: () => void; label: string; count: number; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
        active
          ? accent 
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            : 'bg-violet-500/10 text-violet-400 border-violet-500/30'
          : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-secondary)]'
      }`}
    >
      {label} <span className="opacity-60">·</span> {count}
    </button>
  )
})

// Empty State
function EmptyState({ hasSearch, onClear }: { hasSearch: boolean; onClear: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-12 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto bg-[var(--bg-muted)] rounded-full flex items-center justify-center border border-[var(--border-subtle)]">
          <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{hasSearch ? 'No projects found' : 'No projects yet'}</h3>
          <p className="text-sm text-[var(--text-tertiary)]">{hasSearch ? 'Try adjusting your search or filters' : 'Create your first project to get started'}</p>
        </div>
        {hasSearch && (
          <button onClick={onClear} className="px-4 py-2 rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] text-sm font-medium border border-[var(--border-subtle)] transition-colors">
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}

// Loading Skeleton
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-64 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
      ))}
    </div>
  )
}
