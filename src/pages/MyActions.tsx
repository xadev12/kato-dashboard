import { memo, useMemo } from 'react'
import { useActions, useProjects } from '../hooks/useProjects'
import type { DashboardAction } from '../types'

const priorityConfig = {
  high: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', bar: 'from-rose-500 to-rose-400', label: 'High' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: 'from-amber-500 to-amber-400', label: 'Medium' },
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'from-emerald-500 to-emerald-400', label: 'Low' }
}

const typeConfig: Record<string, { icon: string; label: string; bg: string }> = {
  decision: { icon: ' decision', label: 'Decision', bg: 'bg-violet-500/10' },
  approval: { icon: ' approval', label: 'Approval', bg: 'bg-amber-500/10' },
  review: { icon: ' review', label: 'Review', bg: 'bg-blue-500/10' },
  completed: { icon: ' completed', label: 'Completed', bg: 'bg-emerald-500/10' },
  note: { icon: ' note', label: 'Note', bg: 'bg-gray-500/10' }
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

  // Calculate stats
  const stats = useMemo(() => {
    const highPriority = pending.filter(i => i.priority === 'high').length
    const mediumPriority = pending.filter(i => i.priority === 'medium').length
    const lowPriority = pending.filter(i => i.priority === 'low').length
    const decisions = pending.filter(i => i.type === 'decision').length
    const approvals = pending.filter(i => i.type === 'approval').length
    
    return { highPriority, mediumPriority, lowPriority, decisions, approvals, total: pending.length }
  }, [pending])

  // Get blocked tasks from projects
  const blockedTasks = useMemo(() => {
    const blocked: { id: string; title: string; projectName: string; blockerReason: string; priority: string }[] = []
    projects.forEach(project => {
      if (project.tasks) {
        project.tasks.forEach(task => {
          if (task.blockerReason || task.status === 'queued' && task.actionRequired) {
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
    return blocked.slice(0, 5)
  }, [projects])

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">My Actions</h1>
            {pending.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20 animate-pulse">
                {pending.length} pending
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Pending decisions, approvals, and blocked items requiring your input
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Pending" value={stats.total.toString()} icon="⚡" color="rose" />
        <StatCard label="Decisions" value={stats.decisions.toString()} icon=" decision" color="violet" />
        <StatCard label="Approvals" value={stats.approvals.toString()} icon=" approval" color="amber" />
        <StatCard label="High Priority" value={stats.highPriority.toString()} icon=" priority" color="rose" />
      </div>

      {/* Priority Distribution */}
      {pending.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-[#111111] border border-white/[0.06] rounded-xl">
          <span className="text-sm text-gray-400">Priority:</span>
          <div className="flex items-center gap-4">
            {stats.highPriority > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-sm text-rose-400 font-medium">{stats.highPriority} High</span>
              </div>
            )}
            {stats.mediumPriority > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm text-amber-400 font-medium">{stats.mediumPriority} Medium</span>
              </div>
            )}
            {stats.lowPriority > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-emerald-400 font-medium">{stats.lowPriority} Low</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Pending Actions
            <span className="text-sm font-normal text-gray-500">({pending.length})</span>
          </h2>
          
          {pending.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {pending.map((action, index) => (
                <ActionCard key={action.id} action={action} index={index} />
              ))}
            </div>
          )}

          {/* Blocked Tasks Section */}
          {blockedTasks.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                Blocked Tasks
                <span className="text-sm font-normal text-gray-500">({blockedTasks.length})</span>
              </h3>
              <div className="space-y-3">
                {blockedTasks.map((task) => (
                  <BlockedTaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Recent Activity
            <span className="text-sm font-normal text-gray-500">({recent.length})</span>
          </h2>
          
          <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
            <div className="space-y-4">
              {recent.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                recent.map((action, index) => (
                  <RecentActivityItem key={action.id} action={action} isLast={index === recent.length - 1} />
                ))
              )}
            </div>
          </div>

          {/* Quick Stats Card */}
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
        </div>
      </div>
    </div>
  )
}

// Action Card Component
const ActionCard = memo(function ActionCard({ action, index }: { action: DashboardAction; index: number }) {
  const priority = priorityConfig[action.priority]
  const type = typeConfig[action.type] || typeConfig.note
  const hasDueDate = action.dueAt && new Date(action.dueAt) > new Date()
  const isOverdue = action.dueAt && new Date(action.dueAt) < new Date()

  return (
    <div 
      className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] transition-all duration-300 hover:border-white/[0.1] hover:shadow-lg"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Priority indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${priority.bar}`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-md ${type.bg} ${type.label === 'Decision' ? 'text-violet-400' : type.label === 'Approval' ? 'text-amber-400' : 'text-gray-400'} border border-white/[0.06] text-[10px] font-medium uppercase tracking-wide`}>
                {type.label}
              </span>
              <span className={`px-2 py-0.5 rounded-md ${priority.bg} ${priority.color} ${priority.border} border text-[10px] font-medium uppercase tracking-wide`}>
                {priority.label}
              </span>
              {hasDueDate && (
                <span className={`px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium`}>
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
          </div>
        </div>

        {/* Description */}
        {action.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-400">{action.description}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatRelativeTime(action.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">{task.projectName}</span>
            <span className={`px-1.5 py-0.5 rounded ${priority.bg} ${priority.color} ${priority.border} border text-[10px] font-medium`}>
              {priority.label}
            </span>
          </div>
          <h4 className="font-medium text-white truncate">{task.title}</h4>
          <p className="text-sm text-rose-400 mt-1">⚠️ {task.blockerReason}</p>
        </div>
      </div>
    </div>
  )
}

// Recent Activity Item
function RecentActivityItem({ action, isLast }: { action: DashboardAction; isLast: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-2 h-2 rounded-full ${action.type === 'completed' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
        {!isLast && <div className="w-px h-full bg-white/[0.06] mt-2" />}
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm text-gray-300">{action.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(action.timestamp || action.createdAt)}</p>
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
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
