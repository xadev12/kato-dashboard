/**
 * Agent Source Reader
 *
 * Reads agent configuration from ~/.openclaw/openclaw.json
 * and queries gateway for live status
 */

import fs from 'fs'

const OPENCLAW_CONFIG = '/Users/devl/.openclaw/openclaw.json'

export interface AgentConfig {
  id: string
  name?: string
  workspace?: string
  agentDir?: string
  model?: {
    primary: string
    fallbacks?: string[]
  }
  identity?: {
    name: string
    emoji?: string
  }
  subagents?: {
    allowAgents?: string[]
  }
}

export interface OpenClawConfig {
  agents: {
    defaults: {
      model?: {
        primary: string
        fallbacks?: string[]
      }
      workspace?: string
      maxConcurrent?: number
    }
    list: AgentConfig[]
  }
  gateway?: {
    port: number
    mode: string
    bind: string
    auth?: {
      mode: string
      token?: string
    }
  }
}

export interface Agent {
  id: string
  name: string
  type: 'queen' | 'worker'
  status: 'active' | 'idle' | 'offline'
  currentTask?: string
  emoji?: string
  role?: string
  workspace?: string
  model?: string
}

export interface GatewayAgentStatus {
  id: string
  status: 'active' | 'idle' | 'offline'
  currentTask?: string
  lastSeen?: string
  sessionId?: string
}

/**
 * Read OpenClaw configuration
 */
export function readOpenClawConfig(): OpenClawConfig | null {
  if (!fs.existsSync(OPENCLAW_CONFIG)) {
    console.warn(`[Sources] OpenClaw config not found: ${OPENCLAW_CONFIG}`)
    return null
  }

  try {
    const content = fs.readFileSync(OPENCLAW_CONFIG, 'utf-8')
    return JSON.parse(content)
  } catch (err) {
    console.error('[Sources] Failed to parse OpenClaw config:', err)
    return null
  }
}

/**
 * Map agent config to Agent format
 */
function configToAgent(config: AgentConfig, defaults: OpenClawConfig['agents']['defaults']): Agent {
  const roleMap: Record<string, string> = {
    main: 'AI Sentinel & Chief of Staff',
    yuki: 'DevOps Engineer',
    koji: 'Business Strategist',
    sora: 'Second Brain Keeper',
    karin: 'Personal Assistant'
  }

  return {
    id: config.id,
    name: config.identity?.name || config.name || config.id,
    type: 'queen',
    status: 'idle', // Will be updated by gateway query
    emoji: config.identity?.emoji,
    role: roleMap[config.id] || config.identity?.name,
    workspace: config.workspace || defaults.workspace,
    model: config.model?.primary || defaults.model?.primary
  }
}

/**
 * Get all configured agents
 */
export function getAgents(): Agent[] {
  const config = readOpenClawConfig()
  if (!config) return []

  return config.agents.list.map(a => configToAgent(a, config.agents.defaults))
}

/**
 * Query gateway for live agent status
 */
export async function queryGatewayStatus(): Promise<GatewayAgentStatus[]> {
  const config = readOpenClawConfig()
  if (!config?.gateway) {
    console.warn('[Sources] Gateway not configured')
    return []
  }

  const { port, auth } = config.gateway
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (auth?.mode === 'token' && auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`
    }

    const response = await fetch(`${baseUrl}/api/agents/status`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      console.warn(`[Sources] Gateway returned ${response.status}`)
      return []
    }

    const data = await response.json()
    return data.agents || []
  } catch (err) {
    console.warn('[Sources] Failed to query gateway:', err)
    return []
  }
}

/**
 * Get agents with live status from gateway
 */
export async function getAgentsWithStatus(): Promise<Agent[]> {
  const agents = getAgents()
  const liveStatus = await queryGatewayStatus()

  // Merge live status into agents
  const statusMap = new Map(liveStatus.map(s => [s.id, s]))

  return agents.map(agent => {
    const live = statusMap.get(agent.id)
    if (live) {
      return {
        ...agent,
        status: live.status,
        currentTask: live.currentTask
      }
    }
    return agent
  })
}

/**
 * Get gateway info for health check
 */
export function getGatewayInfo(): { port: number; mode: string } | null {
  const config = readOpenClawConfig()
  if (!config?.gateway) return null

  return {
    port: config.gateway.port,
    mode: config.gateway.mode
  }
}
