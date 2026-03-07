import type { CompletedItem } from '../../types/now'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

interface Props {
  items: CompletedItem[]
}

export function RecentlyCompleted({ items }: Props) {
  if (items.length === 0) {
    return (
      <div
        className="p-4 rounded-lg text-center"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No completed items in the last 7 days</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {items.slice(0, 15).map(item => (
        <div
          key={item.id}
          className="flex items-center gap-2 py-1.5 px-2 rounded"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <svg
            className="w-3 h-3 flex-shrink-0"
            style={{ color: 'var(--success)' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>

          <span className="text-xs flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </span>

          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
            {item.projectName}
          </span>

          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {item.agentName}
          </span>

          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {formatDate(item.completedAt)}
          </span>
        </div>
      ))}
    </div>
  )
}
