<!-- src/components/pages/PopupModal.vue - Popup modal component for popup pages -->

<template>
  <div class="popup-modal" @click.self="handleOverlayClick">
    <div class="popup-content" :style="popupStyle">
      <!-- Close button -->
      <button v-if="showCloseButton" class="popup-close-btn" @click="handleClose" title="关闭">
        ×
      </button>

      <!-- Page content wrapper with explicit size -->
      <div class="popup-page-container" :style="containerStyle">
        <PageRenderer
          v-if="page"
          :page="page"
          :component-renderers="componentRenderers"
          @component-click="handleComponentClick"
          @page-open="handlePageOpen"
          @page-close="handlePageClose"
          @script-error="handleScriptError"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Page } from '@plc/hmi-types'
import type { Component } from '@plc/hmi-types'
import PageRenderer from './PageRenderer.vue'

const props = defineProps<{
  page: Page
  componentRenderers: Record<string, any>
  showCloseButton?: boolean
}>()

const emit = defineEmits<{
  close: [result?: any]
  componentClick: [component: Component]
  pageOpen: []
  pageClose: []
  scriptError: [error: string, context: string]
}>()

// Default showCloseButton to true
const showCloseButton = computed(() => props.showCloseButton !== false)

// Popup style based on page properties
const popupStyle = computed(() => {
  const { backgroundColor, width, height } = props.page.properties
  const style: Record<string, string | number> = {
    backgroundColor: backgroundColor.useTheme ? 'var(--color-background)' : (backgroundColor.customColor || '#ffffff'),
  }

  // Apply width and height if defined (only for popup pages)
  if (width !== undefined && width !== null) {
    style.width = `${width}px`
  }
  if (height !== undefined && height !== null) {
    style.height = `${height}px`
  }

  return style
})

// Container style to match project resolution
const containerStyle = computed(() => {
  const { width, height } = props.page.properties
  if (width !== undefined && width !== null && height !== undefined && height !== null) {
    return {
      width: `${width}px`,
      height: `${height}px`,
    }
  }
  // Fallback to project resolution if available
  return {}
})

// Handle overlay click (close on backdrop click)
const handleOverlayClick = () => {
  handleClose()
}

// Handle close button click
const handleClose = () => {
  emit('close')
}

// Handle component click
const handleComponentClick = (comp: Component) => {
  emit('componentClick', comp)
}

// Handle page open event
const handlePageOpen = () => {
  emit('pageOpen')
}

// Handle page close event
const handlePageClose = () => {
  emit('pageClose')
}

// Handle script error
const handleScriptError = (message: string, context: string) => {
  emit('scriptError', message, context)
}
</script>

<style scoped>
.popup-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.popup-content {
  position: relative;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.popup-close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border: none;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  z-index: 10000;
}

.popup-close-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.popup-page-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
