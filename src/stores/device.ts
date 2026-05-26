// src/stores/device.ts - Device connection state management

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { variableScheduler } from '@/services/variable-scheduler'

export interface DeviceConfig {
  id: string
  name: string
  ip: string
  port: number
  token?: string
}

export const useDeviceStore = defineStore('device', () => {
  // State
  const devices = ref<DeviceConfig[]>([])
  const connectedDeviceId = ref<string | null>(null)
  const connectionStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const errorMessage = ref<string | null>(null)

  // Getters
  const connectedDevice = computed(() => {
    if (!connectedDeviceId.value) return null
    return devices.value.find(d => d.id === connectedDeviceId.value)
  })

  const isConnected = computed(() => {
    return connectionStatus.value === 'connected'
  })

  // Actions
  function addDevice(config: DeviceConfig) {
    const existing = devices.value.find(d => d.id === config.id)
    if (existing) {
      Object.assign(existing, config)
    } else {
      devices.value.push(config)
    }
  }

  function removeDevice(deviceId: string) {
    const index = devices.value.findIndex(d => d.id === deviceId)
    if (index >= 0) {
      devices.value.splice(index, 1)
      if (connectedDeviceId.value === deviceId) {
        disconnect()
      }
    }
  }

  async function connect(deviceId: string): Promise<boolean> {
    const device = devices.value.find(d => d.id === deviceId)
    if (!device) {
      errorMessage.value = `Device '${deviceId}' not found`
      connectionStatus.value = 'error'
      return false
    }

    try {
      connectionStatus.value = 'connecting'
      errorMessage.value = null

      // Set instance ID in variable scheduler
      variableScheduler.setInstanceId(deviceId)

      // Simulate connection (in real app, would test connection here)
      await new Promise(resolve => setTimeout(resolve, 500))

      connectedDeviceId.value = deviceId
      connectionStatus.value = 'connected'

      console.log(`[DeviceStore] Connected to device: ${device.name}`)
      return true
    } catch (err: any) {
      connectionStatus.value = 'error'
      errorMessage.value = err.message || 'Connection failed'
      console.error('[DeviceStore] Connection error:', err)
      return false
    }
  }

  function disconnect() {
    if (connectedDeviceId.value) {
      variableScheduler.stopPolling()
      console.log(`[DeviceStore] Disconnected from device: ${connectedDeviceId.value}`)
    }

    connectedDeviceId.value = null
    connectionStatus.value = 'disconnected'
    errorMessage.value = null
  }

  function setConnectionStatus(status: typeof connectionStatus.value) {
    connectionStatus.value = status
  }

  function setErrorMessage(message: string | null) {
    errorMessage.value = message
  }

  return {
    // State
    devices,
    connectedDeviceId,
    connectionStatus,
    errorMessage,
    // Getters
    connectedDevice,
    isConnected,
    // Actions
    addDevice,
    removeDevice,
    connect,
    disconnect,
    setConnectionStatus,
    setErrorMessage
  }
})
