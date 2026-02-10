import { useState, useMemo } from 'react'

export interface ActionItem {
  id: string
  type: 'opportunity' | 'blocker' | 'p0' | 'decision'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  project?: string
  source?: string
  createdAt: string
  snoozedUntil?: string
  status: 'pending' | 'snoozed' | 'dismissed' | 'done'
  doneAt?: string
  dismissedAt?: string
}

interface ActionsPanelProps {
  opportunities?: Array<{
    id: string
    type: string
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    project?: string
    source?: string
    action: string
    discoveredAt: string
    status?: string
  }>
  blockedProjects?: Array<{
    id: string
    name: string
    blocker: string | null
    priority: string
  }>
  katoTasks?: Array<{
    id: string
    type: string
    title: string
    project?: string
    status: string
    reason?: string
  }>
}

type ViewMode = 'active' | 'snoozed' | 'history'

export function ActionsPanel({ opportunities = [], blockedProjects = [], katoTasks = [] }: ActionsPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('active')
  const [actionState, setActionState] = useState<Record<string, { status: 'snoozed' | 'dismissed' | 'done'; at: string }>>({})

  // Build unified action items from various sources
  const allActions = useMemo(() => {
    const items: ActionItem[] = []

    // From opportunities: blockers and high-priority items requiring action
    for (const opp of opportunities) {
      if (opp.status === 'acted' || opp.status === 'dismissed' || opp.status === 'expired') continue
      if (opp.type === 'blocker' || opp.priority === 'high' || opp.type === 'ready') {
        items.push({
          id: `opp-${opp.id}`,
          type: opp.type === 'blocker' ? 'blocker' : 'opportunity',
          priority: opp.priority,
          title: opp.title,
          description: opp.description,
          project: opp.project,
          source: opp.source,
          createdAt: opp.discoveredAt,
          status: 'pending',
        })
      }
    }

    // From blocked projects
    for (const proj of blockedProjects) {
      items.push({
        id: `blocked-${proj.id}`,
        type: 'blocker',
        priority: 'high',
        title: `Unblock: ${proj.name}`,
        description: proj.blocker || 'Project is blocked',
        project: proj.name,
        source: 'Project',
        createdAt: new Date().toISOString(),
        status: 'pending',
      })
    }

    // From kato tasks: planned items (P0 waiting to start)
    for (const task of katoTasks) {
      if (task.type === 'planned') {
        items.push({
          id: `task-${task.id}`,
          type: 'p0',
          priority: 'medium',
          title: task.title,
          description: task.reason || 'Planned task awaiting start',
          project: task.project,
          source: 'Queue',
          createdAt: new Date().toISOString(),
          status: 'pending',
        })
      }
    }

    return items
  }, [opportunities, blockedProjects, katoTasks])

  // Apply local action state
  const categorizedActions = useMemo(() => {
    const active: ActionItem[] = []
    const snoozed: ActionItem[] = []
    const history: ActionItem[] = []

    for (const item of allActions) {
      const localState = actionState[item.id]
      if (localState) {
        if (localState.status === 'snoozed') {
          // Check if snooze has expired (1 hour)
          const snoozeExpiry = new Date(localState.at).getTime() + 3600000
          if (Date.now() > snoozeExpiry) {
            active.push({ ...item, status: 'pending' })
          } else {
            snoozed.push({ ...item, status: 'snoozed', snoozedUntil: new Date(snoozeExpiry).toISOString() })
          }
        } else {
          history.push({ ...item, status: localState.status, dismissedAt: localState.at, doneAt: localState.at })
        }
      } else {
        active.push(item)
      }
    }

    // Sort: blockers first, then by priority
    const sortFn = (a: ActionItem, b: ActionItem) => {
      if (a.type === 'blocker' && b.type !== 'blocker') return -1
      if (a.type !== 'blocker' && b.type === 'blocker') return 1
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
    }

    active.sort(sortFn)
    snoozed.sort(sortFn)
    history.sort((a, b) => new Date(b.doneAt || b.dismissedAt || '').getTime() - new Date(a.doneAt || a.dismissedAt || '').getTime())

    return { active, snoozed, history }
  }, [allActions, actionState])

  const handleDone = (id: string) => {
    setActionState(prev => ({ ...prev, [id]: { status: 'done', at: new Date().toISOString() } }))
  }

  const handleSnooze = (id: string) => {
    setActionState(prev => ({ ...prev, [id]: { status: 'snoozed', at: new Date().toISOString() } }))
  }

  const handleDismiss = (id: string) => {
    setActionState(prev => ({ ...prev, [id]: { status: 'dismissed', at: new Date().toISOString() } }))
  }

  const currentItems = viewMode === 'active'
    ? categorizedActions.active
    : viewMode === 'snoozed'
    ? categorizedActions.snoozed
    : categorizedActions.history

  const getTypeIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'blocker': return <BlockerActionIcon className="w-4 h-4" />
      case 'opportunity': return <OpportunityActionIcon className="w-4 h-4" />
      case 'p0': return <P0Icon className="w-4 h-4" />
      case 'decision': return <DecisionIcon className="w-4 h-4" />
    }
  }

  const getTypeStyle = (type: ActionItem['type']) => {
    switch (type) {
      case 'blocker': return { bg: 'var(--error-muted)', color: 'var(--error)', border: 'rgba(184, 122, 122, 0.2)' }
      case 'opportunity': return { bg: 'rgba(139, 115, 85, 0.08)', color: 'var(--accent-primary)', border: 'rgba(139, 115, 85, 0.15)' }
      case 'p0': return { bg: 'var(--warning-muted)', color: 'var(--warning)', border: 'rgba(201, 169, 89, 0.2)' }
      case 'decision': return { bg: 'rgba(139, 125, 184, 0.08)', color: '#8B7DB8', border: 'rgba(139, 125, 184, 0.15)' }
    }
  }

  const getPriorityColor = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'high': return 'var(--error)'
      case 'medium': return 'var(--warning)'
      case 'low': return 'var(--text-tertiary)'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Actions</h2>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {viewMode === 'active' ? 'Items requiring your attention' : viewMode === 'snoozed' ? 'Snoozed for later' : 'Completed & dismissed'}
          </p>
        </div>
        {categorizedActions.active.length > 0 && viewMode === 'active' && (
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'var(--error-muted)', color: 'var(--error)', border: '1px solid rgba(184, 122, 122, 0.2)' }}
          >
            {categorizedActions.active.length}
          </span>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        {(['active', 'snoozed', 'history'] as ViewMode[]).map((mode) => {
          const count = mode === 'active' ? categorizedActions.active.length
            : mode === 'snoozed' ? categorizedActions.snoozed.length
            : categorizedActions.history.length
          const isActive = viewMode === mode

          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-2.5 py-1 rounded-lg text-xs transition-all duration-200"
              style={{
                background: isActive ? 'var(--bg-secondary)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)} ({count})
            </button>
          )
        })}
      </div>

      {/* Actions List */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {currentItems.length === 0 ? (
          <div
            className="p-6 rounded-xl text-center"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div
              className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-muted)' }}
            >
              {viewMode === 'active'
                ? <CheckActionIcon className="w-5 h-5" style={{ color: 'var(--success)' }} />
                : <ClockIcon className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              }
            </div>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              {viewMode === 'active' ? 'All clear' : viewMode === 'snoozed' ? 'Nothing snoozed' : 'No history yet'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {viewMode === 'active' ? 'No pending actions right now' : viewMode === 'snoozed' ? 'Snoozed items appear here' : 'Completed and dismissed items appear here'}
            </p>
          </div>
        ) : (
          currentItems.map((item) => {
            const typeStyle = getTypeStyle(item.type)
            const isHistory = viewMode === 'history'

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl transition-all duration-300"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: isHistory ? 0.7 : 1
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` }}
                  >
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                      <span className="text-[10px] uppercase flex-shrink-0" style={{ color: getPriorityColor(item.priority) }}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.project && (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.project}</span>
                      )}
                      {item.source && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
                        >
                          {item.source}
                        </span>
                      )}
                      {isHistory && item.status && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px]"
                          style={{
                            background: item.status === 'done' ? 'var(--success-muted)' : 'var(--bg-muted)',
                            color: item.status === 'done' ? 'var(--success)' : 'var(--text-muted)'
                          }}
                        >
                          {item.status}
                        </span>
                      )}
                      {viewMode === 'snoozed' && item.snoozedUntil && (
                        <span className="text-[10px]" style={{ color: 'var(--warning)' }}>
                          until {new Date(item.snoozedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {viewMode === 'active' && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleDone(item.id)}
                          className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
                          style={{ background: 'var(--success-muted)', color: 'var(--success)', border: '1px solid rgba(122, 158, 126, 0.2)' }}
                        >
                          Done
                        </button>
                        <button
                          onClick={() => handleSnooze(item.id)}
                          className="px-3 py-1 rounded-lg text-[11px] transition-all duration-200"
                          style={{ background: 'var(--warning-muted)', color: 'var(--warning)', border: '1px solid rgba(201, 169, 89, 0.2)' }}
                        >
                          Later
                        </button>
                        <button
                          onClick={() => handleDismiss(item.id)}
                          className="px-3 py-1 rounded-lg text-[11px] transition-all duration-200"
                          style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// Icons
function BlockerActionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function OpportunityActionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function P0Icon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function DecisionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function CheckActionIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ClockIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
