import { memo, useMemo, useState } from 'react'
import { useProjects, useTasks, useSubAgents } from '../hooks/useProjects'
import { KanbanBoard } from '../components/KanbanBoard'
import { ActivityFeed } from '../components/ActivityFeed'
import { SearchBar } from '../components/SearchBar'

export function Dashboard() {
  const { projects, loading: projectsLoading } = useProjects()
  const { tasks, loading: tasksLoading } = useTasks()
  const { subAgents } = useSubAgents()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const loading = projectsLoading || tasksLoading

  // Filter projects based on search and status
  const filteredProjects = useMemo(() => {
    let filtered = projects

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    return filtered
  }, [projects, searchQuery, statusFilter])

  // Enhanced stats with velocity
  const stats = useMemo(() => {
    const total = projects.length
    const inProgress = projects.filter(p => p.status === 'in_progress').length
    const done = projects.filter(p => p.status === 'done').length
    const backlog = projects.filter(p => p.status === 'backlog').length
    
    const tasksDone = tasks.filter(t => t.status === 'done').length
    const tasksTotal = tasks.length
    const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length
    
    // Calculate overall completion
    const totalProgress = projects.reduce((sum, p) => sum + p.progress, 0)
    const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0
    
    return {
      total,
      inProgress,
      done,
      backlog,
      tasksDone,
      tasksTotal,
      tasksInProgress,
      avgProgress,
      completionRate: tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0
    }
  }, [projects, tasks])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Search */}
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Kato's Progress</h1>
            <p className="text-sm text-gray-400">
              Real-time status of active tasks and sub-agents
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search projects..."
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterButton
              active={statusFilter === null}
              onClick={() => setStatusFilter(null)}
              label="All"
              count={projects.length}
            />
            <FilterButton
              active={statusFilter === 'backlog'}
              onClick={() => setStatusFilter('backlog')}
              label="Backlog"
              count={stats.backlog}
            />
            <FilterButton
              active={statusFilter === 'in_progress'}
              onClick={() => setStatusFilter('in_progress')}
              label="Active"
              count={stats.inProgress}
            />
            <FilterButton
              active={statusFilter === 'done'}
              onClick={() => setStatusFilter('done')}
              label="Done"
              count={stats.done}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={stats.total}
          subtitle={`${stats.avgProgress}% avg progress`}
          delay={0}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          subtitle={`${stats.tasksInProgress} active tasks`}
          accent
          delay={50}
        />
        <StatCard
          label="Completion Rate"
          value={`${stats.completionRate}%`}
          subtitle={`${stats.tasksDone}/${stats.tasksTotal} tasks`}
          delay={100}
        />
        <StatCard
          label="Completed"
          value={stats.done}
          subtitle={`${stats.backlog} in backlog`}
          delay={150}
        />
      </div>

      {loading ? (
        <LoadingKanban />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          hasSearch={!!searchQuery || !!statusFilter}
          onClear={() => {
            setSearchQuery('')
            setStatusFilter(null)
          }}
        />
      ) : (
        <KanbanBoard projects={filteredProjects} tasks={tasks} />
      )}

      {/* Sub-Agents Section */}
      {subAgents && subAgents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Background Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subAgents.map((agent: any) => (
              <div key={agent.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{agent.label}</span>
                  <span className={`badge ${
                    agent.status === 'running' ? 'badge-blue' :
                    agent.status === 'complete' ? 'badge-green' :
                    'badge-gray'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{agent.task}</p>
                {agent.progress && (
                  <div className="mt-3">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${agent.progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-600 mt-1">{agent.progress}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <span className="text-xs text-gray-600">Auto-refreshes every 10s</span>
        </div>
        <div className="card !p-4">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}

// Filter Button Component
const FilterButton = memo(function FilterButton({
  active,
  onClick,
  label,
  count
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
        active
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
          : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.05] hover:text-gray-300'
      }`}
    >
      {label} <span className="opacity-60">·</span> {count}
    </button>
  )
})

// Refined Stat Card
const StatCard = memo(function StatCard({
  label,
  value,
  subtitle,
  accent,
  delay = 0
}: {
  label: string
  value: string | number
  subtitle?: string
  accent?: boolean
  delay?: number
}) {
  return (
    <div
      className="stat-card group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative z-10 space-y-2 text-center">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </div>
        <div
          className={`text-3xl font-bold transition-colors duration-200 ${
            accent
              ? 'text-blue-400 group-hover:text-blue-300'
              : 'text-white group-hover:text-gray-100'
          }`}
        >
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-600">{subtitle}</div>
        )}
      </div>
    </div>
  )
})

// Empty State
function EmptyState({
  hasSearch,
  onClear
}: {
  hasSearch: boolean
  onClear: () => void
}) {
  return (
    <div className="card !p-12 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto bg-white/[0.03] rounded-full flex items-center justify-center border border-white/[0.06]">
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">
            {hasSearch ? 'No projects found' : 'All caught up'}
          </h3>
          <p className="text-sm text-gray-500">
            {hasSearch
              ? 'Try adjusting your search or filters'
              : 'No active tasks at the moment'}
          </p>
        </div>
        {hasSearch && (
          <button onClick={onClear} className="btn btn-secondary">
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}

// Loading Skeleton
function LoadingKanban() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="h-5 w-24 bg-white/[0.03] rounded animate-pulse" />
          <div className="space-y-3">
            {[...Array(2)].map((_, j) => (
              <div
                key={j}
                className="h-40 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
