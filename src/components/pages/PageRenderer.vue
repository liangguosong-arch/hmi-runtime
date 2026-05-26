<!-- src/components/pages/PageRenderer.vue - Page container component -->

<template>
  <div class="page-renderer" :style="pageStyle">
    <!-- Background image -->
    <div v-if="backgroundImage" class="background-image" :style="backgroundStyle"></div>

    <!-- Render all components in the page -->
    <component
      v-for="comp in sortedComponents"
      :key="comp.id"
      :is="getComponentRenderer(comp.type)"
      :instance="comp"
      @component-click="handleComponentClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef, onMounted, onUnmounted, provide, reactive } from 'vue'
import type { Page } from '@plc/hmi-types'
import type { Component } from '@plc/hmi-types'
import type { ScriptExecutionResult } from '@plc/hmi-types/script'
import { resolveColor } from '@plc/components'

import { scriptEngine } from '@/services/script-engine'
import { buildScriptContext } from '@/services/script-context'
import { useProjectStore } from '@/stores/project'
import { navigationService } from '@/services/navigation-service'

const props = defineProps<{
  page: Page
  componentRenderers: Record<string, any>
}>()

const emit = defineEmits<{
  componentClick: [component: Component]
  pageOpen: []
  pageClose: []
  scriptError: [error: string, context: string]
}>()

const projectStore = useProjectStore()

// Component display state management (for container-controlled visibility)
// Key: component ID, Value: display state (true = visible, false = hidden)
const componentDisplayState = reactive<Record<string, boolean>>({})

// Initialize display state for all components (default to true)
onMounted(() => {
  props.page.components.forEach(comp => {
    comp.display = true
  })
})

// Get component display state
/*
function getComponentDisplay(compId: string): boolean {
  return componentDisplayState[compId] ?? true
}

// Set component display state
function setComponentDisplay(compId: string, display: boolean) {
  componentDisplayState[compId] = display
}
*/
// Get child components of a parent container (by parentId)
function getChildComponents(parentId: string): Component[] {
  return props.page.components.filter(comp => comp.parentId?.startsWith(parentId))
}

// Sort components by zIndex
const sortedComponents = computed(() => {
  return [...props.page.components].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
})

// Get component renderer
const getComponentRenderer = (type: string) => {
  return props.componentRenderers[type] || 'div'
}

// Handle component click
const handleComponentClick = (comp: Component) => {
  emit('componentClick', comp)
}

// Page background style
const pageStyle = computed(() => {
  const { backgroundColor } = props.page.properties
  return {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: resolveColor(backgroundColor)
  }
})

// Background image
const backgroundImage = computed(() => {
  return props.page.properties.backgroundImage
})

// Background image style
const backgroundStyle = computed(() => {
  const { backgroundRepeat, backgroundSize } = props.page.properties
  return {
    backgroundImage: backgroundImage.value ? `url(${backgroundImage.value})` : 'none',
    backgroundRepeat: backgroundRepeat || 'no-repeat',
    backgroundSize: backgroundSize || 'cover',
    backgroundPosition: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    pointerEvents: 'none'
  }
})

// Show grid (can be controlled by props or settings)
const showGrid = computed(() => {
  return false // Set to true for debugging
})

// Execute page script
async function executePageScript(script: string, context: string): Promise<void> {
  if (!script || !projectStore.currentProject) return

  try {
    const project = projectStore.currentProject
    const pageContext = buildScriptContext(project, props.page)

    const result = await scriptEngine.run(script, pageContext)

    if (!result.success) {
      const errorMsg = `[${context}] Script error: ${result.error}${result.errorLine ? ` at line ${result.errorLine}` : ''}`
      console.error(errorMsg)
      emit('scriptError', errorMsg, context)
    } else {
      console.log(`[${context}] Script executed successfully in ${result.executionTime?.toFixed(2)}ms`)
    }
  } catch (error: any) {
    const errorMsg = `[${context}] Script execution failed: ${error.message}`
    console.error(errorMsg)
    emit('scriptError', errorMsg, context)
  }
}

// Execute component script with custom context
async function executeComponentScript(
  script: string,
  context: string,
  customContext?: any
): Promise<ScriptExecutionResult> {
  if (!script || !projectStore.currentProject) return { success: false }

  try {
    // Find the component instance from the customContext or use current page
    const project = projectStore.currentProject
    let currentPage = props.page

    // If customContext has component info, find its page
    if (customContext?.component) {
      for (const page of project.pages) {
        if (page.components.some((c: any) => c.id === customContext.component.id)) {
          currentPage = page
          break
        }
      }
    }

    // Use custom context if provided, otherwise build default context
    const scriptContext = buildScriptContext(project, currentPage, customContext?.component, customContext?.event)
    const result = await scriptEngine.run(script, scriptContext)

    if (!result.success) {
      const errorMsg = `[${context}] Script error: ${result.error}${result.errorLine ? ` at line ${result.errorLine}` : ''}`
      console.error(errorMsg)
      emit('scriptError', errorMsg, context)
    } else {
      console.log(`[${context}] Script executed successfully in ${result.executionTime?.toFixed(2)}ms`)
    }
    return result
  } catch (error: any) {
    const errorMsg = `[${context}] Script execution failed: ${error.message}`
    console.error(errorMsg)
    emit('scriptError', errorMsg, context)
    return { success: false }
  }
}

// Execute event script by event name (convenience method)
async function executeEventScript(eventName: string, customContext?: any): Promise<ScriptExecutionResult> {
  // Get component instance from customContext
  const component = customContext?.component
  if (!component) {
    console.warn('[PageRenderer] No component found in context for event execution')
    return { success: false }
  }

  const script = component._events?.[eventName]
  if (!script) {
    console.log(`[PageRenderer] No script defined for event: ${eventName}`)
    return { success: false }
  }

  const context = `Component.${component.name}.${eventName}`
  return await executeComponentScript(script, context, customContext)
}

// Provide methods to child components
provide('executeComponentScript', executeComponentScript)
provide('executeEventScript', executeEventScript)

provide('getChildComponents', getChildComponents)
provide('navigationService', navigationService)

onMounted(async () => {
  console.log(`[PageRenderer] Page loaded: ${props.page.name} (${props.page.pageType})`)

  // Execute onOpen script if defined (support both events and _events for compatibility)
  const onOpenScript = props.page._events?.onOpen
  if (onOpenScript) {
    console.log('[PageRenderer] Executing onOpen script')
    await executePageScript(onOpenScript, 'Page.onOpen')
  }

  emit('pageOpen')
})

onUnmounted(async () => {
  console.log(`[PageRenderer] Page unmounting: ${props.page.name}`)

  // Execute onClose script if defined (support both events and _events for compatibility)
  const onCloseScript = props.page._events?.onClose
  if (onCloseScript) {
    console.log('[PageRenderer] Executing onClose script')
    await executePageScript(onCloseScript, 'Page.onClose')
  }

  emit('pageClose')
})
</script>

<style scoped>
.page-renderer {
  position: relative;
  contain: strict;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 9999;
}

.background-image {
  pointer-events: none;
}
</style>
