<!-- src/views/RuntimeView.vue - Main runtime view with Page rendering -->

<template>
  <div class="runtime-view" :style="containerStyle">
    <!-- Loading state -->
    <div v-if="projectStore.isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在加载项目...</p>
    </div>

    <!-- No project loaded state -->
    <div v-else-if="!projectStore.currentProject" class="no-project-state">
      <div class="icon">📱</div>
      <h2>未加载触摸屏程序</h2>
      <p class="hint">请将 .hmi 项目文件放置于 public 目录下，或在配置中设置项目路径</p>
      <button @click="retryLoad" class="retry-button">重新加载</button>
    </div>

    <!-- Error state -->
    <div v-else-if="projectStore.error" class="error-overlay">
      <h2>加载项目失败</h2>
      <p>{{ projectStore.error }}</p>
      <button @click="retryLoad" class="retry-button">重试</button>
    </div>

    <!-- Page content with PageRenderer -->
    <PageRenderer
      v-else-if="currentPage && componentRenderersLoaded"
      :page="currentPage"
      :component-renderers="componentRenderers"
      @component-click="handleComponentClick"
      @page-open="handlePageOpen"
      @page-close="handlePageClose"
      @script-error="handleScriptError"
    />

    <!-- Empty page state -->
    <div v-else-if="projectStore.currentProject && !currentPage" class="empty-state">
      <p>没有可显示的页面</p>
    </div>

    <!-- Script error overlay -->
    <div v-if="scriptError" class="script-error-overlay" @click="dismissScriptError">
      <div class="error-content">
        <div class="error-header">
          <span class="error-icon">⚠️</span>
          <h3>脚本执行错误</h3>
          <button class="close-error-btn" @click.stop="dismissScriptError">×</button>
        </div>
        <div class="error-context">{{ scriptError.context }}</div>
        <div class="error-message">{{ scriptError.message }}</div>
        <div class="error-hint">点击任意位置关闭</div>
      </div>
    </div>

    <!-- Debug panel (toggle with 5 clicks) -->
    <DebugPanel v-if="uiStore.showDebugPanel" />

    <!-- Popup modal for popup pages -->
    <PopupModal
      v-if="popupPage && componentRenderersLoaded"
      :page="popupPage"
      :component-renderers="componentRenderers"
      :show-close-button="true"
      @close="handlePopupClose"
      @component-click="handleComponentClick"
      @page-open="handlePopupOpen"
      @page-close="handlePopupPageClose"
      @script-error="handleScriptError"
    />

    <!-- Toast notifications -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, ref, provide } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useUIStore } from '@/stores/ui'
import { initializeRuntime, startUpdateDetection, stopUpdateDetection } from '@/services/config-loader'
import PageRenderer from '@/components/pages/PageRenderer.vue'
import PopupModal from '@/components/pages/PopupModal.vue'
import DebugPanel from '@/components/DebugPanel.vue'
import ToastContainer from '@/components/base/ToastContainer.vue'
import { componentRegistry } from '@plc/components'
import type { Component } from '@plc/hmi-types'
import { navigationService } from '@/services/navigation-service'
import { toastService } from '@/services/toast-service'

const projectStore = useProjectStore()
const uiStore = useUIStore()

// Provide toast service to all child components
provide('toastService', toastService)

// Script error state
const scriptError = ref<{ message: string; context: string } | null>(null)

// Store loaded component renderers
const componentRenderers = shallowRef<Record<string, any>>({})
const componentRenderersLoaded = shallowRef(false)

// WebSocket unsubscribe function
let wsUnsubscribe: (() => void) | null = null

// Container style based on project resolution
const containerStyle = computed(() => {
  const project = projectStore.currentProject
  if (!project) return {}

  return {
    width: `${project.resolution.width}px`,
    height: `${project.resolution.height}px`
  }
})

// Get current page (Home page has priority, or currentPageId)
const currentPage = computed(() => {
  const project = projectStore.currentProject
  if (!project || !project.pages || project.pages.length === 0) {
    return null
  }

  // First, try to find page by currentPageId
  if (projectStore.currentPageId) {
    const page = project.pages.find(p => p.id === projectStore.currentPageId)
    if (page) {
      return page
    }
  }

  // Fallback to Home page
  const homePage = project.pages.find(p => p.pageType === 'home')
  if (homePage) {
    return homePage
  }

  // Default to first page
  return project.pages[0]
})

// Get current popup page
const popupPage = computed(() => {
  if (!projectStore.currentPopupPageId || !projectStore.currentProject) {
    return null
  }
  return projectStore.currentProject.pages.find(p => p.id === projectStore.currentPopupPageId) || null
})

// Handle component click for debug trigger
const handleComponentClick = (comp: Component) => {
  console.log('[RuntimeView] Component clicked:', comp.name, comp.id)
  uiStore.handleDebugTrigger()
}

// Handle page open event
const handlePageOpen = () => {
  console.log('[RuntimeView] Page opened:', currentPage.value?.name)
}

// Handle page close event
const handlePageClose = () => {
  console.log('[RuntimeView] Page closed:', currentPage.value?.name)
}

// Handle script error
const handleScriptError = (message: string, context: string) => {
  scriptError.value = { message, context }
  console.error(`[Script Error] ${context}: ${message}`)
}

// Dismiss script error
const dismissScriptError = () => {
  scriptError.value = null
}

// Handle popup close event
const handlePopupClose = async () => {
  console.log('[RuntimeView] Popup close requested')
  await navigationService.closePopup()
}

// Handle popup page open event
const handlePopupOpen = () => {
  console.log('[RuntimeView] Popup page opened:', popupPage.value?.name)
}

// Handle popup page close event
const handlePopupPageClose = () => {
  console.log('[RuntimeView] Popup page closed:', popupPage.value?.name)
}

// Retry loading
const retryLoad = async () => {
  projectStore.setError(null)
  await initializeAndLoadComponents()
}

// Initialize runtime and load components
const initializeAndLoadComponents = async () => {
  try {
    const result = await initializeRuntime()

    if (result.projectLoaded && projectStore.currentProject) {
      // Load component renderers for the loaded project
      await loadComponentRenderers(projectStore.currentProject)
      
      // Start automatic project update detection
      startUpdateDetection()
    } else if (!result.projectLoaded) {
      console.log('[RuntimeView] No project file found')
    }
  } catch (error) {
    console.error('[RuntimeView] Failed to initialize:', error)
    projectStore.setError('初始化失败')
  }
}

// Load component renderers for types used in project
const loadComponentRenderers = async (project: any) => {
  const componentTypes = new Set<string>()

  // Collect all unique component types from all pages
  project.pages.forEach((page: any) => {
    if (page.components && Array.isArray(page.components)) {
      page.components.forEach((comp: any) => {
        componentTypes.add(comp.type)
      })
    }
  })

  console.log('[RuntimeView] Loading component types:', Array.from(componentTypes))

  // Load each component type
  const renderers: Record<string, any> = {}
  for (const type of componentTypes) {
    const component = await componentRegistry.getComponent(type)
    if (component) {
      renderers[type] = component
    } else {
      console.warn(`[RuntimeView] Component type '${type}' not found`)
    }
  }

  componentRenderers.value = renderers
  componentRenderersLoaded.value = true
  console.log('[RuntimeView] Loaded renderers:', Object.keys(renderers))
}

// Lifecycle
onMounted(async () => {
  console.log('[RuntimeView] Mounted')

  // Initialize runtime by loading .hmi project file
  await initializeAndLoadComponents()

  // Connect to WebSocket for project update notifications
  // todo: 后端尚未实现
  /*
  projectWebSocket.connect()

  // Register handler for project updates (optional, for custom handling)
  wsUnsubscribe = projectWebSocket.onProjectUpdate((data) => {
    console.log('[RuntimeView] Project update received:', data)
    // The project-websocket service already handles auto-reload
    // This handler is for any additional custom logic
  })
    */
})

// Cleanup on unmount
onUnmounted(() => {
  // Stop project update detection
  stopUpdateDetection()
  
  if (wsUnsubscribe) {
    //wsUnsubscribe()
  }
  //projectWebSocket.disconnect()
  console.log('[RuntimeView] Unmounted, WebSocket disconnected')
})
</script>

<style scoped>
.runtime-view {
  position: relative;
  margin: 0 auto;
  background-color: var(--color-background);
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.loading-overlay,
.error-overlay,
.empty-state,
.no-project-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text);
  text-align: center;
  padding: 2rem;
}

.no-project-state .icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-project-state h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #666;
}

.no-project-state .hint {
  font-size: 0.9rem;
  color: #999;
  margin-bottom: 1.5rem;
  max-width: 400px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-overlay h2 {
  color: #ef4444;
  margin-bottom: 1rem;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: var(--color-primary-dark);
}

.script-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  cursor: pointer;
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.error-content {
  background-color: #1e1e1e;
  border: 2px solid #ef4444;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 80%;
  max-height: 80%;
  overflow: auto;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
  cursor: default;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #333;
}

.error-icon {
  font-size: 1.5rem;
}

.error-header h3 {
  color: #ef4444;
  margin: 0;
  flex: 1;
  font-size: 1.2rem;
}

.close-error-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-error-btn:hover {
  color: #fff;
}

.error-context {
  color: #fbbf24;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-family: 'Courier New', monospace;
  background-color: rgba(251, 191, 36, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid #fbbf24;
}

.error-message {
  color: #fca5a5;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  background-color: rgba(239, 68, 68, 0.1);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.error-hint {
  color: #666;
  font-size: 0.8rem;
  text-align: center;
  font-style: italic;
}
</style>
