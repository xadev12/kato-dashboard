import { useState, useEffect, useCallback } from 'react'
import { Activity, Filter, Download, RefreshCw, ChevronDown, ChevronUp, Clock, GitCommit, Zap, Terminal, User } from 'lucide-react'
import { api } from '../lib/api'
import { formatDistanceToNow } from '../lib/utils'

interface ActivityEvent {
  id: string
  type: 'agent_action' | 'cron_run' | 'pipeline_stage' | 'deploy' | 'commit' | 'task' | 'github_webhook'
  title: string
  description: string
  agentId?: string
  projectId?: string
  metadata: Record<string, unknown>
  timestamp: string
}

interface ActivityFilters {
  agents: string[]
  projects: string[]
  types: string[]
}

const AGENTS = ['main', 'yuki', 'koji', 'sora', 'karin']
const TYPES = [
  { id: 'agent_action', label: 'Agent Actions', icon: User },
  { id: 'cron_run', label: 'Cron Jobs', icon: Clock },
  { id: 'pipeline_stage', label: 'Pipeline', icon: Zap },
  { id: 'deploy', label: 'Deploys', icon: Terminal },
  { id: 'commit', label: 'Commits', icon: GitCommit },
  { id: 'github_webhook', label: 'GitHub', icon: GitCommit },
]

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ActivityFilters>({ agents: [], projects: [], types: [] })
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  const fetchActivity = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.agents.length) params.set('agents', filters.agents.join(','))
      if (filters.projects.length) params.set('projects', filters.projects.join(','))
      if (filters.types.length) params.set('types', filters.types.join(','))

      const data = await api.get<ActivityEvent[]>(`/activity?${params.toString()}`)
      setEvents(data)
    } catch (err) {
      console.error('Failed to fetch activity:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchProjects = useCallback(async () => {
    try {
      const data = await api.get<{ id: string; name: string }[]>('/projects')
      setProjects(data)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }, [])

  useEffect(() => {
    fetchActivity()
    fetchProjects()

    // Poll every 30 seconds
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [fetchActivity, fetchProjects])

  const toggleFilter = (category: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }))
  }

  const exportToMarkdown = () => {
    const markdown = events.map(e => (
      `## ${e.title}\n` +
      `**Type:** ${e.type} | **Time:** ${new Date(e.timestamp).toLocaleString()}\n\n` +
      `${e.description}\n\n` +
      `${e.agentId ? `**Agent:** ${e.agentId}\n` : ''}` +
      `${e.projectId ? `**Project:** ${e.projectId}\n` : ''}` +
      `\n---\n`
    )).join('\n')

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-feed-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getEventIcon = (type: string) => {
    const t = TYPES.find(x => x.id === type)
    if (!t) return Activity
    return t.icon
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'deploy': return 'text-emerald-400 bg-emerald-400/10'
      case 'cron_run': return 'text-blue-400 bg-blue-400/10'
      case 'pipeline_stage': return 'text-amber-400 bg-amber-400/10'
      case 'agent_action': return 'text-purple-400 bg-purple-400/10'
      case 'commit': return 'text-gray-400 bg-gray-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-400" />
              Activity Feed
            </h1>
            <p className="text-gray-400 mt-1">Real-time tracking of everything your OpenClaw system does</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={fetchActivity}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Agent Filter */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Agents</label>
              <div className="flex flex-wrap gap-2">
                {AGENTS.map(agent => (
                  <button
                    key={agent}
                    onClick={() => toggleFilter('agents', agent)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      filters.agents.includes(agent)
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {agent}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Filter */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Projects</label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => toggleFilter('projects', project.id)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      filters.projects.includes(project.id)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Event Types</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map(type => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggleFilter('types', type.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                        filters.types.includes(type.id)
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-12 text-center">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No activity yet</h3>
            <p className="text-gray-500">Activity will appear here as your agents work</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const Icon = getEventIcon(event.type)
              const colorClass = getEventColor(event.type)
              const isExpanded = expandedEvent === event.id

              return (
                <div
                  key={event.id}
                  className="bg-[#111111] rounded-xl border border-white/[0.06] overflow-hidden hover:border-white/[0.1] transition-colors"
                >
                  <button
                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                    className="w-full p-4 flex items-start gap-4 text-left"
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-gray-200">{event.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{event.description}</p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(event.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        {event.agentId && (
                          <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400">
                            @{event.agentId}
                          </span>
                        )}
                        {event.projectId && (
                          <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400">
                            {event.projectId}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400 uppercase">
                          {event.type}
                        </span>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/[0.06]">
                      <div className="bg-[#0a0a0a] rounded-lg p-4 mt-2">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Metadata</h4>
                        <pre className="text-xs text-gray-400 overflow-x-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        <span>ID: {event.id}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
