import { useState, useMemo } from 'react'
import type { ProgressEvent, EventType } from '../../types/now'

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bg: string; icon: string }> = {
  pipeline: { label: 'Pipeline', color: 'var(--accent-primary)', bg: 'rgba(139, 115, 85, 0.08)', icon: '→' },
  agent:    { label: 'Agent', color: 'var(--warning)', bg: 'var(--warning-muted)', icon: '⚡' },
  cost:     { label: 'Cost', color: 'var(--error)', bg: 'var(--error-muted)', icon: '$' },
  decision: { label: 'Decision', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.08)', icon: '?' },
  github:   { label: 'GitHub', color: 'var(--text-secondary)', bg: 'var(--bg-muted)', icon: '⊙' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface Props {
  events: ProgressEvent[]
}

export function ProgressLog({ events }: Props) {
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(new Set())

  const filteredEvents = useMemo(() => {
    if (activeFilters.size === 0) return events
    return events.filter(e => activeFilters.has(e.type))
  }, [events, activeFilters])

  const toggleFilter = (type: EventType) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  if (events.length === 0) {
    return (
      <div
        className="p-4 rounded-lg text-center"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map(type => {
          const config = EVENT_TYPE_CONFIG[type]
          const isActive = activeFilters.has(type)
          const count = events.filter(e => e.type === type).length
          if (count === 0) return null

          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className="text-[10px] px-2 py-1 rounded-full font-medium transition-all duration-200"
              style={{
                background: isActive ? config.bg : 'var(--bg-tertiary)',
                color: isActive ? config.color : 'var(--text-muted)',
                border: `1px solid ${isActive ? config.color + '33' : 'var(--border-subtle)'}`,
              }}
            >
              {config.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Event list */}
      <div className="space-y-0.5">
        {filteredEvents.slice(0, 20).map(event => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}

function EventRow({ event }: { event: ProgressEvent }) {
  const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.pipeline

  return (
    <div
      className="flex items-start gap-2 py-1.5 px-2 rounded transition-colors duration-200 hover:bg-[var(--bg-tertiary)]"
    >
      <span className="text-[10px] w-12 flex-shrink-0 text-right" style={{ color: 'var(--text-muted)' }}>
        {timeAgo(event.timestamp)}
      </span>

      <span
        className="text-[10px] w-14 flex-shrink-0 px-1 py-0.5 rounded text-center font-medium"
        style={{ background: config.bg, color: config.color }}
      >
        {config.label.toLowerCase()}
      </span>

      <span className="text-xs flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)' }}>
        {event.title}
      </span>

      {event.projectName && (
        <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
          {event.projectName}
        </span>
      )}
    </div>
  )
}
