// src/config.ts - Application configuration

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  /**
   * Path to the HMI project file (.hmi)
   * Can be:
   * - Relative path from public folder (e.g., '/projects/test_runtime.hmi')
   * - Absolute URL (e.g., 'http://example.com/project.hmi')
   * - Empty string (will show "no project loaded" message)
   */
  hmiProjectPath: string

  /**
   * API base URL for device communication
   */
  apiBaseUrl: string

  /**
   * Default polling interval in milliseconds
   */
  defaultPollingInterval: number

  /**
   * Enable debug mode
   */
  debugMode: boolean
}

/**
 * Default runtime configuration
 */
export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  // Default HMI project file path
  // Set this to your .hmi file location
  hmiProjectPath: '/projects/default.hmi',

  // API base URL
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',

  // Default polling interval (500ms)
  defaultPollingInterval: 500,

  // Debug mode
  debugMode: import.meta.env.DEV || false
}

/**
 * Current runtime configuration
 * Can be overridden by creating a config.js file in public folder
 */
export let runtimeConfig: RuntimeConfig = { ...DEFAULT_RUNTIME_CONFIG }

/**
 * Initialize configuration from external source
 */
export async function initializeConfig(configOverrides?: Partial<RuntimeConfig>): Promise<void> {
  if (configOverrides) {
    runtimeConfig = {
      ...runtimeConfig,
      ...configOverrides
    }
  }

  console.log('[Config] Runtime configuration initialized:', runtimeConfig)
}

/**
 * Get HMI project file path
 */
export function getHmiProjectPath(): string {
  return runtimeConfig.hmiProjectPath
}

/**
 * Set HMI project file path
 */
export function setHmiProjectPath(path: string): void {
  runtimeConfig.hmiProjectPath = path
}
