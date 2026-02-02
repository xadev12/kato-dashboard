/**
 * Collector Runner
 * Runs all data collectors in sequence
 */

import { collectGatewayData } from './gateway.js'
import { collectGitHubData } from './github.js'
import { collectSessionData } from './sessions.js'
import { collectMemoryData } from './memory.js'

async function runAllCollectors(): Promise<void> {
  console.log('🚀 Running all data collectors...\n')
  
  const results = {
    gateway: { success: false, error: null as Error | null },
    github: { success: false, error: null as Error | null },
    sessions: { success: false, error: null as Error | null },
    memory: { success: false, error: null as Error | null }
  }
  
  // Run gateway collector (highest priority)
  try {
    console.log('📡 Gateway Collector')
    console.log('─'.repeat(40))
    await collectGatewayData()
    results.gateway.success = true
    console.log('✅ Gateway collector complete\n')
  } catch (error) {
    results.gateway.error = error as Error
    console.error('❌ Gateway collector failed:', error, '\n')
  }
  
  // Run GitHub collector
  try {
    console.log('🐙 GitHub Collector')
    console.log('─'.repeat(40))
    await collectGitHubData()
    results.github.success = true
    console.log('✅ GitHub collector complete\n')
  } catch (error) {
    results.github.error = error as Error
    console.error('❌ GitHub collector failed:', error, '\n')
  }
  
  // Run session collector
  try {
    console.log('📁 Session Collector')
    console.log('─'.repeat(40))
    await collectSessionData()
    results.sessions.success = true
    console.log('✅ Session collector complete\n')
  } catch (error) {
    results.sessions.error = error as Error
    console.error('❌ Session collector failed:', error, '\n')
  }
  
  // Run memory collector
  try {
    console.log('🧠 Memory Collector')
    console.log('─'.repeat(40))
    await collectMemoryData()
    results.memory.success = true
    console.log('✅ Memory collector complete\n')
  } catch (error) {
    results.memory.error = error as Error
    console.error('❌ Memory collector failed:', error, '\n')
  }
  
  // Summary
  console.log('='.repeat(40))
  console.log('📊 Collector Summary')
  console.log('='.repeat(40))
  
  const total = Object.keys(results).length
  const successful = Object.values(results).filter(r => r.success).length
  
  for (const [name, result] of Object.entries(results)) {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${name}: ${result.success ? 'OK' : result.error?.message || 'Failed'}`)
  }
  
  console.log(`\n${successful}/${total} collectors succeeded`)
  
  if (successful < total) {
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllCollectors().catch(error => {
    console.error('Collector runner failed:', error)
    process.exit(1)
  })
}

export { runAllCollectors }
