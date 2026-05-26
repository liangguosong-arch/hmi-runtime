// src/services/navigation-service.ts - Navigation service for page management

import { useProjectStore } from '@/stores/project'
import type { Page } from '@plc/hmi-types'
import type { PopupOptions, OpenPageResult, Navigation } from '@plc/components'

class NavigationService implements Navigation {
  private pageStack: string[] = []  // Page history stack for normal pages
  private pageParams: Map<string, any> = new Map()  // Page parameters
  private currentPopup: { pageId: string; options?: PopupOptions } | null = null  // Current popup state
  private popupCloseHandlers: Map<string, (result?: any) => boolean | void> = new Map()  // Popup close handlers

  /**
   * Get page object by ID
   */
  private getPage(pageId: string): Page | null {
    const projectStore = useProjectStore()
    const project = projectStore.currentProject
    if (!project || !project.pages) return null
    return project.pages.find(p => p.id === pageId) || null
  }

  /**
   * Check if a page is a popup page
   */
  private isPopupPage(pageId: string): boolean {
    const page = this.getPage(pageId)
    return page?.pageType === 'popup'
  }

  /**
   * Execute page onClose script and return the result
   */
  private async executeOnCloseScript(page: Page): Promise<boolean> {
    const onCloseScript = page._events?.onClose || page._events?.onClose
    if (!onCloseScript) {
      return true  // No script defined, allow closing by default
    }

    try {
      // Import script engine dynamically to avoid circular dependencies
      const { scriptEngine } = await import('@/services/script-engine')
      const { buildScriptContext } = await import('@/services/script-context')

      const projectStore = useProjectStore()
      const project = projectStore.currentProject
      if (!project) return true

      const pageContext = buildScriptContext(project, page)
      const result = await scriptEngine.run(onCloseScript, pageContext)

      if (result.success) {
        // If the script returns a value, use it as the close decision
        // Return true to close, false to keep open
        return result.returnValue !== false
      } else {
        console.error(`[Navigation] onClose script error: ${result.error}`)
        return true  // On error, allow closing
      }
    } catch (error: any) {
      console.error(`[Navigation] Failed to execute onClose script: ${error.message}`)
      return true  // On exception, allow closing
    }
  }

  /**
   * Execute page onOpen script
   */
  private async executeOnOpenScript(page: Page): Promise<void> {
    const onOpenScript = page._events?.onOpen || page._events?.onOpen
    if (!onOpenScript) {
      return  // No script defined
    }

    try {
      // Import script engine dynamically to avoid circular dependencies
      const { scriptEngine } = await import('@/services/script-engine')
      const { buildScriptContext } = await import('@/services/script-context')

      const projectStore = useProjectStore()
      const project = projectStore.currentProject
      if (!project) return

      const pageContext = buildScriptContext(project, page)
      const result = await scriptEngine.run(onOpenScript, pageContext)

      if (result.success) {
        console.log(`[Navigation] onOpen script executed successfully for page: ${page.name}`)
      } else {
        console.error(`[Navigation] onOpen script error: ${result.error}`)
      }
    } catch (error: any) {
      console.error(`[Navigation] Failed to execute onOpen script: ${error.message}`)
    }
  }

  /**
   * Update page params on the Page object
   */
  private updatePageParams(pageId: string, params: Record<string, any>): void {
    const projectStore = useProjectStore()
    const project = projectStore.currentProject
    if (!project) return

    const page = project.pages.find(p => p.id === pageId)
    if (page) {
      page.params = params
    }
  }

  /**
   * Open a page (handles both normal and popup pages)
   */
  async openPage(pageId: string, params?: Record<string, any>, options?: PopupOptions): Promise<OpenPageResult> {
    const projectStore = useProjectStore()
    const currentPageId = projectStore.currentPageId

    // Check if target page is a popup
    const isPopup = this.isPopupPage(pageId)
    const targetPage = this.getPage(pageId)

    if (isPopup && targetPage) {
      // For popup pages, don't change current page, just show popup
      console.log(`[Navigation] Opening popup page: ${pageId}`)

      // Store popup state
      this.currentPopup = { pageId, options }

      // Store and update page parameters
      if (params) {
        this.pageParams.set(pageId, params)
        this.updatePageParams(pageId, params)
      }

      // Store close handler if provided
      if (options?.onClose) {
        this.popupCloseHandlers.set(pageId, options.onClose)
      }

      // Trigger popup display through store
      projectStore.setPopupPage(pageId)

      // Execute onOpen script after showing popup
      await this.executeOnOpenScript(targetPage)

      return {
        isPopup: true,
        pageId,
        close: (result?: any) => this.closePopup(pageId, result)
      }
    } else if (targetPage) {
      // For normal pages, check if current page allows closing

      // For normal pages, navigate as usual
      console.log(`[Navigation] Opening normal page: ${pageId}`)

      // Push current page to stack (only if it's not a popup)
      if (currentPageId && !this.currentPopup) {
        this.pageStack.push(currentPageId)
      }

      // Store and update page parameters
      if (params) {
        this.pageParams.set(pageId, params)
        this.updatePageParams(pageId, params)
      }

      // Navigate to new page
      projectStore.setCurrentPage(pageId)

      // Execute onOpen script after navigation
      await this.executeOnOpenScript(targetPage)

      return {
        isPopup: false,
        pageId
      }
    } else {
      // Page not found
      console.warn(`[Navigation] Page '${pageId}' not found`)
      return {
        isPopup: false,
        pageId
      }
    }
  }

  /**
   * Close current popup
   */
  async closePopup(pageId?: string, result?: any): Promise<boolean> {
    const targetPageId = pageId || this.currentPopup?.pageId
    if (!targetPageId) {
      console.warn('[Navigation] No popup to close')
      return true
    }

    const page = this.getPage(targetPageId)
    if (!page) {
      console.warn(`[Navigation] Popup page ${targetPageId} not found`)
      return true
    }

    // Execute page's onClose script first
    const shouldCloseFromScript = await this.executeOnCloseScript(page)
    if (shouldCloseFromScript === false) {
      console.log(`[Navigation] onClose script returned false, keeping popup open`)
      return false
    }

    // Execute custom onClose handler if provided
    const customHandler = this.popupCloseHandlers.get(targetPageId)
    if (customHandler) {
      try {
        const shouldClose = customHandler(result)
        if (shouldClose === false) {
          console.log(`[Navigation] Custom onClose handler returned false, keeping popup open`)
          return false
        }
      } catch (error: any) {
        console.error(`[Navigation] Error in custom onClose handler: ${error.message}`)
        // Continue with closing on error
      }
    }

    // Close the popup
    const projectStore = useProjectStore()
    projectStore.setPopupPage(null)
    this.currentPopup = null
    this.popupCloseHandlers.delete(targetPageId)

    console.log(`[Navigation] Closed popup: ${targetPageId}`)
    return true
  }

  /**
   * Close current page and go back
   */
  async back(): Promise<void> {
    // If there's a popup, close it first
    if (this.currentPopup) {
      await this.closePopup()
      return
    }

    const projectStore = useProjectStore()
    const currentPageId = projectStore.currentPageId

    // Check onClose event for current page before navigating away
    if (currentPageId) {
      const currentPage = this.getPage(currentPageId)
      if (currentPage) {
        const shouldClose = await this.executeOnCloseScript(currentPage)
        if (shouldClose === false) {
          console.log(`[Navigation] onClose script returned false, staying on page: ${currentPageId}`)
          return  // Prevent navigation
        }
      }
    }

    if (this.pageStack.length > 0) {
      const previousPage = this.pageStack.pop()!
      projectStore.setCurrentPage(previousPage)
      console.log(`[Navigation] Went back to page: ${previousPage}`)
    } else {
      console.warn('[Navigation] No previous page in history')
    }
  }

  /**
   * back to home page
   */
  async home(): Promise<void> {
    const projectStore = useProjectStore()
    const homePage = projectStore.homePage
    if (homePage) {
      await this.openPage(homePage.id)
    } else {
      console.warn('[Navigation] No home page defined')
    }
  }

  /**
   * Close current page (alias for back)
   */
  async closePage(): Promise<void> {
    await this.back()
  }

  /**
   * Reload current page
   */
  reload(): void {
    const projectStore = useProjectStore()
    const currentPage = projectStore.currentPageId

    if (currentPage) {
      // Clear parameters for current page
      this.pageParams.delete(currentPage)

      // Re-set the same page to trigger re-render
      projectStore.setCurrentPage('')
      setTimeout(() => {
        projectStore.setCurrentPage(currentPage)
      }, 0)

      console.log(`[Navigation] Reloaded page: ${currentPage}`)
    }
  }

  /**
   * Get current page parameters
   */
  getParams(): Record<string, any> {
    const projectStore = useProjectStore()

    // Check popup first
    if (this.currentPopup) {
      return this.pageParams.get(this.currentPopup.pageId) || {}
    }

    const currentPage = projectStore.currentPageId
    return this.pageParams.get(currentPage) || {}
  }

  /**
   * Clear navigation history
   */
  clearHistory(): void {
    this.pageStack = []
    this.pageParams.clear()
    this.currentPopup = null
    this.popupCloseHandlers.clear()
    console.log('[Navigation] History cleared')
  }

  /**
   * Get history stack size
   */
  getHistorySize(): number {
    return this.pageStack.length
  }

  /**
   * Check if a popup is currently open
   */
  hasPopup(): boolean {
    return this.currentPopup !== null
  }

  /**
   * Get current popup page ID
   */
  getCurrentPopupPageId(): string | null {
    return this.currentPopup?.pageId || null
  }
}

// Singleton instance
export const navigationService = new NavigationService()
