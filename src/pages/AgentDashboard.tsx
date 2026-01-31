import { memo, useMemo, useState } from 'react'
import { useProjects, useAgents, useDashboardMeta } from '../hooks/useProjects'
import { ProjectCard } from '../components/ProjectCard'
import { AgentStatusCard } from '../components/AgentStatusCard'
import { WorkerQueuePanel } from '../components/WorkerQueuePanel'
import { GlobalStatsPanel } from '../components/GlobalStatsPanel'
import { SearchBar } from '../components/SearchBar'
import type { QueenType } from '../types'

type FilterType = 'all' | 'in_progress' | 'done' | 'not_started'

export function AgentDashboard() {
  const { projects, loading: projectsLoading } = useProjects()
  const { queens, workers, loading: agentsLoading } = useAgents()
  const { meta, lastUpdated, loading: metaLoading } = useDashboardMeta()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterType>('all')
  const [agentFilter, setAgentFilter] = useState<QueenType | null>(null)

  const loading = projectsLoading || agentsLoading || metaLoading

  // Filter projects based on search, status, and agent
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

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    if (agentFilter) {
      filtered = filtered.filter(p => p.assignedQueen === agentFilter)
    }

    return filtered
  }, [projects, searchQuery, statusFilter, agentFilter])

  // Active queen agents count
  const activeQueens = queens.filter(q => q.status === 'active').length

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Agent Coordination</h1>
              <span className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20">
                v2.0
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Real-time multi-agent task tracking and project coordination
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </div>
        </div>

        {/* Global Stats */}
        <GlobalStatsPanel meta={meta} lastUpdated={lastUpdated} />
      </div>

      {/* Agent Status Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>🤖</span> Queen Agents
            {activeQueens > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">
                {activeQueens} active
              </span>
            )}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {queens.map(agent => (
            <AgentStatusCard key={agent.id} agent={agent} />
          ))}
          {queens.length === 0 && !loading && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p>No agents configured</p>
            </div>
          )}
        </div>
      </div>

      {/* Worker Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WorkerQueuePanel workers={workers} />
        </div>
        
        {/* Quick Actions or Info Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">💡</span>
              <h3 className="font-semibold text-white">Coordination Notes</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-400">
              <p>
                <span className="text-violet-400 font-medium">Queen Agents</span> are primary coordinators that manage projects and delegate tasks.
              </p>
              <p>
                <span className="text-amber-400 font-medium">Worker Queue</span> shows specialists waiting for task assignment.
              </p>
              <p>
                <span className="text-emerald-400 font-medium">Live Updates</span> refresh automatically every 5-10 seconds.
              </p>
            </div>
            
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/[0.06]">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{queens.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500">Queens</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{workers.active.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500">Active Workers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{workers.queue.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500">Queued</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="space-y-6">
        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>📁</span> Projects
              <span className="text-sm font-normal text-gray-500">
                ({filteredProjects.length} of {projects.length})
              </span>
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
              {/* Status filters */}
              <FilterButton
                active={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
                label="All"
                count={projects.length}
              />
              <FilterButton
                active={statusFilter === 'in_progress'}
                onClick={() => setStatusFilter('in_progress')}
                label="Active"
                count={projects.filter(p => p.status === 'in_progress').length}
                accent
              />
              <FilterButton
                active={statusFilter === 'done'}
                onClick={() => setStatusFilter('done')}
                label="Done"
                count={projects.filter(p => p.status === 'done').length}
              />
              
              <div className="w-px h-6 bg-white/[0.1] mx-1" />
              
              {/* Agent filter dropdown */}
              <select
                value={agentFilter || ''}
                onChange={(e) => setAgentFilter(e.target.value as QueenType || null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.03] text-gray-400 border border-white/[0.06] focus:outline-none focus:border-violet-500/30"
              >
                <option value="">All Agents</option>
                <option value="main">👑 Main</option>
                <option value="product">📋 Product</option>
                <option value="devops">🔧 DevOps</option>
                <option value="business">💼 Business</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <LoadingGrid />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            hasSearch={!!searchQuery || statusFilter !== 'all' || !!agentFilter}
            onClear={() => {
              setSearchQuery('')
              setStatusFilter('all')
              setAgentFilter(null)
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
    </div>
  )
}

// Filter Button Component
const FilterButton = memo(function FilterButton({
  active,
  onClick,
  label,
  count,
  accent
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
        active
          ? accent 
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            : 'bg-violet-500/10 text-violet-400 border-violet-500/30'
          : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.05] hover:text-gray-300'
      }`}
    >
      {label} <span className="opacity-60">·</span> {count}
    </button>
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
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-12 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto bg-white/[0.03] rounded-full flex items-center justify-center border border-white/[0.06]">
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">
            {hasSearch ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-sm text-gray-500">
            {hasSearch
              ? 'Try adjusting your search or filters'
              : 'Create your first project to get started'}
          </p>
        </div>
        {hasSearch && (
          <button onClick={onClear} className="px-4 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-gray-300 text-sm font-medium border border-white/[0.06] transition-colors">
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
        <div 
          key={i} 
          className="h-64 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  )
}
