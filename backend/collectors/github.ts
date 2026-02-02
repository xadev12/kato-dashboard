/**
 * GitHub Collector
 * Polls GitHub API for repository activity
 * Updates project progress based on commits and PRs
 */

import { db } from '../db.js'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface GitHubCommit {
  sha: string
  message: string
  author: string
  date: string
  url: string
}

interface GitHubPR {
  number: number
  title: string
  state: 'open' | 'closed'
  author: string
  created_at: string
  merged_at: string | null
}

interface RepoActivity {
  commits: GitHubCommit[]
  pullRequests: GitHubPR[]
  commitCount: number
  openPRs: number
  mergedPRs: number
  lastCommitDate: string | null
}

/**
 * Get repository activity using GitHub CLI
 */
async function getRepoActivity(repoUrl: string): Promise<RepoActivity | null> {
  try {
    // Extract owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) {
      console.log(`[GitHub] Invalid repo URL: ${repoUrl}`)
      return null
    }
    
    const [, owner, repo] = match
    const repoPath = `${owner}/${repo}`
    
    // Get recent commits
    const { stdout: commitsJson } = await execAsync(
      `gh api repos/${repoPath}/commits?per_page=10 --jq '.[] | {sha: .sha[:7], message: .commit.message, author: .commit.author.name, date: .commit.author.date, url: .html_url}' 2>/dev/null || echo "[]"`,
      { timeout: 30000 }
    )
    
    // Get open PRs
    const { stdout: prsJson } = await execAsync(
      `gh api repos/${repoPath}/pulls?state=open&per_page=10 --jq '.[] | {number: .number, title: .title, state: .state, author: .user.login, created_at: .created_at, merged_at: .merged_at}' 2>/dev/null || echo "[]"`,
      { timeout: 30000 }
    )
    
    // Get merged PRs count (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { stdout: mergedCount } = await execAsync(
      `gh api repos/${repoPath}/pulls?state=closed&per_page=100 --jq '[.[] | select(.merged_at != null and .merged_at > "${thirtyDaysAgo}")] | length' 2>/dev/null || echo "0"`,
      { timeout: 30000 }
    )
    
    // Get total commit count
    const { stdout: commitCount } = await execAsync(
      `gh api repos/${repoPath}/commits?per_page=1 --jq 'length' 2>/dev/null || echo "0"`,
      { timeout: 30000 }
    )
    
    // Parse commits
    const commits: GitHubCommit[] = []
    if (commitsJson.trim()) {
      const lines = commitsJson.trim().split('\n').filter(l => l.trim())
      for (const line of lines) {
        try {
          commits.push(JSON.parse(line))
        } catch (e) {
          // Skip invalid lines
        }
      }
    }
    
    // Parse PRs
    const pullRequests: GitHubPR[] = []
    if (prsJson.trim()) {
      const lines = prsJson.trim().split('\n').filter(l => l.trim())
      for (const line of lines) {
        try {
          pullRequests.push(JSON.parse(line))
        } catch (e) {
          // Skip invalid lines
        }
      }
    }
    
    return {
      commits,
      pullRequests,
      commitCount: commits.length,
      openPRs: pullRequests.length,
      mergedPRs: parseInt(mergedCount.trim()) || 0,
      lastCommitDate: commits[0]?.date || null
    }
    
  } catch (error) {
    console.error(`[GitHub] Error fetching activity for ${repoUrl}:`, error)
    return null
  }
}

/**
 * Calculate project progress based on GitHub activity
 */
function calculateProgress(activity: RepoActivity, existingProgress: number): number {
  // If there are open PRs, project is in progress
  if (activity.openPRs > 0) {
    // Base progress on existing progress or 25% if new
    return Math.max(existingProgress, 25)
  }
  
  // If there are recent commits but no open PRs
  if (activity.commitCount > 0) {
    // Calculate based on commit recency
    const lastCommit = activity.lastCommitDate ? new Date(activity.lastCommitDate) : null
    const daysSinceCommit = lastCommit ? (Date.now() - lastCommit.getTime()) / (1000 * 60 * 60 * 24) : Infinity
    
    if (daysSinceCommit < 1) {
      return Math.max(existingProgress, 75) // Very active
    } else if (daysSinceCommit < 7) {
      return Math.max(existingProgress, 50) // Active this week
    } else {
      return Math.max(existingProgress, 25) // Some activity
    }
  }
  
  return existingProgress
}

/**
 * Update project with GitHub data
 */
function updateProject(projectId: string, activity: RepoActivity): void {
  const project = db.prepare('SELECT progress, status FROM projects WHERE id = ?').get(projectId) as any
  
  if (!project) return
  
  const newProgress = calculateProgress(activity, project.progress)
  let newStatus = project.status
  
  // Auto-update status based on activity
  if (newProgress === 100 && activity.openPRs === 0 && project.status !== 'done') {
    newStatus = 'done'
  } else if (newProgress > 0 && newProgress < 100 && project.status === 'not_started') {
    newStatus = 'in_progress'
  }
  
  db.prepare(`
    UPDATE projects 
    SET progress = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newProgress, newStatus, projectId)
  
  // Log significant activity
  if (activity.commits.length > 0) {
    const latestCommit = activity.commits[0]
    const existing = db.prepare(`
      SELECT id FROM activity 
      WHERE project_id = ? AND action_type = 'commit' AND metadata LIKE ?
      ORDER BY timestamp DESC LIMIT 1
    `).get(projectId, `%${latestCommit.sha}%`)
    
    if (!existing) {
      db.prepare(`
        INSERT INTO activity (id, action_type, description, project_id, metadata)
        VALUES (?, 'commit', ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        `Commit: ${latestCommit.message.split('\n')[0].substring(0, 80)}`,
        projectId,
        JSON.stringify({ 
          sha: latestCommit.sha, 
          author: latestCommit.author,
          commitCount: activity.commitCount
        })
      )
    }
  }
  
  // Log PR activity
  for (const pr of activity.pullRequests) {
    const existing = db.prepare(`
      SELECT id FROM activity 
      WHERE project_id = ? AND task_id = ? AND action_type = 'pull_request'
    `).get(projectId, `pr-${pr.number}`)
    
    if (!existing) {
      db.prepare(`
        INSERT INTO activity (id, action_type, description, project_id, task_id, metadata)
        VALUES (?, 'agent_action', ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        `PR #${pr.number}: ${pr.title}`,
        projectId,
        `pr-${pr.number}`,
        JSON.stringify({ type: 'pull_request', number: pr.number, author: pr.author, state: pr.state })
      )
    }
  }
  
  console.log(`[GitHub] Updated ${projectId}: ${newProgress}% progress, ${activity.commitCount} commits, ${activity.openPRs} open PRs`)
}

/**
 * Main collection function
 */
async function collect(): Promise<void> {
  console.log('[GitHub] Starting collection...')
  
  // Get all projects with GitHub repos
  const projects = db.prepare(`
    SELECT id, repo_url FROM projects 
    WHERE repo_url IS NOT NULL AND repo_url LIKE '%github%'
  `).all() as any[]
  
  console.log(`[GitHub] Found ${projects.length} projects with GitHub repos`)
  
  let updated = 0
  
  for (const project of projects) {
    const activity = await getRepoActivity(project.repo_url)
    if (activity) {
      updateProject(project.id, activity)
      updated++
    }
    
    // Rate limiting - be nice to GitHub API
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log(`[GitHub] Updated ${updated} projects`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  collect().catch(console.error)
}

export { collect as collectGitHubData }
