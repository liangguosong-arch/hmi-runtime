// src/services/api.ts - HTTP API 客户端

import axios, { AxiosInstance, AxiosError } from 'axios'
import type { ApiResponse, LoginRequest, LoginResponse } from '@/types/api'
import { useAuthStore } from '@/stores/auth'

// Default device service configuration
const DEFAULT_DEVICE_HOST = 'localhost'
const DEFAULT_DEVICE_PORT = 8080

// Create axios instance for local project management API
export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Create axios instance for device/PLC communication
export const deviceApiClient: AxiosInstance = axios.create({
  baseURL: `http://${DEFAULT_DEVICE_HOST}:${DEFAULT_DEVICE_PORT}/api/v1`,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Build device service URL from PLC configuration
 * @param plcIpAddress - PLC IP address (optional)
 * @param plcPort - PLC port (optional)
 * @returns Full device service URL
 */
export function buildDeviceServiceUrl(plcIpAddress?: string, plcPort?: number): string {
  const host = plcIpAddress || DEFAULT_DEVICE_HOST
  const port = plcPort || DEFAULT_DEVICE_PORT
  return `http://${host}:${port}/api/v1`
}

/**
 * Update the device service base URL dynamically
 * Should be called after loading a project with PLC configuration
 * @param plcIpAddress - PLC IP address
 * @param plcPort - PLC port
 */
export function setDeviceServiceUrl(plcIpAddress?: string, plcPort?: number): void {
  const newBaseUrl = buildDeviceServiceUrl(plcIpAddress, plcPort)
  deviceApiClient.defaults.baseURL = newBaseUrl
  console.log(`[API] Device service URL updated to: ${newBaseUrl}`)
}

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    const token = authStore.currentToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

deviceApiClient.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    const token = authStore.currentToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor: Handle errors
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        await refreshToken()
        return apiClient.request(error.config!)
      } catch (refreshError) {
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    if (!error.response) {
      console.error('[API] Network error:', error.message)
    } else {
      console.error('[API] Server error:', error.response.status)
    }

    return Promise.reject(error)
  }
)

deviceApiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (!error.response) {
      const isCorsError = error.message.includes('Network Error') || 
                          error.code === 'ERR_NETWORK'
      
      if (isCorsError) {
        console.error(
          '[DeviceAPI] CORS or Network Error: Unable to connect to device service. ' +
          `Current base URL: ${deviceApiClient.defaults.baseURL}`
        )
      } else {
        console.error('[DeviceAPI] Network error:', error.message)
      }
    } else {
      console.error('[DeviceAPI] Server error:', error.response.status)
    }

    return Promise.reject(error)
  }
)

// Refresh token function
async function refreshToken(): Promise<void> {
  const authStore = useAuthStore()
  const refreshToken = authStore.sessionData?.token // Assuming we might store refresh token in session data in the future
  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  const response = await axios.post('/api/auth/refresh', {
    refreshToken
  })

  // Update auth store with new tokens
  authStore.setSession({
    ...authStore.sessionData!,
    token: response.data.accessToken
  })
}

// Project management API functions
export const projectApi = {
  /**
   * Update/save project
   */
  updateProject(project: any, filePath?: string) {
    return apiClient.post<ApiResponse>('/projects/update', {
      project,
      filePath
    })
  },

  /**
   * Get project list
   */
  getProjects() {
    return apiClient.get<ApiResponse>('/projects')
  },

  /**
   * Get single project by name
   */
  getProject(projectName: string) {
    return apiClient.get<ApiResponse>(`/projects/${projectName}`)
  },

  /**
   * Get project metadata for update detection
   * Returns only version and updatedAt fields to detect changes
   */
  getProjectMeta(projectName: string) {
    return apiClient.get<ApiResponse<{
      id: string
      name: string
      version: string
      updatedAt: number
      lastModified: number
    }>>(`/project/meta?projectName=${encodeURIComponent(projectName)}`)
  }
}


/**
 * 用户认证 API
 */
export const authApi = {
  // 登录
  login(data: LoginRequest) {
    return deviceApiClient.post<ApiResponse>('/auth/login', data)
  }
}

// API helper functions for device communication
export const deviceApi = {
  /**
   * Get variable values (batch read)
   */
  getVariableValues(instanceId: string, addresses: string[]) {
    return deviceApiClient.get<ApiResponse>(
      `/devices/instances/${instanceId}/variables/values`,
      { params: { addresses: addresses.join(',') } }
    )
  },

  /**
   * Write single variable
   */
  writeVariable(instanceId: string, address: string, value: any) {
    return deviceApiClient.post<ApiResponse>(
      `/devices/instances/${instanceId}/variables/${address}/write`,
      { value }
    )
  },

  /**
   * Batch write variables
   */
  batchWrite(instanceId: string, writes: Array<{ address: string; value: any }>) {
    return deviceApiClient.post<ApiResponse>(
      `/devices/instances/${instanceId}/variables/batch-write`,
      { writes, atomic: true }
    )
  },

  /**
   * Get device status
   */
  getStatus(instanceId: string) {
    return deviceApiClient.get<ApiResponse>(
      `/devices/instances/${instanceId}/status`
    )
  },

  /**
   * Get historical data for variables
   * @param instanceId - Device instance ID
   * @param addresses - Array of variable addresses
   * @param startTime - Start time (ISO format or timestamp)
   * @param endTime - End time (ISO format or timestamp)
   * @param interval - Optional sampling interval in milliseconds
   */
  getVariableHistory(
    instanceId: string,
    addresses: string[],
    startTime: string,
    endTime: string,
    interval?: number
  ) {
    return deviceApiClient.get<ApiResponse>(
      `/devices/instances/${instanceId}/variables/history`,
      {
        params: {
          addresses: addresses.join(','),
          startTime,
          endTime,
          interval
        }
      }
    )
  }
}
