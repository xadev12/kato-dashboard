import { memo, useState, useMemo } from 'react'
import { useActions, useProjects } from '../hooks/useProjects'
import type { DashboardAction } from '../types'

const priorityConfig = {
  high: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', bar: 'from-rose-500 to-rose-400', label: 'High' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: 'from-amber-500 to-amber-400', label: 'Medium' },
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'from-emerald-500 to-emerald-400', label: 'Low' }
}

const typeConfig: Record<string, { icon: string; label: string; bg: string; color: string }> = {
  decision: { icon: ' decision', label: 'Decision', bg: 'bg-violet-500/10', color: 'text-violet-400' },
  approval: { icon: ' approval', label: 'Approval', bg: 'bg-amber-500/10', color: 'text-amber-400' },
  review: { icon: ' review', label: 'Review', bg: 'bg-blue-500/10', color: 'text-blue-400' },
  completed: { icon: ' completed', label: 'Completed', bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
  note: { icon: ' note', label: 'Note', bg: 'bg-gray-500/10', color: 'text-gray-400' }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatDueTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffHours < 0) return 'Overdue'
  if (diffHours < 1) return 'Due soon'
  if (diffHours < 24) return `${diffHours}h left`
  return `${diffDays}d left`
}

export function MyActions() {
  const { pending, recent, loading } = useActions()
  const { projects } = useProjects()
  
  // Tab and filter states
  const [activeTab, setActiveTab] = useState<'pending' | 'snoozed' | 'delegated' | 'completed'>('pending')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'decision' | 'approval' | 'review'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Filter actions
  const filteredActions = useMemo(() => {
    let actions = activeTab === 'pending' ? pending : activeTab === 'completed' ? recent : []
    
    return actions.filter(action => {
      const matchesSearch = searchQuery === '' || 
        action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (action.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      
      const matchesCategory = categoryFilter === 'all' || action.type === categoryFilter
      const matchesPriority = priorityFilter === 'all' || action.priority === priorityFilter
      
      return matchesSearch && matchesCategory && matchesPriority
    })
  }, [pending, recent, activeTab, categoryFilter, priorityFilter, searchQuery])

  // Get blocked tasks from projects
  const blockedTasks = useMemo(() => {
    const blocked: { id: string; title: string; projectName: string; blockerReason: string; priority: string }[] = []
    projects.forEach(project => {
      if (project.tasks) {
        project.tasks.forEach(task => {
          if (task.blockerReason || (task.status === 'queued' && task.actionRequired)) {
            blocked.push({
              id: task.id,
              title: task.title,
              projectName: project.name,
              blockerReason: task.blockerReason || task.actionRequired || 'Awaiting direction',
              priority: task.priority || 'medium'
            })
          }
        })
      }
    })
    return blocked
  }, [projects])

  // Calculate stats
  const stats = useMemo(() => ({
    total: pending.length,
    highPriority: pending.filter(i => i.priority === 'high').length,
    decisions: pending.filter(i => i.type === 'decision').length,
    approvals: pending.filter(i => i.type === 'approval').length,
    blocked: blockedTasks.length
  }), [pending, blockedTasks])

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const selectAll = () => {
    if (selectedItems.size === filteredActions.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredActions.map(a => a.id)))
    }
  }

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">My Actions</h1>
            {stats.total > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20 animate-pulse">
                {stats.total} pending
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Pending decisions, approvals, and blocked items requiring your input
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total.toString()} icon="⚡" color="rose" />
        <StatCard label="Decisions" value={stats.decisions.toString()} icon=" decision" color="violet" />
        <StatCard label="Approvals" value={stats.approvals.toString()} icon=" approval" color="amber" />
        <StatCard label="High Priority" value={stats.highPriority.toString()} icon=" priority" color="rose" />
        <StatCard label="Blocked" value={stats.blocked.toString()} icon=" blocked" color="orange" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {(['pending', 'snoozed', 'delegated', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {tab}
            {tab === 'pending' && stats.total > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">{stats.total}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-white/[0.06] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="px-3 py-2.5 bg-[#111111] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50"
          >
            <option value="all">All Types</option>
            <option value="decision">Decisions</option>
            <option value="approval">Approvals</option>
            <option value="review">Reviews</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            className="px-3 py-2.5 bg-[#111111] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {activeTab === 'pending' && selectedItems.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-violet-500/10 rounded-xl border border-violet-500/20">
          <span className="text-sm text-violet-300">{selectedItems.size} selected</span>
          <div className="flex-1" />
          <button className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 text-sm transition-colors">
            Snooze
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 text-sm transition-colors">
            Delegate
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm transition-colors">
            Resolve All
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {activeTab === 'pending' ? 'Pending Actions' : activeTab === 'completed' ? 'Recent Activity' : activeTab}
              <span className="text-sm font-normal text-gray-500">({filteredActions.length})</span>
            </h2>
            {filteredActions.length > 0 && activeTab === 'pending' && (
              <button 
                onClick={selectAll}
                className="text-sm text-violet-400 hover:text-violet-300"
              >
                {selectedItems.size === filteredActions.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
          
          {filteredActions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {filteredActions.map((action, index) => (
                <ActionCard 
                  key={action.id} 
                  action={action} 
                  index={index}
                  isSelected={selectedItems.has(action.id)}
                  onToggleSelect={() => toggleSelection(action.id)}
                  showCheckbox={activeTab === 'pending'}
                />
              ))}
            </div>
          )}

          {/* Blocked Tasks Section */}
          {activeTab === 'pending' && blockedTasks.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                Blocked Tasks
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-xs border border-rose-500/20">
                  {blockedTasks.length}
                </span>
              </h3>
              <div className="space-y-3">
                {blockedTasks.map((task) => (
                  <BlockedTaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
            <h3 className="font-semibold text-white mb-4">Action Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Avg resolution time</span>
                <span className="text-sm text-white font-medium">~2h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Completion rate</span>
                <span className="text-sm text-emerald-400 font-medium">94%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">This week</span>
                <span className="text-sm text-white font-medium">12 actions</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
            <h3 className="font-semibold text-white mb-4">Quick Resolve</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-medium transition-colors text-left flex items-center gap-2">
                <CheckIcon className="w-4 h-4" />
                Approve & Continue
              </button>
              <button className="w-full px-4 py-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-sm font-medium transition-colors text-left flex items-center gap-2">
                <SnoozeIcon className="w-4 h-4" />
                Snooze for 24h
              </button>
              <button className="w-full px-4 py-2.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 text-sm font-medium transition-colors text-left flex items-center gap-2">
                <DelegateIcon className="w-4 h-4" />
                Delegate to Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Action Card Component
const ActionCard = memo(function ActionCard({ 
  action, 
  index,
  isSelected,
  onToggleSelect,
  showCheckbox
}: { 
  action: DashboardAction
  index: number
  isSelected: boolean
  onToggleSelect: () => void
  showCheckbox: boolean
}) {
  const priority = priorityConfig[action.priority]
  const type = typeConfig[action.type] || typeConfig.note
  const hasDueDate = action.dueAt && new Date(action.dueAt) > new Date()
  const isOverdue = action.dueAt && new Date(action.dueAt) < new Date()

  return (
    <div 
      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:border-white/[0.1] hover:shadow-lg ${
        isSelected ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/[0.06] bg-[#111111]'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Priority indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${priority.bar}`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          {showCheckbox && (
            <label className="flex items-center cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="w-4 h-4 rounded border-white/[0.2] bg-white/[0.05] text-violet-600 focus:ring-violet-500/20"
              />
            </label>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md ${type.bg} ${type.color} border border-white/[0.06] text-[10px] font-medium uppercase tracking-wide`}>
                {type.label}
              </span>
              <span className={`px-2 py-0.5 rounded-md ${priority.bg} ${priority.color} ${priority.border} border text-[10px] font-medium uppercase tracking-wide`}>
                {priority.label}
              </span>
              {hasDueDate && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium">
                  {formatDueTime(action.dueAt!)}
                </span>
              )}
              {isOverdue && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-medium">
                  Overdue
                </span>
              )}
            </div>
            
            <h3 className="font-semibold text-white text-lg group-hover:text-violet-400 transition-colors">
              {action.title}
            </h3>
            
            {action.description && (
              <p className="text-sm text-gray-400 mt-2">{action.description}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5" />
              {formatRelativeTime(action.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" />
              {action.source}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-gray-200 text-sm font-medium border border-white/[0.06] transition-colors">
              Later
            </button>
            <button className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-sm hover:shadow-md">
              Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

// Blocked Task Card
function BlockedTaskCard({ task }: { task: { id: string; title: string; projectName: string; blockerReason: string; priority: string } }) {
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium

  return (
    <div className="group relative overflow-hidden rounded-xl border border-rose-500/10 bg-rose-500/[0.02] p-4 transition-all duration-200 hover:border-rose-500/20">
      <div className="flex items-start gap-3">
        <BlockedIcon className="w-5 h-5 text-rose-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">{task.projectName}</span>
            <span className={`px-1.5 py-0.5 rounded ${priority.bg} ${priority.color} ${priority.border} border text-[10px] font-medium`}>
              {priority.label}
            </span>
          </div>
          <h4 className="font-medium text-white">{task.title}</h4>
          <p className="text-sm text-rose-400 mt-1">{task.blockerReason}</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-medium transition-colors">
          Unblock
        </button>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  }
  const colors = colorClasses[color] || colorClasses.violet

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-4 transition-all duration-200 hover:border-white/[0.1]">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-lg ${colors.text}`}>{icon}</span>
          <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</span>
        </div>
        <div className={`text-2xl font-bold ${colors.text}`}>{value}</div>
      </div>
    </div>
  )
}

// Empty State
function EmptyState() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-16 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
          <CheckIcon className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">All Clear!</h3>
          <p className="text-sm text-gray-500">
            No pending actions requiring your input. The system is running smoothly.
          </p>
        </div>
      </div>
    </div>
  )
}

// Loading State
function LoadingState() {
  return (
    <div className="space-y-6 pb-8">
      <div className="h-8 w-48 bg-white/[0.05] rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// Icon Components
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SnoozeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function DelegateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m16 11 2 2 4-4" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function BlockedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  )
}
