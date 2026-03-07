import { useEffect, useRef } from 'react'
import type { DrawerContent } from '../../types/now'

interface Props {
  content: DrawerContent | null
  onClose: () => void
}

export function DetailDrawer({ content, onClose }: Props) {
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!content) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [content, onClose])

  if (!content) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease' }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
        style={{
          background: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideInRight 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-4 backdrop-blur-xl"
          style={{
            background: 'rgba(250, 249, 247, 0.9)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="badge badge-neutral text-[10px]"
            >
              {content.type}
            </span>
            <h2
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {content.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="icon-btn flex-shrink-0"
            aria-label="Close drawer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {content.type === 'task' && <TaskDetail data={content.data} />}
          {content.type === 'project' && <ProjectDrawerDetail data={content.data} />}
          {content.type === 'agent' && <AgentDetail data={content.data} />}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string | React.ReactElement }) {
  return (
    <div className="flex justify-between items-start py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="text-sm text-right" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function TaskDetail({ data }: { data: Record<string, unknown> }) {
  return (
    <>
      <div className="card p-4 space-y-1">
        <DetailRow label="Project" value={String(data.projectName || '—')} />
        <DetailRow label="Status" value={String(data.status || data.column || '—')} />
        <DetailRow label="Assigned Agent" value={String(data.assignedAgent || 'Unassigned')} />
        <DetailRow label="Time Active" value={String(data.timeActive || '—')} />
        {Boolean(data.blockerReason) && (
          <DetailRow
            label="Blocker"
            value={<span style={{ color: 'var(--error)' }}>{String(data.blockerReason)}</span>}
          />
        )}
      </div>

      {Boolean(data.context) && (
        <div className="card p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Context
          </h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{String(data.context)}</p>
        </div>
      )}
    </>
  )
}

function ProjectDrawerDetail({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="card p-4 space-y-1">
      <DetailRow label="Stage" value={String(data.stage || data.currentStage || '—')} />
      <DetailRow label="Progress" value={`${data.progress || 0}%`} />
      <DetailRow label="Tasks" value={`${data.completedTasks || 0}/${data.totalTasks || 0}`} />
      <DetailRow label="Status" value={String(data.status || '—')} />
      {Boolean(data.blocker) && (
        <DetailRow
          label="Blocker"
          value={<span style={{ color: 'var(--error)' }}>{String(data.blocker)}</span>}
        />
      )}
    </div>
  )
}

function AgentDetail({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="card p-4 space-y-1">
      <DetailRow label="Role" value={String(data.role || '—')} />
      <DetailRow label="Status" value={String(data.status || 'idle')} />
      <DetailRow label="Current Task" value={String(data.currentTask || 'None')} />
      <DetailRow label="Today's Tasks" value={String(data.todayTasks || 0)} />
      <DetailRow label="Today's Cost" value={`$${Number(data.todayCost || 0).toFixed(2)}`} />
    </div>
  )
}
