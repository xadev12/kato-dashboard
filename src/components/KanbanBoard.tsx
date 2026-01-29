import { memo, useMemo } from 'react'
import type { Project, Task } from '../types'
import { ProjectCard } from './ProjectCard'

interface Props {
  projects: Project[]
  tasks: Task[]
}

const columns = [
  { 
    key: 'backlog' as const, 
    label: 'Backlog', 
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    color: 'text-gray-500'
  },
  { 
    key: 'in_progress' as const, 
    label: 'In Progress', 
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'text-blue-500'
  },
  { 
    key: 'done' as const, 
    label: 'Done', 
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-emerald-500'
  },
]

export const KanbanBoard = memo(function KanbanBoard({ projects, tasks }: Props) {
  // Build task count map once (js-index-maps)
  const taskCountMap = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>()
    projects.forEach(p => {
      const projectTasks = tasks.filter(t => t.project_id === p.id)
      map.set(p.id, {
        total: projectTasks.length,
        done: projectTasks.filter(t => t.status === 'done').length,
      })
    })
    return map
  }, [projects, tasks])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((col, colIndex) => {
        const colProjects = projects.filter(p => p.status === col.key)
        return (
          <div 
            key={col.key} 
            className="space-y-4 animate-fade-in"
            style={{ animationDelay: `${colIndex * 50}ms` }}
          >
            {/* Refined Column Header */}
            <div className="column-header">
              <div className="flex items-center gap-2">
                <div className={col.color}>
                  {col.icon}
                </div>
                <span className="text-gray-400">
                  {col.label}
                </span>
              </div>
              <span className="text-gray-600 tabular-nums">
                {colProjects.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {colProjects.map((project, idx) => (
                <div 
                  key={project.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(colIndex * 50) + (idx * 30)}ms` }}
                >
                  <ProjectCard
                    project={project}
                    taskCount={taskCountMap.get(project.id)}
                  />
                </div>
              ))}
              {colProjects.length === 0 && (
                <div className="border border-dashed border-white/[0.06] rounded-xl p-8 text-center">
                  <div className="space-y-2">
                    <div className={`w-8 h-8 mx-auto ${col.color} opacity-20`}>
                      {col.icon}
                    </div>
                    <p className="text-xs text-gray-600">No projects</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})
