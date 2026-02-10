import { memo } from 'react'
import type { CompletedProject } from '../types'

interface Props {
  projects: CompletedProject[]
}

export const CompletedProjects = memo(function CompletedProjects({ projects }: Props) {
  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <p className="text-sm text-[var(--text-tertiary)]">No completed projects yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Completed Projects Archive</h2>
        <span className="text-sm text-[var(--text-tertiary)]">{projects.length} projects</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((project) => (
          <CompletedProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
})

const CompletedProjectCard = memo(function CompletedProjectCard({ project }: { project: CompletedProject }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 transition-all duration-300 hover:border-[var(--border-medium)] hover:shadow-lg">
      {/* Completed badge */}
      <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium border-b border-l border-emerald-500/20">
        Completed
      </div>
      
      {/* Header */}
      <div className="mb-4 pr-20">
        <h3 className="font-semibold text-[var(--text-primary)] text-lg group-hover:text-violet-400 transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{project.description}</p>
      </div>
      
      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
        <span className="px-2 py-1 rounded-md bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          Completed: {project.completedDate}
        </span>
        <span className="px-2 py-1 rounded-md bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          Duration: {project.duration}
        </span>
        <span className="px-2 py-1 rounded-md bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          Team: {project.teamSize}
        </span>
      </div>
      
      {/* Key Achievements */}
      <div className="mb-4">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-2 block">
          Key Achievements
        </span>
        <ul className="space-y-1">
          {project.keyAchievements.slice(0, 3).map((achievement, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span>{achievement}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Technologies */}
      <div className="mb-4">
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-2 block">
          Technologies
        </span>
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((tech) => (
            <span 
              key={tech}
              className="px-2 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
      
      {/* Impact */}
      <div className="pt-3 border-t border-[var(--border-subtle)]">
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="text-[var(--text-tertiary)]">Impact:</span> {project.impact}
        </p>
      </div>
      
      {/* Links */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[var(--border-subtle)]">
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Repository
          </a>
        )}
        {project.demoUrl && (
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Live Demo
          </a>
        )}
      </div>
    </div>
  )
})
