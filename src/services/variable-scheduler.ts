// src/services/variable-scheduler.ts - 变量调度器 (性能核心)

import { deviceApi } from './api'
import type { Subscription, VariableConfig, VariableState } from '@plc/hmi-types'

class VariableScheduler {
  private cache = new Map<string, VariableState>()
  private pollingTimer: number | null = null
  private pollingInterval: number = 500 // ms
  private subscribedVariables = new Set<string>()
  private writeQueue: Array<{
    address: string
    value: any
    resolve: Function
    reject: Function
  }> = []
  private isProcessingWrite = false
  private instanceId: string = ''

  /**
   * Set device instance ID
   */
  setInstanceId(id: string) {
    this.instanceId = id
  }

  /**
   * Subscribe to variable changes
   */
  subscribe(variable: VariableConfig, callback: (value: any) => void): Subscription {
    let address: string
    if (typeof variable === 'string') {
      address = variable
    } else {
      address = variable.address
    }

    // Initialize state if not exists
    if (!this.cache.has(address)) {
      this.cache.set(address, {
        value: null,
        quality: 'uncertain',
        timestamp: 0,
        subscribers: new Set()
      })
    }

    const state = this.cache.get(address)!
    state.subscribers.add(callback)
    this.subscribedVariables.add(address)

    // Start polling if not already running

    if (!this.pollingTimer && this.instanceId) {
      this.startPolling()
    }

    // Return unsubscribe function
    return {
      unsubscribe: () => {
        state.subscribers.delete(callback)
        if (state.subscribers.size === 0) {
          this.cache.delete(address)
          this.subscribedVariables.delete(address)
        }

        // Stop polling if no subscriptions
        if (this.subscribedVariables.size === 0) {
          this.stopPolling()
        }
      }
    }
  }

  /**
   * Get current variable value (synchronous, from cache)
   */
  getValue(variable: VariableConfig): any {
    let address: string
    if (typeof variable === 'string') {
      address = variable
    } else {
      address = variable.address
    }
    return this.cache.get(address)?.value ?? null
  }

  /**
   * Write variable value
   */
  async write(variable: VariableConfig, value: any): Promise<void> {
    let address: string
    if (typeof variable === 'string') {
      address = variable
    } else {
      address = variable.address
    }
    return new Promise((resolve, reject) => {
      this.writeQueue.push({ address, value, resolve, reject })
      this.processWriteQueue()
    })
  }

  /**
   * Batch write multiple variables
   */
  async batchWrite(writes: Array<{ address: string; value: any }>): Promise<void> {
    if (!this.instanceId) {
      throw new Error('Instance ID not set')
    }

    try {
      const response = await deviceApi.batchWrite(this.instanceId, writes)

      if (response.data.code === 200) {
        // Force refresh after successful write
        await this.forceRefresh(writes.map(w => w.address))
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      console.error('[Runtime VariableScheduler] Batch write failed:', error)
      throw error
    }
  }

  /**
   * Start polling loop
   */
  private startPolling(): void {
    if (this.pollingTimer || !this.instanceId) return

    console.log('[Runtime VariableScheduler] Started polling')
    this.poll()

    this.pollingTimer = window.setInterval(() => {
      this.poll()
    }, this.pollingInterval)
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
      console.log('[Runtime VariableScheduler] Stopped polling')
    }
  }

  /**
   * Poll variables from server
   */
  private async poll(): Promise<void> {
    if (this.subscribedVariables.size === 0 || !this.instanceId) return

    try {
      const addresses = Array.from(this.subscribedVariables)
      const startTime = performance.now()

      const response = await deviceApi.getVariableValues(this.instanceId, addresses)
      const elapsed = performance.now() - startTime

      if (response.data.code === 200) {
        // Update cache with new values
        const values = response.data.data
        if (Array.isArray(values)) {
          values.forEach(({ address, value, quality, timestamp }: any) => {
            this.updateVariable(
              address,
              value,
              quality || 'good',
              new Date(timestamp).getTime()
            )
          })
        }

        // Log performance
        if (elapsed > 200) {
          console.warn(
            `[Runtime VariableScheduler] Slow poll: ${elapsed.toFixed(0)}ms for ${addresses.length} variables`
          )
        }
      }
    } catch (error) {
      console.error('[Runtime VariableScheduler] Poll failed:', error)
      // Mark all variables as bad quality
      this.subscribedVariables.forEach(address => {
        this.updateVariable(address, null, 'bad', Date.now())
      })
    }
  }

  /**
   * Update variable in cache and notify subscribers
   */
  private updateVariable(
    address: string,
    value: any,
    quality: string,
    timestamp: number
  ): void {
    const state = this.cache.get(address)
    if (!state) return

    // Only notify if value changed (avoid unnecessary re-renders)
    const hasChanged = state.value !== value

    state.value = value
    state.quality = quality as any
    state.timestamp = timestamp

    if (hasChanged) {
      // Notify all subscribers
      state.subscribers.forEach(callback => {
        try {
          callback(value)
        } catch (error) {
          console.error(
            `[Runtime VariableScheduler] Subscriber error for ${address}:`,
            error
          )
        }
      })
    }
  }

  /**
   * Force refresh specific variables
   */
  private async forceRefresh(addresses: string[]): Promise<void> {
    if (!this.instanceId) return

    try {
      const response = await deviceApi.getVariableValues(this.instanceId, addresses)

      if (response.data.code === 200) {
        const values = response.data.data
        if (Array.isArray(values)) {
          values.forEach(({ address, value, quality, timestamp }: any) => {
            this.updateVariable(
              address,
              value,
              quality || 'good',
              new Date(timestamp).getTime()
            )
          })
        }
      }
    } catch (error) {
      console.error('[Runtime VariableScheduler] Force refresh failed:', error)
    }
  }

  /**
   * Process write queue
   */
  private async processWriteQueue(): Promise<void> {
    if (this.isProcessingWrite || this.writeQueue.length === 0) return

    this.isProcessingWrite = true

    try {
      // Process writes in batches
      const batchSize = 10
      while (this.writeQueue.length > 0) {
        const batch = this.writeQueue.splice(0, batchSize)

        const writes = batch.map(item => ({
          address: item.address,
          value: item.value
        }))

        try {
          await this.batchWrite(writes)
          batch.forEach(item => item.resolve())
        } catch (error) {
          batch.forEach(item => item.reject(error))
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    } finally {
      this.isProcessingWrite = false
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      subscribedVariables: this.subscribedVariables.size,
      cachedVariables: this.cache.size,
      pendingWrites: this.writeQueue.length,
      pollingActive: this.pollingTimer !== null
    }
  }
}

// Singleton instance
export const variableScheduler = new VariableScheduler()
