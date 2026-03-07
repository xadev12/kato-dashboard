import { useState } from 'react'
import type { MappedOutProject } from '../../types/now'

interface Props {
  projects: MappedOutProject[]
}

export function MappedOutWork({ projects }: Props) {
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0)

  if (totalTasks === 0) {
    return (
      <div
        className="p-4 rounded-lg text-center"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No queued tasks
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {projects.map(proj => (
        <ProjectGroup key={proj.projectId} project={proj} />
      ))}
    </div>
  )
}

function ProjectGroup({ project }: { project: MappedOutProject }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 text-left transition-colors duration-200"
        style={{ background: expanded ? 'var(--bg-tertiary)' : 'transparent' }}
      >
        <svg
          className="w-3 h-3 transition-transform duration-200 flex-shrink-0"
          style={{
            color: 'var(--text-tertiary)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-sm">{project.projectEmoji || '📦'}</span>
        <span className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
          {project.projectName}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          {project.tasks.length} task{project.tasks.length !== 1 ? 's' : ''}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 animate-fade-in">
          {project.tasks.map(task => (
            <div
              key={task.id}
              className="flex items-start gap-2 py-1.5 px-2 rounded"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div
                className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: 'var(--text-muted)' }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                  {task.title}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {task.nextStep}
                  {task.scope && ` · ${task.scope}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
