import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardData } from '../hooks/useDashboardData'

type StatusFilter = 'all' | 'in_progress' | 'blocked' | 'done'

export function Projects() {
  const { data, loading, lastUpdatedAgo, refresh } = useDashboardData()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Get all projects from both activeWork and projects arrays
  const allProjects = useMemo(() => {
    const activeProjects = data?.activeWork?.projects || []
    const legacyProjects = data?.projects || []

    // Merge and dedupe by ID
    const projectMap = new Map()
    activeProjects.forEach((p: any) => projectMap.set(p.id, p))
    legacyProjects.forEach((p: any) => {
      if (!projectMap.has(p.id)) projectMap.set(p.id, p)
    })

    return Array.from(projectMap.values())
  }, [data])

  // Filter projects
  const filteredProjects = useMemo(() => {
    let projects = allProjects

    if (statusFilter !== 'all') {
      projects = projects.filter(p => p.status === statusFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }

    return projects
  }, [allProjects, statusFilter, searchQuery])

  // Stats
  const stats = useMemo(() => ({
    total: allProjects.length,
    inProgress: allProjects.filter(p => p.status === 'in_progress').length,
    blocked: allProjects.filter(p => p.status === 'blocked').length,
    done: allProjects.filter(p => p.status === 'done').length
  }), [allProjects])

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Projects</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {stats.inProgress} active, {stats.blocked} blocked, {stats.done} completed
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span>Updated {lastUpdatedAgo}</span>
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
            title="Refresh"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]/50 focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 p-1 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-subtle)]">
          <FilterButton
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            label="All"
            count={stats.total}
          />
          <FilterButton
            active={statusFilter === 'in_progress'}
            onClick={() => setStatusFilter('in_progress')}
            label="Active"
            count={stats.inProgress}
            color="cyan"
          />
          <FilterButton
            active={statusFilter === 'blocked'}
            onClick={() => setStatusFilter('blocked')}
            label="Blocked"
            count={stats.blocked}
            color="amber"
          />
          <FilterButton
            active={statusFilter === 'done'}
            onClick={() => setStatusFilter('done')}
            label="Done"
            count={stats.done}
            color="emerald"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          hasFilters={statusFilter !== 'all' || searchQuery !== ''}
          onClear={() => {
            setStatusFilter('all')
            setSearchQuery('')
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

// Filter Button
function FilterButton({
  active,
  onClick,
  label,
  count,
  color
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  color?: 'cyan' | 'amber' | 'emerald'
}) {
  const activeClasses = color
    ? {
        cyan: 'bg-cyan-500/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/30',
        amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      }[color]
    : 'bg-white/10 text-[var(--text-primary)] border-white/20'

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
        active
          ? activeClasses
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
      }`}
    >
      {label} <span className="opacity-60 ml-1">{count}</span>
    </button>
  )
}

// Project Card
function ProjectCard({ project }: { project: any }) {
  const isBlocked = project.status === 'blocked'
  const isDone = project.status === 'done'

  const statusColors = {
    in_progress: 'bg-cyan-500/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20',
    blocked: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    not_started: 'bg-gray-500/10 text-[var(--text-secondary)] border-gray-500/20'
  }

  const statusLabels = {
    in_progress: 'In Progress',
    blocked: 'Blocked',
    done: 'Completed',
    not_started: 'Not Started'
  }

  return (
    <Link
      to={`/projects/${project.id}`}
      className={`block p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${
        isBlocked
          ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30'
          : isDone
          ? 'bg-[var(--bg-secondary)] border-emerald-500/20 hover:border-emerald-500/30'
          : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase border ${statusColors[project.status as keyof typeof statusColors] || statusColors.not_started}`}>
              {statusLabels[project.status as keyof typeof statusLabels] || 'Unknown'}
            </span>
            {project.priority && (
              <span className="text-[10px] text-[var(--text-tertiary)]">{project.priority}</span>
            )}
          </div>
          <h3 className="font-medium text-[var(--text-primary)] truncate">{project.name}</h3>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3">{project.description}</p>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[var(--text-tertiary)]">Progress</span>
          <span className={isBlocked ? 'text-amber-400' : isDone ? 'text-emerald-400' : 'text-[var(--accent-primary)]'}>
            {project.progress || 0}%
          </span>
        </div>
        <div className="h-1.5 bg-[var(--bg-muted)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isBlocked
                ? 'bg-amber-500'
                : isDone
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-light)]'
            }`}
            style={{ width: `${project.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Blocker */}
      {project.blocker && (
        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/10">
          <div className="flex items-start gap-2">
            <WarningIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200 line-clamp-2">{project.blocker}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)]">
        <span className="text-xs text-[var(--text-tertiary)]">
          {project.currentStage && `Stage: ${project.currentStage}`}
        </span>
        <ChevronRightIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
      </div>
    </Link>
  )
}

// Empty State
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="p-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto bg-[var(--bg-muted)] rounded-full flex items-center justify-center border border-[var(--border-subtle)]">
          <FolderIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {hasFilters ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-sm text-[var(--text-tertiary)]">
            {hasFilters ? 'Try adjusting your search or filters' : 'Create your first project to get started'}
          </p>
        </div>
        {hasFilters && (
          <button
            onClick={onClear}
            className="px-4 py-2 rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] text-sm font-medium border border-[var(--border-subtle)] transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-[var(--bg-muted)] rounded-xl" />
      <div className="h-12 bg-[var(--bg-muted)] rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-[var(--bg-muted)] rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// Icons
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}
