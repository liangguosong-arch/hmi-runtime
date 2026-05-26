<!-- src/App.vue - Root component -->

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()

// Theme class for root element (TODO: implement theme system)
// const themeClass = computed(() => `theme-${uiStore.theme}`)

// Initialize application
onMounted(async () => {
  console.log('[App] Initializing HMI Runtime...')

  try {

    console.log('[App] Initialization complete')
  } catch (error) {
    console.error('[App] Initialization failed:', error)
  }
})
</script>

<style>
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
}

/* Theme variables are applied via CSS custom properties */
/* See @plc/components/theme.ts for theme definitions */
</style>
