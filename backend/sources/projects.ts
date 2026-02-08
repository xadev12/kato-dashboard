/**
 * Project Source Reader
 *
 * Reads project status from pipeline.json files in /Users/devl/clawd/projects/
 */

import fs from 'fs'
import path from 'path'

const PROJECTS_DIR = '/Users/devl/clawd/projects'
const ARCHIVE_DIR = path.join(PROJECTS_DIR, 'archive')

export interface PipelineStage {
  status: 'pending' | 'active' | 'completed' | 'blocked'
  artifact?: string
  completedAt?: string
  startedAt?: string
  tasks?: PipelineTask[]
  blocker?: string
  reviewer?: string
  verdict?: string
  results?: string
  receipt?: string
  nextFeature?: string
  note?: string
}

export interface PipelineTask {
  id: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  assignee?: string
  completedAt?: string
  startedAt?: string
  blockedAt?: string
  blocker?: string
  result?: string
  due?: string
  notes?: string
  worktree?: string
  branch?: string
}

export interface Pipeline {
  id?: string
  projectId: string
  name: string
  description?: string
  repo?: string
  projectPath?: string
  status?: 'active' | 'completed' | 'archived'
  currentStage: string
  stageOrder?: string[]
  stages: Record<string, PipelineStage>
  metadata?: {
    createdAt?: string
    priority?: string
    complexity?: string
    source?: string
    sprintTarget?: string
    deadline?: string
    revenueTarget?: string
    sprintGoal?: boolean
  }
  updatedAt?: string
  lastAction?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'not_started' | 'in_progress' | 'blocked' | 'done'
  currentStage: string
  progress: number
  priority: string
  assignedQueen?: string
  blocker?: string
  blockerReason?: string
  deadline?: string
  repoUrl?: string
  tasks: ProjectTask[]
  recentActivity?: string
  updatedAt?: string
  createdAt?: string
}

export interface ProjectTask {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'done' | 'blocked'
  assignedAgent?: string
  completedAt?: string
  blockerReason?: string
}

/**
 * Read all pipeline.json files from projects directory
 */
export async function readAllPipelines(): Promise<Pipeline[]> {
  const pipelines: Pipeline[] = []

  if (!fs.existsSync(PROJECTS_DIR)) {
    console.warn(`[Sources] Projects directory not found: ${PROJECTS_DIR}`)
    return pipelines
  }

  const dirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'archive')

  for (const dir of dirs) {
    const pipelinePath = path.join(PROJECTS_DIR, dir.name, 'pipeline.json')
    if (fs.existsSync(pipelinePath)) {
      try {
        const content = fs.readFileSync(pipelinePath, 'utf-8')
        const pipeline = JSON.parse(content) as Pipeline
        pipeline.projectId = pipeline.projectId || dir.name
        pipelines.push(pipeline)
      } catch (err) {
        console.error(`[Sources] Failed to read ${pipelinePath}:`, err)
      }
    }
  }

  return pipelines
}

/**
 * Calculate project progress from pipeline stages
 */
function calculateProgress(pipeline: Pipeline): number {
  const stageOrder = pipeline.stageOrder || [
    'idea', 'prd', 'prd_review', 'tech_spec', 'spec_review',
    'implementation', 'qa', 'deploy', 'iterate'
  ]

  let completed = 0
  for (const stage of stageOrder) {
    const stageData = pipeline.stages[stage]
    if (stageData?.status === 'completed') {
      completed++
    } else {
      break
    }
  }

  return Math.round((completed / stageOrder.length) * 100)
}

/**
 * Map pipeline status to project status
 */
function mapStatus(pipeline: Pipeline): Project['status'] {
  const currentStage = pipeline.stages[pipeline.currentStage]

  if (currentStage?.status === 'blocked') return 'blocked'
  if (pipeline.currentStage === 'iterate' && currentStage?.status === 'completed') return 'done'
  if (currentStage?.status === 'active' || currentStage?.status === 'pending') return 'in_progress'

  // Check if all stages are completed
  const stageOrder = pipeline.stageOrder || ['idea', 'prd', 'prd_review', 'tech_spec', 'spec_review', 'implementation', 'qa', 'deploy', 'iterate']
  const allCompleted = stageOrder.every(s => pipeline.stages[s]?.status === 'completed')
  if (allCompleted) return 'done'

  return 'in_progress'
}

/**
 * Extract tasks from implementation stage
 */
function extractTasks(pipeline: Pipeline): ProjectTask[] {
  const impl = pipeline.stages['implementation']
  if (!impl?.tasks) return []

  return impl.tasks.map(t => ({
    id: t.id,
    title: t.description,
    status: t.status === 'completed' ? 'done' : t.status === 'in_progress' ? 'in_progress' : t.status === 'blocked' ? 'blocked' : 'pending',
    assignedAgent: t.assignee,
    completedAt: t.completedAt,
    blockerReason: t.blocker
  }))
}

/**
 * Find blocker in pipeline
 */
function findBlocker(pipeline: Pipeline): { blocker?: string; blockerReason?: string } {
  const currentStage = pipeline.stages[pipeline.currentStage]

  // Check stage-level blocker
  if (currentStage?.status === 'blocked') {
    return { blocker: pipeline.currentStage, blockerReason: 'Stage blocked' }
  }

  // Check task-level blockers
  const impl = pipeline.stages['implementation']
  if (impl?.tasks) {
    const blockedTask = impl.tasks.find(t => t.status === 'blocked')
    if (blockedTask) {
      return { blocker: blockedTask.id, blockerReason: blockedTask.blocker }
    }
  }

  return {}
}

/**
 * Convert pipeline to Project format
 */
export function pipelineToProject(pipeline: Pipeline): Project {
  const { blocker, blockerReason } = findBlocker(pipeline)

  return {
    id: pipeline.projectId,
    name: pipeline.name,
    description: pipeline.description || pipeline.metadata?.source,
    status: mapStatus(pipeline),
    currentStage: pipeline.currentStage,
    progress: calculateProgress(pipeline),
    priority: pipeline.metadata?.priority || 'P2',
    deadline: pipeline.metadata?.deadline,
    blocker,
    blockerReason,
    tasks: extractTasks(pipeline),
    recentActivity: pipeline.lastAction,
    updatedAt: pipeline.updatedAt,
    createdAt: pipeline.metadata?.createdAt
  }
}

/**
 * Get all projects in dashboard format
 */
export async function getProjects(): Promise<Project[]> {
  const pipelines = await readAllPipelines()
  return pipelines.map(pipelineToProject)
}

/**
 * Get active projects (in_progress or blocked)
 */
export async function getActiveProjects(): Promise<Project[]> {
  const projects = await getProjects()
  return projects.filter(p => p.status === 'in_progress' || p.status === 'blocked')
}

/**
 * Get single project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  const pipelinePath = path.join(PROJECTS_DIR, id, 'pipeline.json')

  if (!fs.existsSync(pipelinePath)) {
    // Check archive
    const archivePath = path.join(ARCHIVE_DIR, id, 'pipeline.json')
    if (fs.existsSync(archivePath)) {
      const content = fs.readFileSync(archivePath, 'utf-8')
      const pipeline = JSON.parse(content) as Pipeline
      pipeline.projectId = id
      return pipelineToProject(pipeline)
    }
    return null
  }

  const content = fs.readFileSync(pipelinePath, 'utf-8')
  const pipeline = JSON.parse(content) as Pipeline
  pipeline.projectId = id
  return pipelineToProject(pipeline)
}
