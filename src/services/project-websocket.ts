// src/services/project-websocket.ts - WebSocket service for project updates

import { reloadProject } from './config-loader'
import { useProjectStore } from '@/stores/project'

type ProjectUpdateHandler = (data: {
  projectId: string
  projectName: string
  version: string
  timestamp: number
}) => void

class ProjectWebSocketService {
  private ws: WebSocket | null = null
  private reconnectTimer: number | null = null
  private reconnectDelay: number = 3000 // 3 seconds
  private handlers: ProjectUpdateHandler[] = []
  private isManualClose: boolean = false

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws) {
      console.log('[ProjectWS] Already connected')
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host || 'localhost:8080'
    const wsUrl = `${protocol}//${host}/ws/devices/instances/sim-device-001/subscribe`

    console.log(`[ProjectWS] Connecting to ${wsUrl}...`)

    try {
      this.ws = new WebSocket(wsUrl)
      this.isManualClose = false

      this.ws.onopen = () => {
        console.log('[ProjectWS] Connected successfully')
        this.clearReconnectTimer()
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('[ProjectWS] Failed to parse message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[ProjectWS] WebSocket error:', error)
      }

      this.ws.onclose = (event) => {
        console.log(`[ProjectWS] Connection closed (code: ${event.code})`)
        this.ws = null

        if (!this.isManualClose) {
          this.scheduleReconnect()
        }
      }
    } catch (error) {
      console.error('[ProjectWS] Failed to connect:', error)
      this.scheduleReconnect()
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualClose = true
    this.clearReconnectTimer()

    if (this.ws) {
      this.ws.close()
      this.ws = null
      console.log('[ProjectWS] Disconnected')
    }
  }

  /**
   * Register a handler for project update events
   */
  onProjectUpdate(handler: ProjectUpdateHandler): () => void {
    this.handlers.push(handler)

    // Return unsubscribe function
    return () => {
      const index = this.handlers.indexOf(handler)
      if (index > -1) {
        this.handlers.splice(index, 1)
      }
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    console.log('[ProjectWS] Received message:', message.type)

    switch (message.type) {
      case 'project_updated':
        this.handleProjectUpdate(message.data)
        break

      case 'connected':
        console.log('[ProjectWS] Server acknowledged connection:', message.data.message)
        break

      case 'pong':
        // Heartbeat response, ignore
        break

      default:
        console.log('[ProjectWS] Unknown message type:', message.type)
    }
  }

  /**
   * Handle project update notification
   */
  private async handleProjectUpdate(data: {
    projectId: string
    projectName: string
    version: string
    timestamp: number
  }): Promise<void> {
    console.log(
      `[ProjectWS] Project updated: ${data.projectName} (v${data.version})`
    )

    // Notify all registered handlers
    this.handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error('[ProjectWS] Handler error:', error)
      }
    })

    // Auto-reload the project
    await this.autoReloadProject()
  }

  /**
   * Automatically reload the project when update is received
   */
  private async autoReloadProject(): Promise<void> {
    const projectStore = useProjectStore()

    try {
      console.log('[ProjectWS] Auto-reloading project...')
      projectStore.setLoading(true)

      const success = await reloadProject()

      if (success) {
        console.log('[ProjectWS] Project reloaded successfully')
      } else {
        console.warn('[ProjectWS] Failed to reload project')
      }
    } catch (error) {
      console.error('[ProjectWS] Error reloading project:', error)
    } finally {
      projectStore.setLoading(false)
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return
    }

    console.log(`[ProjectWS] Reconnecting in ${this.reconnectDelay}ms...`)
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.reconnectDelay)
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

// Singleton instance
export const projectWebSocket = new ProjectWebSocketService()
