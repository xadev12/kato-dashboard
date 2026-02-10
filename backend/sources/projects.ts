/**
 * Project Source Reader
 *
 * Reads project status from pipeline.json files in /Users/devl/clawd/projects/
 */

import fs from 'fs'
import path from 'path'

const PROJECTS_DIR = '/Users/devl/clawd/projects'
const HACKATHON_DIR = '/Users/devl/clawd/hackathon'
const ARCHIVE_DIR = path.join(PROJECTS_DIR, 'archive')

// Simple TTL cache to avoid re-reading filesystem on every request
const CACHE_TTL_MS = 30000 // 30 seconds
let cachedPipelines: Pipeline[] | null = null
let cacheTimestamp = 0

function isCacheValid(): boolean {
  return cachedPipelines !== null && (Date.now() - cacheTimestamp) < CACHE_TTL_MS
}

function setCache(pipelines: Pipeline[]): void {
  cachedPipelines = pipelines
  cacheTimestamp = Date.now()
}

function invalidateCache(): void {
  cachedPipelines = null
  cacheTimestamp = 0
}

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
 * Recursively find all pipeline.json files in a directory
 */
function findPipelineFiles(dir: string, exclude: string[] = []): string[] {
  const files: string[] = []
  
  if (!fs.existsSync(dir)) return files
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    if (entry.isDirectory() && !exclude.includes(entry.name)) {
      const fullPath = path.join(dir, entry.name)
      const pipelinePath = path.join(fullPath, 'pipeline.json')
      
      // Check if this directory has a pipeline.json
      if (fs.existsSync(pipelinePath)) {
        files.push(pipelinePath)
      }
      
      // Recurse into subdirectories
      files.push(...findPipelineFiles(fullPath, exclude))
    }
  }
  
  return files
}

/**
 * Read all pipeline.json files from projects directory (recursively)
 * Uses 30-second TTL cache to avoid filesystem thrashing
 */
export async function readAllPipelines(): Promise<Pipeline[]> {
  // Return cached data if still valid
  if (isCacheValid() && cachedPipelines) {
    console.log('[Sources] Returning cached pipelines (TTL valid)')
    return cachedPipelines
  }

  const pipelines: Pipeline[] = []

  // Recursively read from projects directory
  if (fs.existsSync(PROJECTS_DIR)) {
    const pipelineFiles = findPipelineFiles(PROJECTS_DIR, ['archive', 'node_modules', '.git'])
    
    for (const pipelinePath of pipelineFiles) {
      try {
        const content = fs.readFileSync(pipelinePath, 'utf-8')
        const pipeline = JSON.parse(content) as Pipeline
        // Use parent directory name as project ID if not specified
        const dirName = path.basename(path.dirname(pipelinePath))
        pipeline.projectId = pipeline.projectId || dirName
        pipelines.push(pipeline)
      } catch (err) {
        console.error(`[Sources] Failed to read ${pipelinePath}:`, err)
      }
    }
  } else {
    console.warn(`[Sources] Projects directory not found: ${PROJECTS_DIR}`)
  }

  // Also check hackathon directory (for backwards compatibility)
  if (fs.existsSync(HACKATHON_DIR)) {
    const hackathonFiles = findPipelineFiles(HACKATHON_DIR, ['node_modules', '.git'])
    
    for (const pipelinePath of hackathonFiles) {
      try {
        const content = fs.readFileSync(pipelinePath, 'utf-8')
        const pipeline = JSON.parse(content) as Pipeline
        const dirName = path.basename(path.dirname(pipelinePath))
        pipeline.projectId = pipeline.projectId || dirName
        pipelines.push(pipeline)
      } catch (err) {
        console.error(`[Sources] Failed to read ${pipelinePath}:`, err)
      }
    }
  }

  // Update cache
  setCache(pipelines)
  console.log(`[Sources] Cached ${pipelines.length} pipelines`)
  
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
/**
 * Recursively find a project by ID
 */
function findProjectById(dir: string, id: string, exclude: string[] = []): string | null {
  if (!fs.existsSync(dir)) return null
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    if (entry.isDirectory() && !exclude.includes(entry.name)) {
      const fullPath = path.join(dir, entry.name)
      
      // Check if this directory matches the ID and has pipeline.json
      if (entry.name === id) {
        const pipelinePath = path.join(fullPath, 'pipeline.json')
        if (fs.existsSync(pipelinePath)) {
          return pipelinePath
        }
      }
      
      // Recurse into subdirectories
      const found = findProjectById(fullPath, id, exclude)
      if (found) return found
    }
  }
  
  return null
}

export async function getProject(id: string): Promise<Project | null> {
  // Search recursively in projects directory
  const projectPath = findProjectById(PROJECTS_DIR, id, ['archive', 'node_modules', '.git'])
  if (projectPath) {
    const content = fs.readFileSync(projectPath, 'utf-8')
    const pipeline = JSON.parse(content) as Pipeline
    pipeline.projectId = id
    return pipelineToProject(pipeline)
  }

  // Search recursively in hackathon directory (backwards compatibility)
  const hackathonPath = findProjectById(HACKATHON_DIR, id, ['node_modules', '.git'])
  if (hackathonPath) {
    const content = fs.readFileSync(hackathonPath, 'utf-8')
    const pipeline = JSON.parse(content) as Pipeline
    pipeline.projectId = id
    return pipelineToProject(pipeline)
  }

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

// Export cache control for admin/debug endpoints
export { invalidateCache as clearProjectCache }
