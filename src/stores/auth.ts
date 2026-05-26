// src/stores/auth.ts - Authentication state management

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface SessionData {
  username: string
  displayName: string
  userId: string
  token: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const sessionData = ref<SessionData | null>(null)
  const isAuthenticated = computed(() => sessionData.value !== null)
  
  // Getters
  const currentUser = computed(() => sessionData.value)
  const currentUsername = computed(() => sessionData.value?.username || '')
  const currentDisplayName = computed(() => sessionData.value?.displayName || '')
  const currentRole = computed(() => sessionData.value?.role || '')
  const currentToken = computed(() => sessionData.value?.token || '')

  // Actions
  function setSession(data: SessionData) {
    sessionData.value = data
    // Also persist to localStorage for page refresh persistence
    localStorage.setItem('sessionData', JSON.stringify(data))
  }

  function clearSession() {
    sessionData.value = null
    localStorage.removeItem('sessionData')
  }

  function loadSessionFromStorage() {
    const stored = localStorage.getItem('sessionData')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SessionData
        sessionData.value = parsed
      } catch (e) {
        console.error('[AuthStore] Failed to parse session data from storage:', e)
        localStorage.removeItem('sessionData')
      }
    }
  }

  return {
    // State
    sessionData,
    isAuthenticated,
    // Getters
    currentUser,
    currentUsername,
    currentDisplayName,
    currentRole,
    currentToken,
    // Actions
    setSession,
    clearSession,
    loadSessionFromStorage
  }
})