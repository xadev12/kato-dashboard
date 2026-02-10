import { useState, useEffect } from 'react'

interface SystemTask {
  id: string
  title: string
  status: string
  lastRunAt?: string
  lastStatus?: 'ok' | 'warning' | 'error'
  nextRunAt?: string
  interval?: string
  detail?: string
}

interface SystemPanelProps {
  systemTasks: SystemTask[]
  tokenStats?: {
    todayCost: number
    tokensUsed: number
    requests: number
    inputTokens: number
    outputTokens: number
  }
}

export function SystemPanel({ systemTasks, tokenStats }: SystemPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="space-y-3">
      {/* Header — clickable to collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <SystemGearIcon className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            System Tasks
          </h3>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
          >
            {systemTasks.length}
          </span>
        </div>
        <ChevronIcon
          className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
          style={{ color: 'var(--text-tertiary)' }}
        />
      </button>

      {!collapsed && (
        <div className="space-y-2 animate-fade-in">
          {/* Token Stats Summary */}
          {tokenStats && (
            <TokenStatsSummary stats={tokenStats} />
          )}

          {/* System Task List */}
          {systemTasks.length === 0 ? (
            <div
              className="p-4 rounded-lg text-center text-xs"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
            >
              No system tasks
            </div>
          ) : (
            systemTasks.map((task) => (
              <SystemTaskRow key={task.id} task={task} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function TokenStatsSummary({ stats }: { stats: NonNullable<SystemPanelProps['tokenStats']> }) {
  const costDisplay = stats.todayCost > 0 ? `$${stats.todayCost.toFixed(2)}` : estimateCost(stats.tokensUsed)

  return (
    <div
      className="p-3 rounded-lg space-y-2"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Token Usage Today</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>{costDisplay}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatMini label="Tokens" value={formatNumber(stats.tokensUsed)} />
        <StatMini label="Requests" value={stats.requests.toString()} />
        <StatMini label="I/O Split" value={stats.inputTokens > 0 ? `${Math.round((stats.inputTokens / (stats.inputTokens + stats.outputTokens)) * 100)}% in` : 'N/A'} />
      </div>
    </div>
  )
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  )
}

function SystemTaskRow({ task }: { task: SystemTask }) {
  const [lastRunAgo, setLastRunAgo] = useState('')

  useEffect(() => {
    if (!task.lastRunAt) return

    const updateAgo = () => {
      const diff = Date.now() - new Date(task.lastRunAt!).getTime()
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) setLastRunAgo('just now')
      else if (minutes < 60) setLastRunAgo(`${minutes}m ago`)
      else {
        const hours = Math.floor(minutes / 60)
        if (hours < 24) setLastRunAgo(`${hours}h ago`)
        else setLastRunAgo(`${Math.floor(hours / 24)}d ago`)
      }
    }

    updateAgo()
    const interval = setInterval(updateAgo, 60000)
    return () => clearInterval(interval)
  }, [task.lastRunAt])

  const statusColor = getStatusColor(task.lastStatus)

  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Status indicator */}
      <div className="relative flex-shrink-0">
        <span
          className="block w-2 h-2 rounded-full"
          style={{ background: statusColor }}
        />
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          {task.lastRunAt && <span>Last run: {lastRunAgo}</span>}
          {task.interval && <span>Every {task.interval}</span>}
          {task.detail && <span>{task.detail}</span>}
        </div>
      </div>

      {/* Status badge */}
      <span
        className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px]"
        style={{
          background: task.lastStatus === 'ok' ? 'var(--success-muted)' : task.lastStatus === 'warning' ? 'var(--warning-muted)' : task.lastStatus === 'error' ? 'var(--error-muted)' : 'var(--bg-muted)',
          color: task.lastStatus === 'ok' ? 'var(--success)' : task.lastStatus === 'warning' ? 'var(--warning)' : task.lastStatus === 'error' ? 'var(--error)' : 'var(--text-tertiary)'
        }}
      >
        {task.lastStatus || task.status}
      </span>
    </div>
  )
}

function getStatusColor(status?: string): string {
  switch (status) {
    case 'ok': return 'var(--success)'
    case 'warning': return 'var(--warning)'
    case 'error': return 'var(--error)'
    default: return 'var(--text-muted)'
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function estimateCost(tokens: number): string {
  // Rough estimate: ~$3 per 1M tokens (blended input/output for Claude)
  const cost = (tokens / 1_000_000) * 3
  return `~$${cost.toFixed(2)}`
}

// Icons
function SystemGearIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ChevronIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
