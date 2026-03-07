import type { NeedsYouItem } from '../../types/now'

const ACTION_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  deploy_approval:    { label: 'Deploy', color: 'var(--success)', bg: 'var(--success-muted)' },
  review_signoff:     { label: 'Review', color: 'var(--accent-primary)', bg: 'rgba(139, 115, 85, 0.08)' },
  decision_pending:   { label: 'Decision', color: 'var(--warning)', bg: 'var(--warning-muted)' },
  budget_alert:       { label: 'Budget', color: 'var(--error)', bg: 'var(--error-muted)' },
  gate_failure:       { label: 'Gate Fail', color: 'var(--error)', bg: 'var(--error-muted)' },
  blocker_escalation: { label: 'Blocked', color: 'var(--error)', bg: 'var(--error-muted)' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d`
}

interface Props {
  items: NeedsYouItem[]
}

export function NeedsYou({ items }: Props) {
  if (items.length === 0) {
    return (
      <section className="mb-6">
        <SectionLabel />
        <div
          className="p-4 rounded-lg text-center"
          style={{ background: 'var(--success-muted)', border: '1px solid rgba(122, 158, 126, 0.2)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>
            All clear — nothing needs you right now
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Everything is flowing
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <SectionLabel count={items.length} />
      <div className="space-y-2">
        {items.map(item => (
          <NeedsYouCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

function SectionLabel({ count }: { count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-2 h-2 rounded-full"
        style={{
          background: count ? 'var(--error)' : 'var(--success)',
          boxShadow: count ? '0 0 6px var(--error-light)' : 'none'
        }}
      />
      <h2
        className="text-sm font-semibold uppercase tracking-wide"
        style={{ color: 'var(--text-secondary)' }}
      >
        Needs You
      </h2>
      {count !== undefined && count > 0 && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
          style={{ background: 'var(--error-muted)', color: 'var(--error)' }}
        >
          {count}
        </span>
      )}
    </div>
  )
}

function NeedsYouCard({ item }: { item: NeedsYouItem }) {
  const typeInfo = ACTION_TYPE_LABELS[item.actionType] || ACTION_TYPE_LABELS.decision_pending

  return (
    <div
      className="p-3 rounded-lg transition-all duration-200 hover:shadow-md"
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${item.actionType === 'budget_alert' ? 'rgba(184, 122, 122, 0.3)' : 'var(--border-medium)'}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap"
            style={{ background: typeInfo.bg, color: typeInfo.color }}
          >
            {typeInfo.label}
          </span>
          <span className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
            {item.projectName}
          </span>
        </div>
        <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
          Waiting: {timeAgo(item.waitingSince)}
        </span>
      </div>

      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
        {item.title}
      </p>

      {item.stage && (
        <p className="text-[10px] mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Stage: {item.stage}
        </p>
      )}

      <div className="flex items-center gap-2">
        {item.actions.map(action => (
          <button
            key={action.label}
            className={action.type === 'primary' ? 'btn btn-primary btn-sm' : action.type === 'secondary' ? 'btn btn-secondary btn-sm' : 'btn btn-ghost btn-sm'}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
