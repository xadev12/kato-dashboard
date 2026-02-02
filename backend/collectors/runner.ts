#!/usr/bin/env node
/**
 * Collector Runner
 * Runs all data collectors in sequence
 */

import { collectGitHubData } from './github.js'
import { collectGatewayData } from './gateway.js'
import { collectMemoryData } from './memory.js'
import { db } from '../db.js'

interface CollectorOptions {
  collectors?: string[]
  verbose?: boolean
}

class CollectorRunner {
  private collectors: Map<string, () => Promise<void>>

  constructor() {
    this.collectors = new Map([
      ['github', collectGitHubData],
      ['gateway', collectGatewayData],
      ['memory', collectMemoryData]
    ])
  }

  async run(options: CollectorOptions = {}): Promise<void> {
    const toRun = options.collectors || ['github', 'gateway', 'memory']
    
    console.log('🏃 Starting collector run...')
    console.log(`Collectors: ${toRun.join(', ')}`)
    console.log('')

    const results: Record<string, { success: boolean; error?: string }> = {}

    for (const name of toRun) {
      const collector = this.collectors.get(name)
      if (!collector) {
        console.warn(`⚠️ Unknown collector: ${name}`)
        continue
      }

      try {
        console.log(`\n${'='.repeat(50)}`)
        await collector()
        results[name] = { success: true }
      } catch (error) {
        console.error(`❌ Collector ${name} failed:`, error)
        results[name] = { success: false, error: (error as Error).message }
      }
    }

    // Log activity
    const successCount = Object.values(results).filter(r => r.success).length
    const totalCount = Object.keys(results).length
    
    db.prepare(`
      INSERT INTO activity (id, action_type, description, metadata)
      VALUES (?, 'agent_action', ?, ?)
    `).run(
      `collect-${Date.now()}`,
      `Data collection completed: ${successCount}/${totalCount} collectors succeeded`,
      JSON.stringify(results)
    )

    console.log(`\n${'='.repeat(50)}`)
    console.log(`✅ Collection complete: ${successCount}/${totalCount} succeeded`)
  }
}

// CLI
const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('runner')
if (isMain) {
  const args = process.argv.slice(2)
  
  // Parse arguments
  const collectors: string[] = []
  let verbose = false
  
  for (const arg of args) {
    if (arg === '--verbose' || arg === '-v') {
      verbose = true
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: runner.ts [options] [collectors...]

Collectors:
  github   Collect GitHub repository data
  gateway  Collect OpenClaw gateway sessions
  memory   Collect memory entries from .md files

Options:
  --verbose, -v    Verbose output
  --help, -h       Show this help

Examples:
  runner.ts                    Run all collectors
  runner.ts github gateway     Run specific collectors
  runner.ts --verbose          Run all with verbose output
`)
      process.exit(0)
    } else if (!arg.startsWith('-')) {
      collectors.push(arg)
    }
  }

  const runner = new CollectorRunner()
  runner.run({ collectors: collectors.length > 0 ? collectors : undefined, verbose })
    .then(() => {
      process.exit(0)
    })
    .catch(err => {
      console.error('Runner failed:', err)
      process.exit(1)
    })
}

export { CollectorRunner }
