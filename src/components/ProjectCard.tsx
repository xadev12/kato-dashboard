import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Project } from '../types'
import { ProgressBar } from './ProgressBar'

interface Props {
  project: Project
}

const priorityConfig = {
  high: { 
    color: 'text-rose-400', 
    bg: 'bg-rose-500/10', 
    border: 'border-rose-500/20',
    bar: 'from-rose-500 to-rose-400',
    label: 'High'
  },
  medium: { 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/20',
    bar: 'from-amber-500 to-amber-400',
    label: 'Medium'
  },
  low: { 
    color: 'text-gray-400', 
    bg: 'bg-gray-500/10', 
    border: 'border-gray-500/20',
    bar: 'from-emerald-500 to-emerald-400',
    label: 'Low'
  }
}

const statusConfig = {
  not_started: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: 'Not Started' },
  in_progress: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'In Progress' },
  done: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Done' }
}

const queenLabels: Record<string, string> = {
  main: 'Main',
  product: 'Product',
  devops: 'DevOps',
  business: 'Business',
  brain: 'Brain'
}

// Calculate project velocity (tasks per day)
function calculateVelocity(project: Project): number {
  if (!project.tasks || project.tasks.length === 0) return 0
  const completedTasks = project.tasks.filter(t => t.status === 'done').length
  const createdDate = new Date(project.created_at)
  const now = new Date()
  const daysElapsed = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)))
  return Math.round((completedTasks / daysElapsed) * 10) / 10
}

// Calculate ROI score (impact / effort)
function calculateROI(project: Project): string {
  const impact = project.impact || 5
  const effort = project.effort || 5
  const roi = (impact / effort).toFixed(1)
  return `${roi}x`
}

// Get ROI badge color based on score
function getROIColor(project: Project): string {
  const impact = project.impact || 5
  const effort = project.effort || 5
  const roi = impact / effort
  if (roi >= 1.5) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  if (roi >= 1.0) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
}

// Format time invested
function formatTime(hours: number | undefined): string {
  if (!hours) return '~0h'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `~${Math.round(hours)}h`
  return `~${Math.round(hours / 24)}d`
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// Task item component
const TaskItem = memo(function TaskItem({ task }: { task: any }) {
  const isDone = task.status === 'done'
  const isInProgress = task.status === 'in_progress'
  
  return (
    <div className="flex items-start gap-2 py-1.5 group/task">
      <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center text-xs ${
        isDone ? 'bg-emerald-500/20 text-emerald-400' : 
        isInProgress ? 'bg-amber-500/20 text-amber-400' : 
        'bg-gray-500/20 text-gray-500'
      }`}>
        {isDone ? '✓' : isInProgress ? '◐' : '○'}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-xs truncate block ${
          isDone ? 'text-gray-500 line-through' : 'text-gray-300'
        }`}>
          {task.title}
        </span>
        {task.assignedAgent && (
          <span className="text-[10px] text-gray-600">@{task.assignedAgent}</span>
        )}
      </div>
      {task.completed_at && (
        <span className="text-[10px] text-gray-600 tabular-nums">
          {formatDate(task.completed_at)}
        </span>
      )}
    </div>
  )
})

export const ProjectCard = memo(function ProjectCard({ project }: Props) {
  const [expanded, setExpanded] = useState(false)
  const priority = priorityConfig[project.priority]
  const status = statusConfig[project.status]
  const queenLabel = project.assignedQueen ? queenLabels[project.assignedQueen] : null
  
  const completedTasks = project.tasks?.filter(t => t.status === 'done').length || 0
  const totalTasks = project.tasks?.length || 0
  
  // Calculate metrics
  const velocity = calculateVelocity(project)
  const roi = calculateROI(project)
  const roiColorClass = getROIColor(project)
  
  // Show first 3 tasks when not expanded
  const visibleTasks = expanded ? project.tasks : project.tasks?.slice(0, 3)
  const hasMoreTasks = project.tasks && project.tasks.length > 3
  
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] transition-all duration-300 hover:border-white/[0.1] hover:shadow-lg">
      {/* Priority indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${priority.bar}`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <Link to={`/projects/${project.id}`}>
              <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors leading-tight truncate">
                {project.name}
              </h3>
            </Link>
          </div>
          <div className={`px-2 py-1 rounded-md ${status.bg} ${status.color} ${status.border} border text-[10px] font-medium uppercase tracking-wide`}>
            {status.label}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
          {project.description}
        </p>
        
        {/* Meta row: Priority + Assigned Queen */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`px-2 py-1 rounded-md ${priority.bg} ${priority.color} ${priority.border} border text-[10px] font-medium uppercase tracking-wide`}>
            {priority.label} Priority
          </span>
          {queenLabel && (
            <span className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-gray-400">
              {queenLabel}
            </span>
          )}
        </div>
        
        {/* Progress & ROI Metrics */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{project.progress}% complete</span>
            <span className="text-gray-600 tabular-nums">{completedTasks}/{totalTasks} tasks</span>
          </div>
          <ProgressBar value={project.progress} variant={project.priority} />
          
          {/* ROI & Velocity Badges - Trading Style */}
          <div className="flex items-center gap-2 pt-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${roiColorClass}`}>
              {roi} ROI
            </span>
            {velocity > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20">
                {velocity} tasks/day
              </span>
            )}
            {project.timeInvested !== undefined && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium text-gray-400 bg-white/[0.03] border border-white/[0.06]">
                {formatTime(project.timeInvested)}
              </span>
            )}
          </div>
        </div>
        
        {/* Tasks List */}
        {project.tasks && project.tasks.length > 0 && (
          <div className="border-t border-white/[0.06] pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Tasks</span>
              {hasMoreTasks && (
                <button 
                  onClick={() => setExpanded(!expanded)}
                  className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {expanded ? 'Show less' : `+${project.tasks.length - 3} more`}
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {visibleTasks?.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
        
        {/* Footer with repo link */}
        {project.repo_url && (
          <div className="border-t border-white/[0.06] mt-3 pt-3 flex items-center justify-between">
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-violet-400 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>Repository</span>
            </a>
            
            <Link 
              to={`/projects/${project.id}`}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              View details →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
})
