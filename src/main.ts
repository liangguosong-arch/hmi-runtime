// src/main.ts - Application entry point

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { registerComponents, createRuntimeEnvironment } from '@plc/components'
import { variableScheduler } from './services/variable-scheduler'
import { scriptEngine } from './services/script-engine'
import { apiClient, deviceApiClient, authApi } from './services/api'
import { toastService } from './services/toast-service'



// Create Vue app
const app = createApp(App)

// Use Pinia for state management
const pinia = createPinia()
app.use(pinia)

// Initialize auth store and load session from storage
const authStore = useAuthStore()
authStore.loadSessionFromStorage()

// Use Vue Router
app.use(router)

// Register all runtime components and mount app
async function initApp() {
  await registerComponents()
  
  // Create API clients object
  const apiClients = {
    apiClient,
    deviceApiClient,
    authApi,
  }
  
  // Create and provide Runtime environment
  const runtimeEnv = createRuntimeEnvironment({
    scheduler: variableScheduler,
    scriptEngine: scriptEngine,
    api: apiClients,
    authStore: authStore,
    toastService: toastService,
  })
  app.provide('componentEnvironment', runtimeEnv)
  
  // Mount app
  app.mount('#app')
  
  console.log('[HMI Runtime] Application started')
}

initApp()
