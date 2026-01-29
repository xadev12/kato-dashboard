import { useProjects, useTasks } from '../hooks/useProjects'
import { KanbanBoard } from '../components/KanbanBoard'
import { ActivityFeed } from '../components/ActivityFeed'

export function Dashboard() {
  const { projects, loading: projectsLoading } = useProjects()
  const { tasks, loading: tasksLoading } = useTasks()

  const loading = projectsLoading || tasksLoading

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track all of Kato's work across projects and tasks
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={projects.length} />
        <StatCard label="In Progress" value={projects.filter(p => p.status === 'in_progress').length} accent />
        <StatCard label="Tasks Done" value={tasks.filter(t => t.status === 'done').length} />
        <StatCard label="Open Tasks" value={tasks.filter(t => t.status !== 'done').length} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-24 bg-gray-800 rounded animate-pulse" />
              <div className="h-40 bg-gray-900 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard projects={projects} tasks={tasks} />
      )}

      {/* Activity Feed */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="card !p-2">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card text-center">
      <div className={`text-2xl font-bold ${accent ? 'text-blue-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
