// src/stores/project.ts - Project state management

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project } from '@plc/hmi-types'

import { applyProjectTheme } from '@plc/components'

export const useProjectStore = defineStore('project', () => {
  // State
  const currentProject = ref<Project | null>(null)
  const currentPageId = ref<string>('')
  const currentPopupPageId = ref<string | null>(null)  // Current popup page ID
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const homePage = computed(() => {
    if (!currentProject.value) return null
    return currentProject.value.pages.find(p => p.pageType === 'home')
  })

  const currentPage = computed(() => {
    if (!currentProject.value || !currentPageId.value) {
      // If no currentPageId, try to get home page first
      if (currentProject.value) {
        return homePage.value || currentProject.value.pages[0] || null
      }
      return null
    }
    return currentProject.value.pages.find(p => p.id === currentPageId.value)
  })

  const pages = computed(() => {
    return currentProject.value?.pages || []
  })

  const components = computed(() => {
    return currentPage.value?.components || []
  })

  // Actions
  function loadProject(project: Project) {
    currentProject.value = project
    applyProjectTheme(project)
    // Set current page: prefer home page, then currentPageId, then first page
    const homePage = project.pages.find(p => p.pageType === 'home')
    if (homePage) {
      currentPageId.value = homePage.id
    } else if (project.currentPageId) {
      currentPageId.value = project.currentPageId
    } else {
      currentPageId.value = project.pages[0]?.id || ''
    }
    
    error.value = null
    console.log(`[ProjectStore] Project loaded: ${project.name}, Current page: ${currentPageId.value}`)
  }

  function setCurrentPage(pageId: string) {
    const page = currentProject.value?.pages.find(p => p.id === pageId)
    if (page) {
      currentPageId.value = pageId
    } else {
      console.warn(`[ProjectStore] Page '${pageId}' not found`)
    }
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(message: string | null) {
    error.value = message
  }

  function clearProject() {
    currentProject.value = null
    currentPageId.value = ''
    currentPopupPageId.value = null
    error.value = null
  }

  function setPopupPage(pageId: string | null) {
    currentPopupPageId.value = pageId
    if (pageId) {
      console.log(`[ProjectStore] Popup page opened: ${pageId}`)
    } else {
      console.log(`[ProjectStore] Popup page closed`)
    }
  }

  return {
    // State
    currentProject,
    currentPageId,
    currentPopupPageId,
    isLoading,
    error,
    // Getters
    homePage,
    currentPage,
    pages,
    components,
    // Actions
    loadProject,
    setCurrentPage,
    setPopupPage,
    setLoading,
    setError,
    clearProject
  }
})
