// src/services/script-context.ts - Script context builder and API wrappers

import type {
  ScriptContext,
  ProjectAPI,
  PageAPI,
  ComponentProxy,
  DeviceAPI,
  HttpAPI,
  ConsoleAPI,
  EventContext,
} from '@plc/hmi-types/script'
import type { Project, Page } from '@plc/hmi-types'
import type { Component } from '@plc/hmi-types'
import { variableScheduler } from '@/services/variable-scheduler'
import { navigationService } from '@/services/navigation-service'
import axios from 'axios'

/**
 * Context cache to maintain state across script executions
 */
interface ContextCache {
  projectAPI: Map<string, ProjectAPI>  // key: project.id
  pageAPI: Map<string, PageAPI>        // key: page.id
  componentProxy: Map<string, ComponentProxy>  // key: component.id
  deviceAPI: DeviceAPI | null
  httpAPI: HttpAPI | null
  consoleAPI: ConsoleAPI | null
  globalVariables: Map<string, Record<string, any>>  // key: project.id
}

const contextCache: ContextCache = {
  projectAPI: new Map(),
  pageAPI: new Map(),
  componentProxy: new Map(),
  deviceAPI: null,
  httpAPI: null,
  consoleAPI: null,
  globalVariables: new Map()
}

/**
 * Create Project API (cached)
 */
export function createProjectAPI(project: Project): ProjectAPI {
  // Check cache first
  const cached = contextCache.projectAPI.get(project.id)
  if (cached) {
    return cached
  }

  // Initialize global variables for this project
  if (!contextCache.globalVariables.has(project.id)) {
    contextCache.globalVariables.set(project.id, {})
  }
  const globalVariables = contextCache.globalVariables.get(project.id)!

  const projectAPI: ProjectAPI = {
    id: project.id,
    name: project.name,
    version: project.version,
    resolution: project.resolution,

    getVariable(name: string): any {
      return globalVariables[name]
    },

    setVariable(name: string, value: any): void {
      globalVariables[name] = value
    },

    getResource(name: string): any {
      // TODO: Implement resource access
      console.warn(`[Script] Resource '${name}' not implemented`)
      return null
    }
  }

  // Cache the API object
  contextCache.projectAPI.set(project.id, projectAPI)
  return projectAPI
}

/**
 * Create Component Proxy
 */
export function createComponentProxy(
  component: Component,
  page: Page
): ComponentProxy {
  return {
    get id() { return component.id },
    get type() { return component.type },
    get name() { return component.name },

    get visible() { return component.visible ?? true },
    set visible(value: boolean) { component.visible = value },

    get x() { return component.x },
    set x(value: number) { component.x = value },

    get y() { return component.y },
    set y(value: number) { component.y = value },

    get width() { return component.width },
    set width(value: number) { component.width = value },

    get height() { return component.height },
    set height(value: number) { component.height = value },

    getValue(): any {
      // If variable is bound, return variable value
      if (component.properties.variable) {
        return variableScheduler.getValue(component.properties.variable)
      }
      return component.properties.value
    },

    setValue(value: any): void {
      // If variable is bound, write to variable
      if (component.properties.variable) {
        variableScheduler.write(component.properties.variable, value)
      } else {
        component.properties.value = value
      }
    },

    getText(): string {
      return component.properties.text || ''
    },

    setText(text: string): void {
      component.properties.text = text
    },

    getColor(): string {
      const color = component.properties.color
      if (!color) return '#000000'

      if (color.useTheme && color.themeColorKey) {
        // Return theme color key, runtime will resolve it
        return `var(--color-${color.themeColorKey})`
      }
      return color.customColor || '#000000'
    },

    setColor(color: string): void {
      component.properties.color = {
        useTheme: false,
        customColor: color
      }
    },

    getBackgroundColor(): string {
      const bgColor = component.properties.backgroundColor
      if (!bgColor) return 'transparent'

      if (bgColor.useTheme && bgColor.themeColorKey) {
        return `var(--color-${bgColor.themeColorKey})`
      }
      return bgColor.customColor || 'transparent'
    },

    setBackgroundColor(color: string): void {
      component.properties.backgroundColor = {
        useTheme: false,
        customColor: color
      }
    },

    getProperty(key: string): any {
      return component.properties[key]
    },

    setProperty(key: string, value: any): void {
      component.properties[key] = value
    }
  }
}

/**
 * Create Page API
 */
export function createPageAPI(page: Page): PageAPI {
  return {
    id: page.id,
    name: page.name,
    pageType: page.pageType,
    get params(): Record<string, any> {
      return page.params || {}
    },

    getProperty(key: string): any {
      return (page.properties as any)[key]
    },

    setProperty(key: string, value: any): void {
      (page.properties as any)[key] = value
    },

    getComponent(componentId: string): ComponentProxy | null {
      const component = page.components.find(c => c.id === componentId)
      if (component) {
        return createComponentProxy(component, page)
      }
      return null
    },

    getComponents(): ComponentProxy[] {
      return page.components.map(comp => createComponentProxy(comp, page))
    }
  }
}

/**
 * Create Device API
 */
export function createDeviceAPI(): DeviceAPI {
  return {
    read(address: string): any {
      return variableScheduler.getValue(address)
    },

    async write(address: string, value: any): Promise<void> {
      await variableScheduler.write(address, value)
    },

    readBatch(addresses: string[]): Record<string, any> {
      const result: Record<string, any> = {}
      for (const addr of addresses) {
        result[addr] = variableScheduler.getValue(addr)
      }
      return result
    },

    async writeBatch(writes: Array<{ address: string; value: any }>): Promise<void> {
      await variableScheduler.batchWrite(writes)
    }
  }
}

/**
 * Create HTTP API
 */
export function createHttpAPI(): HttpAPI {
  return {
    async get(url: string, options?: any) {
      try {
        const response = await axios.get(url, {
          headers: options?.headers,
          timeout: options?.timeout || 5000
        })

        return {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          async json() { return response.data },
          async text() { return String(response.data) }
        }
      } catch (error: any) {
        throw new Error(`HTTP GET failed: ${error.message}`)
      }
    },

    async post(url: string, data?: any, options?: any) {
      try {
        const response = await axios.post(url, data, {
          headers: options?.headers,
          timeout: options?.timeout || 5000
        })

        return {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          async json() { return response.data },
          async text() { return String(response.data) }
        }
      } catch (error: any) {
        throw new Error(`HTTP POST failed: ${error.message}`)
      }
    },

    async put(url: string, data?: any, options?: any) {
      try {
        const response = await axios.put(url, data, {
          headers: options?.headers,
          timeout: options?.timeout || 5000
        })

        return {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          async json() { return response.data },
          async text() { return String(response.data) }
        }
      } catch (error: any) {
        throw new Error(`HTTP PUT failed: ${error.message}`)
      }
    },

    async delete(url: string, options?: any) {
      try {
        const response = await axios.delete(url, {
          headers: options?.headers,
          timeout: options?.timeout || 5000
        })

        return {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          async json() { return response.data },
          async text() { return String(response.data) }
        }
      } catch (error: any) {
        throw new Error(`HTTP DELETE failed: ${error.message}`)
      }
    }
  }
}

/**
 * Create Console API
 */
export function createConsoleAPI(): ConsoleAPI {
  return {
    log(...args: any[]) {
      console.log('[Script]', ...args)
    },

    warn(...args: any[]) {
      console.warn('[Script]', ...args)
    },

    error(...args: any[]) {
      console.error('[Script]', ...args)
    },

    info(...args: any[]) {
      console.info('[Script]', ...args)
    }
  }
}

/**
 * Build complete script context
 */
export function buildScriptContext(
  project: Project,
  page: Page,
  component?: Component,
  event?: EventContext
): ScriptContext {
  return {
    $project: createProjectAPI(project),
    $page: createPageAPI(page),
    $event: event ? { type: event.type, data: event.data} : null,
    $component: component ? createComponentProxy(component, page) : null,
    $device: createDeviceAPI(),
    $http: createHttpAPI(),
    $timer: {} as any, // Will be created by interpreter
    $navigation: {
      async openPage(pageId: string, params?: Record<string, any>): Promise<void> {
        await navigationService.openPage(pageId, params)
      },
      async closePage(): Promise<void> {
        await navigationService.closePage()
      },
      async back(): Promise<void> {
        await navigationService.back()
      },
      reload: () => navigationService.reload(),
      getParams: () => navigationService.getParams()
    },
    console: createConsoleAPI(),
    Math,
    JSON,
    Date,
    parseInt,
    parseFloat,
    isNaN,
    Boolean,
    String,
    Number,
    Array,
    Object
  }
}
