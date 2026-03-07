import { useState } from 'react'

interface Props {
  title: string
  count?: number
  defaultExpanded?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({ title, count, defaultExpanded = false, children }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <section>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 group"
        style={{ borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none' }}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 transition-transform duration-200"
            style={{
              color: 'var(--text-tertiary)',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <h3
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--text-secondary)' }}
          >
            {title}
          </h3>
          {count !== undefined && count > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
            >
              {count}
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="pt-3 pb-2 animate-fade-in">
          {children}
        </div>
      )}
    </section>
  )
}
