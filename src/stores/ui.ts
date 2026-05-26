// src/stores/ui.ts - UI state management

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State

  const showDebugPanel = ref(false)
  const debugClickCount = ref(0)
  const lastDebugClickTime = ref(0)
  const isFullscreen = ref(false)


  function toggleDebugPanel() {
    showDebugPanel.value = !showDebugPanel.value
  }

  /**
   * Handle debug panel trigger (5 clicks in 2 seconds)
   */
  function handleDebugTrigger(): boolean {
    const now = Date.now()
    const timeDiff = now - lastDebugClickTime.value

    // Reset if too much time passed
    if (timeDiff > 2000) {
      debugClickCount.value = 1
    } else {
      debugClickCount.value++
    }

    lastDebugClickTime.value = now

    // Trigger after 5 clicks
    if (debugClickCount.value >= 5) {
      showDebugPanel.value = !showDebugPanel.value
      debugClickCount.value = 0
      return true
    }

    return false
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        isFullscreen.value = true
      }).catch(err => {
        console.error('[UIStore] Failed to enter fullscreen:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        isFullscreen.value = false
      })
    }
  }

  return {
    // State
    showDebugPanel,
    debugClickCount,
    lastDebugClickTime,
    isFullscreen,
    // Actions
    toggleDebugPanel,
    handleDebugTrigger,
    toggleFullscreen
  }
})
