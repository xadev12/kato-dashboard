import { useState, useMemo } from 'react'

interface HistoryOpportunity {
  id: string
  type: 'blocker' | 'ready' | 'opportunity' | 'suggestion' | 'deadline' | 'idea' | 'system'
  category?: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  project?: string
  source?: string
  action: string
  discoveredAt: string
  expiresAt: string
  status?: 'active' | 'acted' | 'dismissed' | 'expired'
  actedAt?: string
  dismissedAt?: string
}

interface HistoryTask {
  id: string
  type: string
  title: string
  project?: string
  status: string
  completedAt?: string
}

interface HistoryMetrics {
  conversionRate: number
  totalSeen: number
  totalConverted: number
  totalIgnored: number
  currentActive: number
}

interface HistoryViewProps {
  opportunities?: HistoryOpportunity[]
  completedTasks?: HistoryTask[]
  metrics?: HistoryMetrics
  actionState?: Record<string, 'acted' | 'dismissed'>
}

type DateRange = 'today' | 'week' | 'month' | 'all'
type TypeFilter = 'all' | 'acted' | 'dismissed' | 'expired' | 'completed'

export function HistoryView({ opportunities = [], completedTasks = [], metrics, actionState = {} }: HistoryViewProps) {
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  // Build unified history items
  const historyItems = useMemo(() => {
    const items: Array<{
      id: string
      kind: 'opportunity' | 'task'
      type: string
      title: string
      description: string
      project?: string
      source?: string
      status: string
      date: string
      priority?: string
    }> = []

    // Add archived opportunities (from data status or local actionState)
    for (const opp of opportunities) {
      const localStatus = actionState[opp.id]
      const effectiveStatus = localStatus || opp.status
      if (effectiveStatus === 'acted' || effectiveStatus === 'dismissed' || effectiveStatus === 'expired') {
        items.push({
          id: opp.id,
          kind: 'opportunity',
          type: opp.type,
          title: opp.title,
          description: opp.description,
          project: opp.project,
          source: opp.source,
          status: effectiveStatus,
          date: opp.actedAt || opp.dismissedAt || opp.discoveredAt,
          priority: opp.priority
        })
      }
    }

    // Add completed tasks
    for (const task of completedTasks) {
      items.push({
        id: task.id,
        kind: 'task',
        type: task.type,
        title: task.title,
        description: task.project ? `Project: ${task.project}` : 'Completed task',
        project: task.project,
        status: 'completed',
        date: task.completedAt || new Date().toISOString()
      })
    }

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return items
  }, [opportunities, completedTasks, actionState])

  // Apply filters
  const filteredItems = useMemo(() => {
    let items = historyItems

    // Date range filter
    if (dateRange !== 'all') {
      const now = Date.now()
      const cutoff = dateRange === 'today' ? now - 86400000
        : dateRange === 'week' ? now - 604800000
        : now - 2592000000 // month
      items = items.filter(item => new Date(item.date).getTime() >= cutoff)
    }

    // Type filter
    if (typeFilter !== 'all') {
      items = items.filter(item => item.status === typeFilter)
    }

    return items
  }, [historyItems, dateRange, typeFilter])

  // Compute conversion stats
  const stats = useMemo(() => {
    const localActed = Object.values(actionState).filter(s => s === 'acted').length
    const localDismissed = Object.values(actionState).filter(s => s === 'dismissed').length
    const totalConverted = (metrics?.totalConverted || 0) + localActed
    const totalIgnored = (metrics?.totalIgnored || 0) + localDismissed
    const totalSeen = metrics?.totalSeen || (totalConverted + totalIgnored + (metrics?.currentActive || 0))
    const rate = totalSeen > 0 ? Math.round((totalConverted / totalSeen) * 100) : 0

    return { totalSeen, totalConverted, totalIgnored, rate }
  }, [metrics, actionState])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>History</h2>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Past opportunities & completed tasks</p>
        </div>
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
        >
          {filteredItems.length} items
        </span>
      </div>

      {/* Conversion Metrics */}
      <div
        className="grid grid-cols-4 gap-2 p-3 rounded-xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
      >
        <MetricCell label="Seen" value={stats.totalSeen} />
        <MetricCell label="Acted" value={stats.totalConverted} color="var(--success)" />
        <MetricCell label="Ignored" value={stats.totalIgnored} color="var(--text-muted)" />
        <MetricCell label="Rate" value={`${stats.rate}%`} color="var(--accent-primary)" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Date Range */}
        <div className="flex items-center gap-1">
          {(['today', 'week', 'month', 'all'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className="px-2 py-0.5 rounded text-[10px] transition-all duration-200"
              style={{
                background: dateRange === range ? 'var(--bg-secondary)' : 'transparent',
                color: dateRange === range ? 'var(--text-primary)' : 'var(--text-tertiary)',
                border: dateRange === range ? '1px solid var(--border-subtle)' : '1px solid transparent',
                boxShadow: dateRange === range ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {range === 'all' ? 'All time' : range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div
          className="w-px h-4 self-center"
          style={{ background: 'var(--border-subtle)' }}
        />
        <div className="flex items-center gap-1">
          {(['all', 'acted', 'dismissed', 'expired', 'completed'] as TypeFilter[]).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className="px-2 py-0.5 rounded text-[10px] transition-all duration-200"
              style={{
                background: typeFilter === type ? 'var(--bg-secondary)' : 'transparent',
                color: typeFilter === type ? 'var(--text-primary)' : 'var(--text-tertiary)',
                border: typeFilter === type ? '1px solid var(--border-subtle)' : '1px solid transparent',
                boxShadow: typeFilter === type ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div
            className="p-6 rounded-xl text-center"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div
              className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-muted)' }}
            >
              <ArchiveIcon className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No history yet</h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Acted and dismissed opportunities appear here
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <HistoryItemCard key={`${item.kind}-${item.id}`} item={item} />
          ))
        )}
      </div>
    </div>
  )
}

function MetricCell({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  )
}

function HistoryItemCard({ item }: {
  item: {
    id: string
    kind: 'opportunity' | 'task'
    type: string
    title: string
    description: string
    project?: string
    source?: string
    status: string
    date: string
    priority?: string
  }
}) {
  const statusStyle = getStatusStyle(item.status)
  const kindStyle = item.kind === 'task'
    ? { bg: 'rgba(139, 115, 85, 0.08)', color: 'var(--accent-primary)', border: 'rgba(139, 115, 85, 0.15)' }
    : getTypeStyle(item.type)

  return (
    <div
      className="p-3 rounded-xl transition-all duration-300"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        opacity: 0.85
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ background: kindStyle.bg, color: kindStyle.color, border: `1px solid ${kindStyle.border}` }}
        >
          {item.kind === 'task' ? <TaskHistoryIcon className="w-3.5 h-3.5" /> : <OpportunityHistoryIcon className="w-3.5 h-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] flex-shrink-0"
              style={{ background: statusStyle.bg, color: statusStyle.color }}
            >
              {item.status}
            </span>
          </div>
          <p className="text-xs line-clamp-1 mb-1" style={{ color: 'var(--text-secondary)' }}>
            {item.description}
          </p>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>{formatRelativeDate(item.date)}</span>
            {item.project && (
              <>
                <span style={{ color: 'var(--border-medium)' }}>·</span>
                <span>{item.project}</span>
              </>
            )}
            {item.source && (
              <>
                <span style={{ color: 'var(--border-medium)' }}>·</span>
                <span>{item.source}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getStatusStyle(status: string): { bg: string; color: string } {
  switch (status) {
    case 'acted': return { bg: 'var(--success-muted)', color: 'var(--success)' }
    case 'completed': return { bg: 'var(--success-muted)', color: 'var(--success)' }
    case 'dismissed': return { bg: 'var(--bg-muted)', color: 'var(--text-muted)' }
    case 'expired': return { bg: 'var(--warning-muted)', color: 'var(--warning)' }
    default: return { bg: 'var(--bg-muted)', color: 'var(--text-tertiary)' }
  }
}

function getTypeStyle(type: string): { bg: string; color: string; border: string } {
  switch (type) {
    case 'blocker': return { bg: 'var(--error-muted)', color: 'var(--error)', border: 'rgba(184, 122, 122, 0.2)' }
    case 'ready': return { bg: 'var(--success-muted)', color: 'var(--success)', border: 'rgba(122, 158, 126, 0.2)' }
    case 'deadline': return { bg: 'var(--warning-muted)', color: 'var(--warning)', border: 'rgba(201, 169, 89, 0.2)' }
    case 'idea': return { bg: 'rgba(139, 125, 184, 0.08)', color: '#8B7DB8', border: 'rgba(139, 125, 184, 0.15)' }
    default: return { bg: 'var(--bg-muted)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' }
  }
}

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// Icons
function ArchiveIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  )
}

function TaskHistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function OpportunityHistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
