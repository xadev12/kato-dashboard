/**
 * Roadmap Source Reader
 *
 * Parses ROADMAP.md to extract queue items
 */

import fs from 'fs'

const ROADMAP_PATH = '/Users/devl/clawd/ROADMAP.md'

export interface RoadmapItem {
  id: string
  feature: string
  project?: string
  description?: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'active' | 'backlog' | 'completed'
  complexity?: 'Simple' | 'Medium' | 'Complex'
  completedAt?: string
  notes?: string
}

export interface SprintInfo {
  name: string
  startDate?: string
  endDate?: string
  targets: {
    metric: string
    target: string
    deadline: string
  }[]
  philosophy?: string
}

export interface RoadmapData {
  lastUpdated?: string
  owner?: string
  sprint?: SprintInfo
  active: RoadmapItem[]
  backlog: RoadmapItem[]
  completed: RoadmapItem[]
}

/**
 * Parse a markdown table row into columns
 */
function parseTableRow(row: string): string[] {
  return row
    .split('|')
    .map(col => col.trim())
    .filter(col => col.length > 0)
}

/**
 * Parse Active table
 */
function parseActiveTable(lines: string[]): RoadmapItem[] {
  const items: RoadmapItem[] = []

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---')) continue

    const cols = parseTableRow(line)
    if (cols.length >= 5 && cols[0] !== 'ID') {
      items.push({
        id: cols[0],
        feature: cols[1],
        project: cols[2] || undefined,
        priority: (cols[3] as RoadmapItem['priority']) || 'P1',
        status: 'active',
        description: cols[4] || undefined
      })
    }
  }

  return items
}

/**
 * Parse Backlog table (different format)
 */
function parseBacklogTable(lines: string[], category?: string): RoadmapItem[] {
  const items: RoadmapItem[] = []

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---')) continue

    const cols = parseTableRow(line)
    if (cols.length >= 4 && cols[0] !== 'ID') {
      items.push({
        id: cols[0],
        feature: cols[1],
        description: cols[2] || undefined,
        complexity: cols[3] as RoadmapItem['complexity'],
        priority: 'P2',
        status: 'backlog',
        project: category
      })
    }
  }

  return items
}

/**
 * Parse Completed table
 */
function parseCompletedTable(lines: string[]): RoadmapItem[] {
  const items: RoadmapItem[] = []

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---')) continue

    const cols = parseTableRow(line)
    if (cols.length >= 4 && cols[0] !== 'ID') {
      items.push({
        id: cols[0],
        feature: cols[1],
        completedAt: cols[2] || undefined,
        notes: cols[3] || undefined,
        priority: 'P2',
        status: 'completed'
      })
    }
  }

  return items
}

/**
 * Parse sprint info from header
 */
function parseSprintInfo(content: string): SprintInfo | undefined {
  const sprintMatch = content.match(/## 60-Day Builder Sprint \(([^)]+)\)/)
  if (!sprintMatch) return undefined

  const dateRange = sprintMatch[1]
  const [startDate, endDate] = dateRange.split(' - ')

  // Parse targets table
  const targetsSection = content.match(/\| Target.*?\n\|[-|\s]+\n([\s\S]*?)\n\n/)
  const targets: SprintInfo['targets'] = []

  if (targetsSection) {
    const rows = targetsSection[1].split('\n')
    for (const row of rows) {
      const cols = parseTableRow(row)
      if (cols.length >= 3) {
        targets.push({
          metric: cols[0],
          target: cols[1],
          deadline: cols[2]
        })
      }
    }
  }

  const philosophyMatch = content.match(/\*\*Sprint philosophy:\*\* (.+)/)

  return {
    name: '60-Day Builder Sprint',
    startDate,
    endDate,
    targets,
    philosophy: philosophyMatch?.[1]
  }
}

/**
 * Parse the ROADMAP.md file
 */
export async function parseRoadmap(): Promise<RoadmapData> {
  if (!fs.existsSync(ROADMAP_PATH)) {
    console.warn(`[Sources] Roadmap not found: ${ROADMAP_PATH}`)
    return { active: [], backlog: [], completed: [] }
  }

  const content = fs.readFileSync(ROADMAP_PATH, 'utf-8')
  const lines = content.split('\n')

  // Parse metadata
  const lastUpdatedMatch = content.match(/\*\*Last updated:\*\* (.+)/)
  const ownerMatch = content.match(/\*\*Owner:\*\* (.+)/)

  // Find section boundaries
  let activeStart = -1
  let backlogStart = -1
  let completedStart = -1
  let currentCategory = ''

  const backlogCategories: { name: string; startLine: number; endLine: number }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('## Active')) {
      activeStart = i
    } else if (line.startsWith('## Backlog')) {
      backlogStart = i
    } else if (line.startsWith('## Completed')) {
      completedStart = i
    } else if (line.startsWith('### ') && backlogStart > 0 && completedStart < 0) {
      // Track backlog categories
      if (backlogCategories.length > 0) {
        backlogCategories[backlogCategories.length - 1].endLine = i
      }
      backlogCategories.push({
        name: line.replace('### ', '').trim(),
        startLine: i,
        endLine: lines.length
      })
    }
  }

  // Mark end of last backlog category
  if (backlogCategories.length > 0 && completedStart > 0) {
    backlogCategories[backlogCategories.length - 1].endLine = completedStart
  }

  // Parse sections
  const activeLines = activeStart >= 0 ? lines.slice(activeStart, backlogStart > 0 ? backlogStart : completedStart) : []
  const active = parseActiveTable(activeLines)

  // Parse backlog by category
  const backlog: RoadmapItem[] = []
  for (const cat of backlogCategories) {
    const catLines = lines.slice(cat.startLine, cat.endLine)
    const items = parseBacklogTable(catLines, cat.name)
    backlog.push(...items)
  }

  const completedLines = completedStart >= 0 ? lines.slice(completedStart) : []
  const completed = parseCompletedTable(completedLines)

  return {
    lastUpdated: lastUpdatedMatch?.[1],
    owner: ownerMatch?.[1],
    sprint: parseSprintInfo(content),
    active,
    backlog,
    completed
  }
}

/**
 * Get next items in queue (P1 priority)
 */
export async function getQueue(limit = 5): Promise<RoadmapItem[]> {
  const roadmap = await parseRoadmap()

  // Combine active items and top backlog items
  const queue = [
    ...roadmap.active,
    ...roadmap.backlog.slice(0, limit)
  ]

  return queue.slice(0, limit)
}

/**
 * Get sprint info
 */
export async function getSprintInfo(): Promise<SprintInfo | undefined> {
  const roadmap = await parseRoadmap()
  return roadmap.sprint
}
