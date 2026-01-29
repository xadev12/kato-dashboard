import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Project } from '../types'
import { StatusBadge } from './StatusBadge'
import { ProgressBar } from './ProgressBar'

interface Props {
  project: Project
  taskCount?: { total: number; done: number }
}

// Memo for performance (rerender-memo)
export const ProjectCard = memo(function ProjectCard({ project, taskCount }: Props) {
  // Derive priority from progress (could be a real field)
  const getPriority = () => {
    if (project.status === 'in_progress' && project.progress < 30) return 'high'
    if (project.status === 'in_progress') return 'medium'
    return 'low'
  }

  const priority = getPriority()

  return (
    <Link to={`/projects/${project.id}`} className="block">
      <div className="card group cursor-pointer relative overflow-hidden">
        {/* Priority indicator bar */}
        {priority === 'high' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-amber-500" />
        )}
        
        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors leading-tight truncate">
                {project.name}
              </h3>
            </div>
            <StatusBadge status={project.status} />
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {project.description}
          </p>

          {/* Tags (mock data - could be real) */}
          {project.status === 'in_progress' && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-blue text-[10px]">ACTIVE</span>
              {priority === 'high' && (
                <span className="badge badge-red text-[10px]">HIGH PRIORITY</span>
              )}
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <ProgressBar value={project.progress} />
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-500">
                {project.progress}% complete
              </span>
              {taskCount && (
                <span className="text-gray-600 tabular-nums">
                  {taskCount.done}/{taskCount.total} tasks
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          {project.repo_url && (
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <a
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-blue-400 transition-colors group/link"
              >
                <svg className="w-3.5 h-3.5 group-hover/link:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="font-medium">Repository</span>
              </a>
              
              {/* Quick actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={e => e.stopPropagation()}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/[0.05] text-gray-600 hover:text-gray-400 transition-colors"
                  title="Add to favorites"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <button
                  onClick={e => e.stopPropagation()}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/[0.05] text-gray-600 hover:text-gray-400 transition-colors"
                  title="More options"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
})
