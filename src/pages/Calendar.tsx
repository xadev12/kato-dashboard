import { useState, useEffect, useCallback } from 'react'
import { Calendar as CalendarIcon, Clock, Filter, ChevronLeft, ChevronRight, Bell, Users, Terminal, Zap } from 'lucide-react'
import { api } from '../lib/api'
import { formatDistanceToNow } from '../lib/utils'

interface ScheduledEvent {
  id: string
  title: string
  description: string
  agentId: string
  cronExpression: string
  nextRun: string
  category: 'heartbeat' | 'sync' | 'monitor' | 'task'
  enabled: boolean
}

interface CronJob {
  id: string
  name: string
  schedule: string
  nextRun: string
  agentId: string
  enabled: boolean
}

const CATEGORIES = [
  { id: 'heartbeat', label: 'Heartbeat', icon: Bell, color: 'text-blue-400 bg-blue-400/10' },
  { id: 'sync', label: 'Sync', icon: Zap, color: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'monitor', label: 'Monitor', icon: Terminal, color: 'text-amber-400 bg-amber-400/10' },
  { id: 'task', label: 'Task', icon: Users, color: 'text-purple-400 bg-purple-400/10' },
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Calendar() {
  const [events, setEvents] = useState<ScheduledEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<'week' | 'list'>('week')
  const [filterCategories, setFilterCategories] = useState<string[]>([])

  const fetchEvents = useCallback(async () => {
    try {
      // Fetch cron jobs from backend
      const data = await api.get<CronJob[]>('/cron/jobs')
      
      // Transform to scheduled events
      const transformed: ScheduledEvent[] = data.map((job: CronJob) => ({
        id: job.id,
        title: job.name,
        description: `Scheduled job for ${job.agentId}`,
        agentId: job.agentId,
        cronExpression: job.schedule,
        nextRun: job.nextRun,
        category: categorizeJob(job.name),
        enabled: job.enabled,
      }))

      setEvents(transformed)
    } catch (err) {
      console.error('Failed to fetch events:', err)
      // Use mock data if API fails
      setEvents(getMockEvents())
    } finally {
      setLoading(false)
    }
  }, [])

  const categorizeJob = (name: string): ScheduledEvent['category'] => {
    const lower = name.toLowerCase()
    if (lower.includes('heartbeat') || lower.includes('check')) return 'heartbeat'
    if (lower.includes('sync')) return 'sync'
    if (lower.includes('monitor')) return 'monitor'
    return 'task'
  }

  const getMockEvents = (): ScheduledEvent[] => [
    {
      id: '1',
      title: 'Dashboard Auto-Sync',
      description: 'Sync dashboard data from real sources',
      agentId: 'main',
      cronExpression: '*/30 * * * *',
      nextRun: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      category: 'sync',
      enabled: true,
    },
    {
      id: '2',
      title: 'Colosseum Heartbeat',
      description: 'Monitor hackathon progress',
      agentId: 'main',
      cronExpression: '*/30 * * * *',
      nextRun: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      category: 'heartbeat',
      enabled: true,
    },
    {
      id: '3',
      title: 'Pipeline Progression',
      description: 'Check and advance pipeline stages',
      agentId: 'main',
      cronExpression: '*/15 * * * *',
      nextRun: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      category: 'task',
      enabled: true,
    },
    {
      id: '4',
      title: 'Rate Limit Monitor',
      description: 'Track API usage and quotas',
      agentId: 'main',
      cronExpression: '0 12,18 * * *',
      nextRun: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      category: 'monitor',
      enabled: true,
    },
    {
      id: '5',
      title: 'Karin Check-in',
      description: 'Morning and evening check-ins',
      agentId: 'karin',
      cronExpression: '30 8,18 * * *',
      nextRun: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      category: 'heartbeat',
      enabled: true,
    },
  ]

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [fetchEvents])

  const toggleCategory = (category: string) => {
    setFilterCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const filteredEvents = filterCategories.length
    ? events.filter(e => filterCategories.includes(e.category))
    : events

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const getWeekDays = () => {
    const start = getWeekStart(selectedDate)
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      return day
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7))
    setSelectedDate(newDate)
  }

  const formatCron = (cron: string) => {
    if (cron === '*/30 * * * *') return 'Every 30 min'
    if (cron === '*/15 * * * *') return 'Every 15 min'
    if (cron === '0 12,18 * * *') return '2x daily'
    if (cron === '30 8,18 * * *') return 'Morning & evening'
    return cron
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-emerald-400" />
              Calendar
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">View all scheduled tasks and cron jobs</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView(view === 'week' ? 'list' : 'week')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
            >
              {view === 'week' ? 'List View' : 'Week View'}
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-sm font-medium">Filter by Category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                    filterCategories.includes(cat.id)
                      ? `${cat.color} border border-current`
                      : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
          </div>
        ) : view === 'week' ? (
          <>
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-medium">
                {getWeekStart(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                {' - '}
                {new Date(getWeekStart(selectedDate).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((day, i) => {
                const date = getWeekDays()[i]
                const isToday = new Date().toDateString() === date.toDateString()
                
                return (
                  <div key={day} className="text-center">
                    <div className={`text-xs uppercase tracking-wider mb-2 ${isToday ? 'text-emerald-400' : 'text-[var(--text-tertiary)]'}`}>
                      {day}
                    </div>
                    <div className={`text-2xl font-bold mb-2 ${isToday ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
                      {date.getDate()}
                    </div>
                    <div className="min-h-[200px] space-y-2">
                      {filteredEvents
                        .filter(e => new Date(e.nextRun).getDay() === i)
                        .map(event => {
                          const cat = CATEGORIES.find(c => c.id === event.category)
                          return (
                            <div
                              key={event.id}
                              className="p-2 rounded-lg bg-white/5 border border-[var(--border-subtle)] text-left"
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                {cat && <cat.icon className={`w-3 h-3 ${cat.color.split(' ')[0]}`} />}
                                <span className="text-xs font-medium truncate">{event.title}</span>
                              </div>
                              <div className="text-[10px] text-[var(--text-tertiary)]">
                                {new Date(event.nextRun).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          /* List View */
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
              Upcoming Events ({filteredEvents.length})
            </h3>
            {filteredEvents.map(event => {
              const cat = CATEGORIES.find(c => c.id === event.category)
              const Icon = cat?.icon || CalendarIcon
              const colorClass = cat?.color || 'text-[var(--text-secondary)] bg-gray-400/10'
              
              return (
                <div
                  key={event.id}
                  className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] p-4 flex items-center gap-4"
                >
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-[var(--text-tertiary)]">{event.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-[var(--text-secondary)]">
                        @{event.agentId}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {formatCron(event.cronExpression)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-sm text-emerald-400">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(event.nextRun)}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-1">
                      {new Date(event.nextRun).toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
