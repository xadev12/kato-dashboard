import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = process.env.DASHBOARD_DB_PATH || path.join(__dirname, 'data', 'dashboard.db')

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Initialize database
export const db = new Database(DB_PATH)

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL')

// Initialize schema
export function initSchema(): void {
  const schemaPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')
  
  // Execute entire schema at once - better-sqlite3 handles this well
  try {
    db.exec(schema)
  } catch (err) {
    // Ignore errors for existing tables/indexes
    const errorMsg = (err as Error).message
    if (!errorMsg.includes('already exists') && !errorMsg.includes('incomplete input')) {
      console.error('Schema error:', err)
    }
  }
}

// Initialize on module load
initSchema()

// Graceful shutdown
process.on('SIGINT', () => {
  db.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  db.close()
  process.exit(0)
})
