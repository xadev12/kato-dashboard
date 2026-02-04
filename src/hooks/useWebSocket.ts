import { useState, useEffect, useCallback, useRef } from 'react'
import type { TokenStats } from '../types'

// Use polling for Vercel deployment (serverless doesn't support WebSockets)
const IS_PROD = import.meta.env.PROD || window.location.hostname.includes('vercel.app')
const WS_URL = IS_PROD 
  ? null // No WebSocket in production - use polling
  : 'ws://localhost:3001/ws'
const POLLING_INTERVAL = 5000 // 5 seconds for production polling
const RECONNECT_DELAY = 3000

interface WebSocketMessage {
  type: 'tokenStats' | 'agentUpdate' | 'ping' | 'connected'
  data?: TokenStats
  timestamp?: string
}

interface UseWebSocketReturn {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (message: unknown) => void
  reconnect: () => void
}

// Polling-based connection for production
function usePolling(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(true)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      // Fetch from API endpoint (will be proxied to backend)
      const response = await fetch('/api/tokens?period=today')
      if (response.ok) {
        const data = await response.json()
        setLastMessage({
          type: 'tokenStats',
          data,
          timestamp: new Date().toISOString()
        })
        setIsConnected(true)
      }
    } catch (err) {
      console.error('Polling error:', err)
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    fetchStats() // Initial fetch
    intervalRef.current = setInterval(fetchStats, POLLING_INTERVAL)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchStats])

  const sendMessage = useCallback(() => {
    // No-op for polling mode
  }, [])

  const reconnect = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  return { isConnected, lastMessage, sendMessage, reconnect }
}

// WebSocket-based connection for local dev
function useWebSocketConnection(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!WS_URL) return
    
    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        
        // Subscribe to token stats
        ws.send(JSON.stringify({ action: 'subscribe', channel: 'tokenStats' }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          setLastMessage(message)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null

        // Attempt reconnect
        if (reconnectAttemptsRef.current < 5) {
          reconnectAttemptsRef.current++
          const delay = RECONNECT_DELAY * reconnectAttemptsRef.current
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (err) {
      console.error('Failed to connect WebSocket:', err)
    }
  }, [])

  const sendMessage = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
    }
    connect()
  }, [connect])

  useEffect(() => {
    connect()
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { isConnected, lastMessage, sendMessage, reconnect }
}

// Unified hook that uses WebSocket locally and polling in production
export function useWebSocket(): UseWebSocketReturn {
  if (IS_PROD) {
    return usePolling()
  }
  return useWebSocketConnection()
}

// Hook for real-time token stats
export function useRealtimeTokenStats() {
  const [stats, setStats] = useState<TokenStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { isConnected, lastMessage } = useWebSocket()

  // Initial fetch via HTTP
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const response = await fetch('/token-stats.json?t=' + Date.now())
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Failed to fetch initial token stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInitial()
  }, [])

  // Update from WebSocket/polling messages
  useEffect(() => {
    if (lastMessage?.type === 'tokenStats' && lastMessage.data) {
      setStats(lastMessage.data)
    }
  }, [lastMessage])

  return { stats, loading, isConnected }
}
