import type { Project, Task } from '../types'
import { ProjectCard } from './ProjectCard'

interface Props {
  projects: Project[]
  tasks: Task[]
}

const columns = [
  { key: 'backlog' as const, label: 'Backlog', icon: '○' },
  { key: 'in_progress' as const, label: 'In Progress', icon: '◐' },
  { key: 'done' as const, label: 'Done', icon: '●' },
]

export function KanbanBoard({ projects, tasks }: Props) {
  const getTaskCount = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId)
    return {
      total: projectTasks.length,
      done: projectTasks.filter(t => t.status === 'done').length,
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      {columns.map(col => {
        const colProjects = projects.filter(p => p.status === col.key)
        return (
          <div key={col.key} className="space-y-3">
            {/* Column Header */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-gray-500 text-sm">{col.icon}</span>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                {col.label}
              </h2>
              <span className="ml-auto text-xs text-gray-600 tabular-nums bg-gray-800 px-2 py-0.5 rounded-full">
                {colProjects.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {colProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  taskCount={getTaskCount(project.id)}
                />
              ))}
              {colProjects.length === 0 && (
                <div className="border border-dashed border-gray-800 rounded-xl p-8 text-center">
                  <p className="text-sm text-gray-700">No projects</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
