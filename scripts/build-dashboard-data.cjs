#!/usr/bin/env node
/**
 * Build Dashboard Data Script
 * Aggregates real-time data from pipeline.json files and ROADMAP.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECTS_DIR = '/Users/devl/clawd/projects';
const ROADMAP_PATH = '/Users/devl/clawd/ROADMAP.md';
const OUTPUT_PATH = process.argv[2] || path.join(__dirname, '../public/dashboard-data.json');

// Stage order for progress calculation
const STAGE_ORDER = ['idea', 'prd', 'prd_review', 'design_spec', 'taste_review', 'tech_spec', 'spec_review', 'implementation', 'qa', 'deploy', 'iterate'];

// Calculate sprint day (Feb 6 - Apr 6, 2026)
function getSprintDay() {
  const sprintStart = new Date('2026-02-06');
  const now = new Date();
  const diffDays = Math.floor((now - sprintStart) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(diffDays + 1, 60));
}

// Read all pipeline.json files
function scanPipelines() {
  const projects = [];
  
  try {
    const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const pipelinePath = path.join(PROJECTS_DIR, entry.name, 'pipeline.json');
      if (!fs.existsSync(pipelinePath)) continue;
      
      try {
        const pipeline = JSON.parse(fs.readFileSync(pipelinePath, 'utf8'));
        
        // Calculate progress
        let completedStages = 0;
        const stageOrder = pipeline.stageOrder || STAGE_ORDER;
        
        for (const stage of stageOrder) {
          if (pipeline.stages?.[stage]?.status === 'completed') {
            completedStages++;
          }
        }
        
        const progress = Math.round((completedStages / stageOrder.length) * 100);
        
        // Get deploy URL if available
        const deployUrl = pipeline.stages?.deploy?.url || null;
        
        projects.push({
          id: pipeline.projectId || entry.name,
          name: pipeline.name || entry.name,
          stage: pipeline.currentStage || 'unknown',
          status: pipeline.status || 'unknown',
          progress,
          priority: pipeline.metadata?.priority || 'P2',
          score: pipeline.metadata?.score || null,
          url: deployUrl,
          updatedAt: pipeline.updatedAt || new Date().toISOString()
        });
      } catch (err) {
        console.error(`Error reading ${pipelinePath}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error scanning projects:', err.message);
  }
  
  return projects;
}

// Parse ROADMAP.md for queue items
function parseRoadmap() {
  const queue = [];
  
  try {
    const content = fs.readFileSync(ROADMAP_PATH, 'utf8');
    
    // Extract Product Factory Queue table
    const queueMatch = content.match(/### Top Pick:[\s\S]*?(?=---|$)/);
    if (queueMatch) {
      // Look for the ranked table
      const tableMatch = content.match(/\| Rank \|.*?\n((?:\|.*?\n)+)/);
      if (tableMatch) {
        const rows = tableMatch[1].trim().split('\n');
        for (const row of rows) {
          const cells = row.split('|').map(c => c.trim()).filter(Boolean);
          if (cells.length >= 8 && cells[0] !== '---') {
            queue.push({
              id: cells[1],
              name: cells[2],
              project: cells[2],
              priority: parseInt(cells[0]) <= 3 ? 'P1' : 'P2',
              score: parseInt(cells[7]) || 0,
              edge: cells[3]
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error parsing ROADMAP:', err.message);
  }
  
  return queue;
}

// Get active CLI work from /tmp directories
function getActiveCliWork() {
  const tasks = [];
  
  try {
    const tmpDir = '/tmp';
    const entries = fs.readdirSync(tmpDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      // Look for worktree patterns
      if (/^(claude|codex|kimi|kato)-/.test(entry.name)) {
        const stat = fs.statSync(path.join(tmpDir, entry.name));
        const gitPath = path.join(tmpDir, entry.name, '.git');
        
        if (fs.existsSync(gitPath)) {
          tasks.push({
            id: entry.name,
            project: entry.name.split('-')[0],
            status: 'active',
            startedAt: stat.birthtime?.toISOString() || stat.ctime.toISOString()
          });
        }
      }
    }
  } catch (err) {
    console.error('Error scanning /tmp:', err.message);
  }
  
  return tasks;
}

// Get git worktrees
function getGitWorktrees() {
  try {
    const output = execSync('git -C /Users/devl/clawd worktree list --porcelain', { encoding: 'utf8' });
    const worktrees = [];
    let current = {};
    
    for (const line of output.split('\n')) {
      if (line.startsWith('worktree ')) {
        if (current.path) worktrees.push(current);
        current = { path: line.replace('worktree ', '') };
      } else if (line.startsWith('branch ')) {
        current.branch = line.replace('branch ', '').replace('refs/heads/', '');
      } else if (line.startsWith('HEAD ')) {
        current.head = line.replace('HEAD ', '');
      }
    }
    
    if (current.path) worktrees.push(current);
    return worktrees.filter(w => w.path !== '/Users/devl/clawd');
  } catch (err) {
    return [];
  }
}

// Get real cost data from cost tracker
function getTokenStats() {
  try {
    const costTracker = require('/Users/devl/clawd/scripts/cost-tracker.js');
    const stats = costTracker.getDashboardStats();
    return {
      today: stats.entries * 100000, // Estimate tokens from entries
      cost: stats.today,
      budget: stats.budget,
      usedPercent: stats.usedPercent,
      requests: stats.entries,
      weekTotal: stats.weekTotal,
      byModel: stats.byModel
    };
  } catch {
    // Fallback if cost tracker not available
    return {
      today: 0,
      cost: 0,
      budget: 20,
      usedPercent: 0,
      requests: 0,
      weekTotal: 0,
      byModel: {}
    };
  }
}

// Build dashboard data
function buildDashboardData() {
  const projects = scanPipelines();
  const queue = parseRoadmap();
  const cliTasks = getActiveCliWork();
  const worktrees = getGitWorktrees();
  const tokens = getTokenStats();
  
  // Split projects by status
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress');
  const blockedProjects = projects.filter(p => p.status === 'blocked');
  
  const data = {
    schemaVersion: '4.0',
    lastUpdated: new Date().toISOString(),
    sprint: {
      name: '60-Day Builder Sprint',
      day: getSprintDay(),
      totalDays: 60,
      startDate: 'Feb 6',
      endDate: 'Apr 6, 2026',
      targets: [
        { metric: 'Products', target: '4-6 MVPs', deadline: 'Apr 6' },
        { metric: 'MRR', target: '$500-5K', deadline: 'Apr 6' },
        { metric: 'Trading', target: '+$10-50K', deadline: 'Apr 6' },
        { metric: 'Fitness', target: '6-8kg lost', deadline: 'Apr 6' }
      ]
    },
    activeProjects: activeProjects.slice(0, 10),
    blockedProjects: blockedProjects.slice(0, 5),
    queue: queue.slice(0, 10),
    systemHealth: {
      tokens,
      agents: {
        total: 5,
        active: 0,
        idle: 5
      }
    },
    activeWork: {
      cliTasks,
      worktrees: worktrees.slice(0, 10)
    },
    meta: {
      totalProjects: projects.length,
      activeCount: activeProjects.length,
      blockedCount: blockedProjects.length,
      queueCount: queue.length
    }
  };
  
  return data;
}

// Main
function main() {
  console.log('Building dashboard data...');
  
  const data = buildDashboardData();
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
  
  console.log(`Dashboard data written to ${OUTPUT_PATH}`);
  console.log(`- ${data.meta.activeCount} active projects`);
  console.log(`- ${data.meta.blockedCount} blocked projects`);
  console.log(`- ${data.meta.queueCount} queue items`);
  console.log(`- ${data.activeWork.cliTasks.length} CLI tasks`);
}

main();

module.exports = { buildDashboardData };
