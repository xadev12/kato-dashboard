import type { KanbanTask, ProjectSummary, DrawerContent } from '../../types/now'

interface Props {
  tasks: KanbanTask[]
  projects: ProjectSummary[]
  onOpenDrawer: (content: DrawerContent) => void
}

export function ActiveWork({ tasks, projects, onOpenDrawer }: Props) {
  const inProgress = tasks.filter(t => t.column === 'in_progress')
  const blocked = tasks.filter(t => t.column === 'blocked')
  const review = tasks.filter(t => t.column === 'review')

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text-secondary)' }}
        >
          Active Work
        </h2>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Project Summary Rows */}
      {projects.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {projects.map(proj => (
            <ProjectSummaryRow
              key={proj.id}
              project={proj}
              onClick={() => onOpenDrawer({
                type: 'project',
                id: proj.id,
                title: proj.name,
                data: proj as unknown as Record<string, unknown>,
              })}
            />
          ))}
        </div>
      )}

      {/* Kanban Columns */}
      {tasks.length === 0 ? (
        <EmptyKanban />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KanbanColumn
            title="In Progress"
            count={inProgress.length}
            tasks={inProgress}
            color="var(--accent-primary)"
            onTaskClick={task => onOpenDrawer({
              type: 'task',
              id: task.id,
              title: task.title,
              data: task as unknown as Record<string, unknown>,
            })}
          />
          <KanbanColumn
            title="Blocked"
            count={blocked.length}
            tasks={blocked}
            color="var(--error)"
            onTaskClick={task => onOpenDrawer({
              type: 'task',
              id: task.id,
              title: task.title,
              data: task as unknown as Record<string, unknown>,
            })}
          />
          <KanbanColumn
            title="Ready for Review"
            count={review.length}
            tasks={review}
            color="var(--success)"
            onTaskClick={task => onOpenDrawer({
              type: 'task',
              id: task.id,
              title: task.title,
              data: task as unknown as Record<string, unknown>,
            })}
          />
        </div>
      )}
    </section>
  )
}

function ProjectSummaryRow({ project, onClick }: { project: ProjectSummary; onClick: () => void }) {
  const isBlocked = project.status === 'blocked'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left"
      style={{
        background: isBlocked ? 'var(--warning-muted)' : 'var(--bg-tertiary)',
        border: `1px solid ${isBlocked ? 'rgba(201, 169, 89, 0.2)' : 'var(--border-subtle)'}`,
      }}
    >
      <span className="text-sm">{project.emoji || '📦'}</span>
      <span className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
        {project.name}
      </span>

      {/* Progress bar */}
      <div className="w-20 h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${project.progress}%`,
            background: isBlocked ? 'var(--warning)' : 'var(--accent-primary)',
          }}
        />
      </div>

      <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
        {project.completedTasks}/{project.totalTasks} tasks
      </span>

      <span
        className="text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
        style={{
          background: isBlocked ? 'rgba(201, 169, 89, 0.1)' : 'rgba(139, 115, 85, 0.06)',
          color: isBlocked ? 'var(--warning)' : 'var(--text-tertiary)',
        }}
      >
        {project.stage}
      </span>

      {project.activeWorkers > 0 && (
        <span className="text-[10px]" style={{ color: 'var(--accent-primary)' }}>
          {project.activeWorkers} worker{project.activeWorkers !== 1 ? 's' : ''}
        </span>
      )}
    </button>
  )
}

function KanbanColumn({
  title,
  count,
  tasks,
  color,
  onTaskClick,
}: {
  title: string
  count: number
  tasks: KanbanTask[]
  color: string
  onTaskClick: (task: KanbanTask) => void
}) {
  return (
    <div>
      <div className="column-header">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <span>{title}</span>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
        >
          {count}
        </span>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div
            className="p-3 rounded-lg text-center text-[10px]"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
          >
            No items
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, onClick }: { task: KanbanTask; onClick: () => void }) {
  const isBlocked = task.column === 'blocked'

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-2.5 rounded-lg transition-all duration-200 hover:shadow-sm"
      style={{
        background: isBlocked ? 'var(--error-muted)' : 'var(--bg-secondary)',
        border: `1px solid ${isBlocked ? 'rgba(184, 122, 122, 0.2)' : 'var(--border-subtle)'}`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          {task.projectName}
        </span>
      </div>

      <p
        className="text-xs font-medium line-clamp-2 mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {task.title}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {task.assignedAgent && (
            <span
              className="text-[10px] px-1 py-0.5 rounded"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
            >
              {task.assignedAgent}
            </span>
          )}
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          {task.timeActive}
        </span>
      </div>

      {isBlocked && task.blockerReason && (
        <p className="mt-1.5 text-[10px] line-clamp-1" style={{ color: 'var(--error)' }}>
          {task.blockerReason}
        </p>
      )}
    </button>
  )
}

function EmptyKanban() {
  return (
    <div
      className="p-6 rounded-lg text-center"
      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
    >
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        No active tasks
      </p>
    </div>
  )
}
