import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { Project, TaskStatus } from '../types'
import { getProject } from '../services/api'
import { useTasks } from '../hooks/useProjects'
import { updateTaskStatus } from '../services/api'
import { StatusBadge } from '../components/StatusBadge'
import { ProgressBar } from '../components/ProgressBar'
import { TaskCard } from '../components/TaskCard'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const { tasks, loading: tasksLoading } = useTasks()
  const projectTasks = tasks.filter(t => t.project_id === id)

  useEffect(() => {
    if (id) {
      getProject(id).then(p => {
        setProject(p)
        setLoading(false)
      })
    }
  }, [id])

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus)
    // Auto-refresh will pick up changes
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
        <div className="h-32 bg-gray-900 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Project not found</p>
        <Link to="/" className="text-blue-400 text-sm mt-2 inline-block hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  const tasksByStatus = {
    queued: projectTasks.filter(t => t.status === 'queued'),
    in_progress: projectTasks.filter(t => t.status === 'in_progress'),
    done: projectTasks.filter(t => t.status === 'done'),
  }

  const columns = [
    { key: 'queued' as const, label: 'Queued', icon: '○' },
    { key: 'in_progress' as const, label: 'In Progress', icon: '◐' },
    { key: 'done' as const, label: 'Done', icon: '●' },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-gray-500 hover:text-gray-300 transition-colors">
          Projects
        </Link>
        <span className="text-gray-700">/</span>
        <span className="text-gray-300">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-gray-500">{project.description}</p>
          </div>
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost text-xs flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          )}
        </div>
        <div className="mt-4">
          <ProgressBar value={project.progress} />
        </div>
      </div>

      {/* Task Kanban */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Tasks</h2>
        {tasksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {columns.map(col => (
              <div key={col.key} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-gray-500 text-sm">{col.icon}</span>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    {col.label}
                  </h3>
                  <span className="ml-auto text-xs text-gray-600 tabular-nums bg-gray-800 px-2 py-0.5 rounded-full">
                    {tasksByStatus[col.key].length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasksByStatus[col.key].map(task => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                  ))}
                  {tasksByStatus[col.key].length === 0 && (
                    <div className="border border-dashed border-gray-800 rounded-xl p-6 text-center">
                      <p className="text-xs text-gray-700">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
