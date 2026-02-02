/**
 * Memory Collector
 * Watches MEMORY.md files for changes
 * Updates agent memory freshness and extracts key information
 */

import { db } from '../db.js'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Path to memory files
const OPENCLAW_HOME = process.env.OPENCLAW_HOME || '/Users/devl/clawd'
const MEMORY_FILE = path.join(OPENCLAW_HOME, 'MEMORY.md')
const AGENTS_FILE = path.join(OPENCLAW_HOME, 'AGENTS.md')
const MEMORY_DIR = path.join(OPENCLAW_HOME, 'memory')
const DATA_DIR = path.join(OPENCLAW_HOME, 'kato-dashboard', 'backend', 'data')
const LAST_CHECK_FILE = path.join(DATA_DIR, '.memory-last-check')

interface MemoryEntry {
  agent_id: string
  timestamp: string
  type: 'decision' | 'observation' | 'lesson' | 'preference'
  content: string
  tags: string[]
  project_id?: string
  freshness_score: number
}

interface MemoryFileInfo {
  path: string
  agent_id: string
  lastModified: number
}

/**
 * Get file hash for change detection
 */
function getFileHash(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return crypto.createHash('md5').update(content).digest('hex')
  } catch (e) {
    return ''
  }
}

/**
 * Get last check data
 */
function getLastCheckData(): Record<string, { hash: string; timestamp: number }> {
  try {
    if (fs.existsSync(LAST_CHECK_FILE)) {
      return JSON.parse(fs.readFileSync(LAST_CHECK_FILE, 'utf-8'))
    }
  } catch (e) {
    console.error('Error reading last check data:', e)
  }
  return {}
}

/**
 * Save last check data
 */
function saveLastCheckData(data: Record<string, { hash: string; timestamp: number }>): void {
  try {
    fs.writeFileSync(LAST_CHECK_FILE, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('Error saving last check data:', e)
  }
}

/**
 * Parse MEMORY.md for structured entries
 */
function parseMemoryFile(filePath: string, agentId: string): MemoryEntry[] {
  const entries: MemoryEntry[] = []
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    
    let currentEntry: Partial<MemoryEntry> | null = null
    let currentContent: string[] = []
    
    for (const line of lines) {
      // Look for entry headers (e.g., "### Decision: " or "- **Observation**: ")
      const decisionMatch = line.match(/(?:###|-)\s*\*?\*?(Decision|Observation|Lesson|Preference)\*?\*?:?\s*(.+)/i)
      
      if (decisionMatch) {
        // Save previous entry
        if (currentEntry && currentContent.length > 0) {
          entries.push({
            agent_id: agentId,
            timestamp: currentEntry.timestamp || new Date().toISOString(),
            type: currentEntry.type!,
            content: currentContent.join('\n').trim(),
            tags: currentEntry.tags || [],
            project_id: currentEntry.project_id,
            freshness_score: 100
          })
        }
        
        // Start new entry
        currentEntry = {
          type: decisionMatch[1].toLowerCase() as any,
          timestamp: new Date().toISOString()
        }
        currentContent = [decisionMatch[2]]
      } else if (currentEntry) {
        // Continue current entry
        currentContent.push(line)
        
        // Extract tags
        const tagMatch = line.match(/tags?:\s*([\w,\s]+)/i)
        if (tagMatch) {
          currentEntry.tags = tagMatch[1].split(',').map(t => t.trim())
        }
        
        // Extract project reference
        const projectMatch = line.match(/project:\s*(\w+)/i) || line.match(/\[(\w+)\]/)
        if (projectMatch) {
          currentEntry.project_id = projectMatch[1].toLowerCase()
        }
      }
    }
    
    // Don't forget the last entry
    if (currentEntry && currentContent.length > 0) {
      entries.push({
        agent_id: agentId,
        timestamp: currentEntry.timestamp || new Date().toISOString(),
        type: currentEntry.type!,
        content: currentContent.join('\n').trim(),
        tags: currentEntry.tags || [],
        project_id: currentEntry.project_id,
        freshness_score: 100
      })
    }
    
  } catch (error) {
    console.error(`[Memory] Error parsing ${filePath}:`, error)
  }
  
  return entries
}

/**
 * Parse daily memory files
 */
function parseDailyMemoryFiles(): MemoryEntry[] {
  const entries: MemoryEntry[] = []
  
  try {
    if (!fs.existsSync(MEMORY_DIR)) return entries
    
    const files = fs.readdirSync(MEMORY_DIR)
    const mdFiles = files.filter(f => f.endsWith('.md') && f.match(/^\d{4}-\d{2}-\d{2}/))
    
    for (const file of mdFiles) {
      const filePath = path.join(MEMORY_DIR, file)
      const date = file.split('.')[0]
      
      // Skip if file is too old (> 30 days)
      const fileDate = new Date(date)
      const daysOld = (Date.now() - fileDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysOld > 30) continue
      
      const fileEntries = parseMemoryFile(filePath, 'main')
      
      // Adjust timestamps to file date
      for (const entry of fileEntries) {
        entry.timestamp = date + entry.timestamp.slice(10)
        // Decrease freshness based on age
        entry.freshness_score = Math.max(0, 100 - Math.floor(daysOld * 3))
      }
      
      entries.push(...fileEntries)
    }
    
  } catch (error) {
    console.error('[Memory] Error parsing daily files:', error)
  }
  
  return entries
}

/**
 * Record memory entries to database
 */
function recordMemoryEntries(entries: MemoryEntry[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO memory (id, agent_id, timestamp, type, content, tags, project_id, freshness_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  for (const entry of entries) {
    // Generate consistent ID based on content hash
    const id = crypto.createHash('md5').update(entry.agent_id + entry.content).digest('hex').slice(0, 16)
    
    stmt.run(
      id,
      entry.agent_id,
      entry.timestamp,
      entry.type,
      entry.content,
      JSON.stringify(entry.tags),
      entry.project_id,
      entry.freshness_score
    )
  }
  
  // Update agent memory stats
  const agentStats = db.prepare(`
    SELECT agent_id, COUNT(*) as count, MAX(timestamp) as last_updated
    FROM memory
    GROUP BY agent_id
  `).all() as any[]
  
  for (const stat of agentStats) {
    db.prepare(`
      UPDATE agents 
      SET memory_total_entries = ?,
          memory_last_updated = ?,
          memory_active_contexts = (
            SELECT COUNT(DISTINCT project_id) FROM memory 
            WHERE agent_id = ? AND freshness_score > 50
          )
      WHERE id = ?
    `).run(stat.count, stat.last_updated, stat.agent_id, stat.agent_id)
  }
}

/**
 * Extract preferences from AGENTS.md
 */
function extractPreferences(): void {
  try {
    if (!fs.existsSync(AGENTS_FILE)) return
    
    const content = fs.readFileSync(AGENTS_FILE, 'utf-8')
    
    // Look for preference sections
    const prefMatches = content.matchAll(/(?:###|##)\s*(.+?)\s*\n+([^#]+)/g)
    
    for (const match of prefMatches) {
      const section = match[1].trim()
      const content = match[2].trim()
      
      // Check if this looks like a preference
      if (section.toLowerCase().includes('preference') || 
          section.toLowerCase().includes('setting') ||
          content.includes('prefer')) {
        
        // Determine agent
        let agentId = 'main'
        if (content.includes('product')) agentId = 'product'
        if (content.includes('devops')) agentId = 'devops'
        if (content.includes('business')) agentId = 'business'
        if (content.includes('brain')) agentId = 'brain'
        
        // Check if already exists
        const existing = db.prepare(`
          SELECT id FROM preferences WHERE agent_id = ? AND category = ?
        `).get(agentId, section)
        
        if (!existing) {
          db.prepare(`
            INSERT INTO preferences (id, agent_id, category, value, priority)
            VALUES (?, ?, ?, ?, 'medium')
          `).run(crypto.randomUUID(), agentId, section, content.slice(0, 500))
        }
      }
    }
    
  } catch (error) {
    console.error('[Memory] Error extracting preferences:', error)
  }
}

/**
 * Main collection function
 */
async function collect(): Promise<void> {
  console.log('[Memory] Starting collection...')
  
  const lastCheck = getLastCheckData()
  const currentCheck: Record<string, { hash: string; timestamp: number }> = {}
  
  const allEntries: MemoryEntry[] = []
  
  // Check main MEMORY.md
  if (fs.existsSync(MEMORY_FILE)) {
    const hash = getFileHash(MEMORY_FILE)
    currentCheck[MEMORY_FILE] = { hash, timestamp: Date.now() }
    
    if (!lastCheck[MEMORY_FILE] || lastCheck[MEMORY_FILE].hash !== hash) {
      console.log('[Memory] MEMORY.md has changed, parsing...')
      const entries = parseMemoryFile(MEMORY_FILE, 'main')
      allEntries.push(...entries)
    }
  }
  
  // Check AGENTS.md for preferences
  if (fs.existsSync(AGENTS_FILE)) {
    const hash = getFileHash(AGENTS_FILE)
    currentCheck[AGENTS_FILE] = { hash, timestamp: Date.now() }
    
    if (!lastCheck[AGENTS_FILE] || lastCheck[AGENTS_FILE].hash !== hash) {
      console.log('[Memory] AGENTS.md has changed, extracting preferences...')
      extractPreferences()
    }
  }
  
  // Parse daily memory files
  const dailyEntries = parseDailyMemoryFiles()
  allEntries.push(...dailyEntries)
  
  // Record all entries
  if (allEntries.length > 0) {
    recordMemoryEntries(allEntries)
    console.log(`[Memory] Recorded ${allEntries.length} memory entries`)
  }
  
  // Update freshness scores for old entries
  db.prepare(`
    UPDATE memory 
    SET freshness_score = MAX(0, freshness_score - 1)
    WHERE freshness_score > 0 AND timestamp < datetime('now', '-1 day')
  `).run()
  
  saveLastCheckData(currentCheck)
  
  console.log('[Memory] Collection complete')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  collect().catch(console.error)
}

export { collect as collectMemoryData }
