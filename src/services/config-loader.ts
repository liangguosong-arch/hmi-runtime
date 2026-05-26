// src/services/config-loader.ts - Configuration loader service for .hmi files

import type { Project, ProjectFileDTO } from '@plc/hmi-types'
import { projectFromDTO, projectToDTO } from '@plc/hmi-types'
import { useProjectStore } from '@/stores/project'
import { getHmiProjectPath } from '@/config'
import { setDeviceServiceUrl, projectApi } from '@/services/api'
import { useDeviceStore } from '@/stores/device'

/**
 * Load HMI project file (.hmi format)
 * The .hmi file is a JSON file containing ProjectFileDTO structure
 */
export async function loadHmiProject(filePath?: string): Promise<Project | null> {
  const path = filePath || getHmiProjectPath()

  if (!path) {
    console.log('[ConfigLoader] No HMI project path configured')
    return null
  }

  try {
    console.log(`[ConfigLoader] Loading HMI project from: ${path}`)
    const response = await fetch(path)

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[ConfigLoader] HMI project file not found: ${path}`)
        return null
      }
      throw new Error(`Failed to load HMI project: ${response.statusText}`)
    }

    const dto: ProjectFileDTO = await response.json()

    // Validate DTO structure
    validateProjectDTO(dto)

    // Convert DTO to Project
    const project = projectFromDTO(dto)

    // Set file path
    project.filePath = path

    // Configure device service URL based on PLC settings
    setDeviceServiceUrl(project.plcIpAddress, project.plcPort)
    const deviceStore = useDeviceStore()
    //todo 在project中增加设备实例id的字段
    deviceStore.addDevice({ id: '0', name: 'PLC', ip: project.plcIpAddress || '127.0.0.1', port: project.plcPort || 8080})
    deviceStore.connect('0')
    console.log(`[ConfigLoader] Successfully loaded project: ${project.name} (${project.version})`)
    return project
  } catch (error: any) {
    console.error('[ConfigLoader] Failed to load HMI project:', error)
    throw error
  }
}

/**
 * Validate ProjectFileDTO structure
 */
function validateProjectDTO(dto: any): void {
  const requiredFields = ['id', 'name', 'version', 'resolution', 'pages', 'currentPageId']

  for (const field of requiredFields) {
    if (!(field in dto)) {
      throw new Error(`Invalid .hmi file: Missing required field '${field}'`)
    }
  }

  if (!dto.resolution.width || !dto.resolution.height) {
    throw new Error('Invalid .hmi file: Invalid resolution')
  }

  if (!Array.isArray(dto.pages) || dto.pages.length === 0) {
    throw new Error('Invalid .hmi file: Project must have at least one page')
  }

  // Validate pages
  dto.pages.forEach((page: any, index: number) => {
    if (!page.id || !page.name || !page.pageType) {
      throw new Error(`Invalid .hmi file: Page at index ${index} is missing required fields`)
    }
    if (!Array.isArray(page.components)) {
      throw new Error(`Invalid .hmi file: Page '${page.name}' has invalid components`)
    }
  })
}

/**
 * Initialize runtime by loading HMI project file
 */
export async function initializeRuntime(): Promise<{
  success: boolean
  projectLoaded: boolean
  error?: string
}> {
  const projectStore = useProjectStore()

  try {
    projectStore.setLoading(true)
    projectStore.setError(null)

    // Try to load HMI project file
    const project = await loadHmiProject()

    if (project) {
      // Project loaded successfully
      projectStore.loadProject(project)
      console.log('[ConfigLoader] Runtime initialized with project:', project)

      return {
        success: true,
        projectLoaded: true
      }
    } else {
      // No project file found
      console.log('[ConfigLoader] No project file found, showing empty state')
      projectStore.clearProject()

      return {
        success: true,
        projectLoaded: false
      }
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to initialize runtime'
    projectStore.setError(errorMessage)
    console.error('[ConfigLoader] Initialization failed:', error)

    return {
      success: false,
      projectLoaded: false,
      error: errorMessage
    }
  } finally {
    projectStore.setLoading(false)
  }
}

/**
 * Reload current project
 */
export async function reloadProject(): Promise<boolean> {
  const projectStore = useProjectStore()
  const currentPath = projectStore.currentProject?.filePath

  if (!currentPath) {
    console.warn('[ConfigLoader] No project to reload')
    return false
  }

  try {
    projectStore.setLoading(true)
    const project = await loadHmiProject(currentPath)

    if (project) {
      projectStore.loadProject(project)
      console.log('[ConfigLoader] Project reloaded successfully')
      return true
    }

    return false
  } catch (error: any) {
    console.error('[ConfigLoader] Failed to reload project:', error)
    projectStore.setError(error.message)
    return false
  } finally {
    projectStore.setLoading(false)
  }
}

/**
 * Update project file and reload
 * This will be called when receiving a new project from publish API
 * Saves the project to the backend via HTTP API
 */
export async function updateAndReloadProject(newProjectData: ProjectFileDTO): Promise<boolean> {
  const projectStore = useProjectStore()

  try {
    // Convert DTO to Project
    const project = projectFromDTO(newProjectData)

    // Set file path (keep existing or use default)
    const currentFilePath = projectStore.currentProject?.filePath || getHmiProjectPath()
    project.filePath = currentFilePath

    // Configure device service URL based on PLC settings
    setDeviceServiceUrl(project.plcIpAddress, project.plcPort)

    // Save project to backend via HTTP API
    console.log('[ConfigLoader] Saving project to backend...')
    const response = await projectApi.updateProject(newProjectData, currentFilePath)

    if (response.data.code === 200) {
      console.log('[ConfigLoader] Project saved to backend:', response.data.data.path)
      
      // Update file path with the actual save path from backend
      project.filePath = response.data.data.path

      // Load the new project into memory
      projectStore.loadProject(project)

      console.log('[ConfigLoader] Project updated and reloaded successfully')
      return true
    } else {
      throw new Error(response.data.message || 'Failed to save project')
    }
  } catch (error: any) {
    console.error('[ConfigLoader] Failed to update project:', error)
    projectStore.setError(error.message)
    return false
  }
}

/**
 * Publish current project to backend
 * Sends the current project data to the server for persistence
 */
export async function publishProject(): Promise<{ success: boolean; path?: string; error?: string }> {
  const projectStore = useProjectStore()
  const currentProject = projectStore.currentProject

  if (!currentProject) {
    return {
      success: false,
      error: '没有可发布的项目'
    }
  }

  try {
    // Convert Project to DTO for persistence
    const projectDTO = projectToDTO(currentProject)
    
    // Get current file path
    const currentFilePath = currentProject.filePath || getHmiProjectPath()

    console.log('[ConfigLoader] Publishing project to backend...')
    const response = await projectApi.updateProject(projectDTO, currentFilePath)

    if (response.data.code === 200) {
      const savePath = response.data.data.path
      console.log('[ConfigLoader] Project published successfully:', savePath)
      
      // Update project file path
      currentProject.filePath = savePath

      return {
        success: true,
        path: savePath
      }
    } else {
      throw new Error(response.data.message || 'Failed to publish project')
    }
  } catch (error: any) {
    console.error('[ConfigLoader] Failed to publish project:', error)
    return {
      success: false,
      error: error.message || '发布项目失败'
    }
  }
}

/**
 * Project update detection state
 */
let updateDetectionIntervalId: number | null = null
const DEFAULT_CHECK_INTERVAL = 5000 // Check every 5 seconds

/**
 * Extract project name from file path
 * e.g., "public/projects/my-project.hmi" -> "my-project.hmi"
 */
function extractProjectName(filePath?: string): string | null {
  if (!filePath) return null
  
  const parts = filePath.split(/[\\/]/)
  return parts[parts.length - 1] || null
}

/**
 * Check if project has been updated on server
 * Compares version and lastModified timestamp
 */
async function checkProjectUpdate(): Promise<boolean> {
  const projectStore = useProjectStore()
  const currentProject = projectStore.currentProject

  if (!currentProject || !currentProject.filePath) {
    return false
  }

  const projectName = extractProjectName(currentProject.filePath)
  if (!projectName) {
    return false
  }

  try {
    const response = await projectApi.getProjectMeta(projectName)
    
    if (response.data.code === 200 && response.data.data) {
      const serverMeta = response.data.data
      const localVersion = currentProject.version
      const localUpdatedAt = currentProject.updatedAt || 0

      // Detect update by version change or timestamp change
      const versionChanged = serverMeta.version !== localVersion
      const timeChanged = serverMeta.updatedAt > localUpdatedAt

      if (versionChanged || timeChanged) {
        console.log('[ConfigLoader] Project update detected:', {
          localVersion,
          serverVersion: serverMeta.version,
          localUpdatedAt: new Date(localUpdatedAt).toISOString(),
          serverLastModified: new Date(serverMeta.updatedAt).toISOString()
        })
        return true
      }
    }
  } catch (error: any) {
    console.warn('[ConfigLoader] Failed to check for project updates:', error.message)
  }

  return false
}

/**
 * Start automatic project update detection
 * Periodically checks if the project has been updated on the server
 * If an update is detected, automatically reloads the page
 * @param intervalMs - Check interval in milliseconds (default: 5000ms)
 */
export function startUpdateDetection(intervalMs: number = DEFAULT_CHECK_INTERVAL): void {
  // Stop existing detection if running
  stopUpdateDetection()

  const projectStore = useProjectStore()
  if (!projectStore.currentProject) {
    console.warn('[ConfigLoader] Cannot start update detection: No project loaded')
    return
  }

  console.log(`[ConfigLoader] Starting project update detection (interval: ${intervalMs}ms)`)

  updateDetectionIntervalId = window.setInterval(async () => {
    const hasUpdate = await checkProjectUpdate()
    
    if (hasUpdate) {
      console.log('[ConfigLoader] Reloading page due to project update...')

      // Stop detection before reload to prevent multiple reloads
      stopUpdateDetection()
      
      // Reload the page after a short delay to allow log to be seen
      setTimeout(() => {
        window.location.reload()
      }, 500)

    }
  }, intervalMs)
}

/**
 * Stop automatic project update detection
 */
export function stopUpdateDetection(): void {
  if (updateDetectionIntervalId !== null) {
    clearInterval(updateDetectionIntervalId)
    updateDetectionIntervalId = null
    console.log('[ConfigLoader] Stopped project update detection')
  }
}

/**
 * Get current update detection status
 */
export function isUpdateDetectionRunning(): boolean {
  return updateDetectionIntervalId !== null
}
