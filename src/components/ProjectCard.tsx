import { Link } from 'react-router-dom'
import type { Project } from '../types'
import { StatusBadge } from './StatusBadge'
import { ProgressBar } from './ProgressBar'

interface Props {
  project: Project
  taskCount?: { total: number; done: number }
}

export function ProjectCard({ project, taskCount }: Props) {
  return (
    <Link to={`/projects/${project.id}`} className="block">
      <div className="card group cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>

        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {project.description}
        </p>

        <ProgressBar value={project.progress} />

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-600">
            {taskCount ? `${taskCount.done}/${taskCount.total} tasks` : 'No tasks'}
          </span>
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs text-gray-600 hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          )}
        </div>
      </div>
    </Link>
  )
}
