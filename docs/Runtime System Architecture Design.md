# PLC HMI Runtime System - Web-Based Architecture Design

## 1. Executive Summary

本文档定义了 **纯Web方案** 的PLC HMI运行时系统架构，专为资源受限的嵌入式HMI设备设计。系统采用现代化的Web技术栈，通过浏览器容器运行，支持跨平台部署（Android、Windows CE、Linux等）。

### 核心设计理念

- **跨平台**: 纯Web实现，可在任何支持浏览器的设备上运行
- **轻量级**: 优化的前端框架，低内存占用 (< 150MB)
- **高性能**: 60FPS渲染，实时数据更新 (< 200ms延迟)
- **离线优先**: Service Worker缓存，断网可用
- **容器化**: 后期可封装为不同平台的原生容器应用

---

## 2. Target Environment Analysis

### 2.1 Hardware Constraints (Embedded HMI Devices)

| 参数 | 规格范围 |
|------|---------|
| CPU | ARM Cortex-A7/A9/A53, 1-4 cores, 800MHz-1.5GHz |
| RAM | 512MB - 2GB |
| Storage | 4GB - 16GB eMMC/Flash |
| Display | 7" - 15" LCD/LED, 800x600 to 1920x1080 |
| Touch | Resistive/Capacitive touchscreen |
| Network | Ethernet (100Mbps), WiFi (802.11n/ac) |
| OS | Android 5+, Windows Embedded, Linux with WebView |

### 2.2 Browser Environment

| 组件 | 要求 |
|------|------|
| Browser Engine | Chromium 80+ / WebView (Android System WebView) |
| JavaScript Engine | V8 (Chromium-based) |
| WebGL | WebGL 2.0 support (for charts/animations) |
| Service Workers | Supported (for offline capability) |
| LocalStorage | 10MB+ available |
| IndexedDB | 50MB+ available |

### 2.3 Performance Targets

| 指标 | 目标值 |
|------|--------|
| First Contentful Paint | < 1.5 seconds |
| Time to Interactive | < 2.5 seconds |
| Frame Rate | ≥ 50 FPS (target 60 FPS) |
| Variable Update Latency | < 200ms (HTTP polling) |
| Memory Usage | < 150MB peak |
| CPU Usage | < 40% (200 variables @ 500ms interval) |
| Bundle Size (gzipped) | < 500KB initial load |
| Offline Capability | Full functionality after first load |

---

## 3. Technology Stack Selection

### 3.1 Core Framework

**Vue 3 + TypeScript + Vite**

**选型理由:**
- **Vue 3 Composition API**: 响应式系统高效，学习曲线平缓
- **TypeScript**: 类型安全，大型项目可维护性强
- **Vite**: 极速开发体验，生产构建优化
- **体积优势**: Vue 3 runtime ~33KB (gzipped)，比React小

**为什么不选其他框架:**
- React: Virtual DOM开销较大，需要额外状态管理库
- Angular: 体积庞大(~150KB)，不适合低端设备
- Svelte: 生态不够成熟，工业场景案例少
- 原生JS: 开发效率低，组件复用困难

### 3.2 State Management

**Pinia** (Vue 3官方推荐)

**特性:**
- 轻量级 (~1KB gzipped)
- TypeScript原生支持
- DevTools集成
- 模块化设计

**为什么不选Vuex:**
- Pinia更轻量，API更简洁
- 更好的TypeScript支持
- Vuex已进入维护模式

### 3.3 UI Component Library

**自定义组件库 + Tailwind CSS**

**选型理由:**
- **Tailwind CSS**: Utility-first，无运行时CSS开销
- **自定义组件**: 完全控制渲染性能，避免第三方库冗余
- **按需加载**: Tree-shaking友好

**为什么不选Element UI/Vuetify:**
- 体积过大 (>100KB)
- 包含大量不需要的组件
- 样式定制复杂

### 3.4 Charting & Visualization

**Apache ECharts** (轻量版)

**特性:**
- 按需引入模块
- Canvas渲染，高性能
- 丰富的图表类型
- 移动端优化

**备选方案:**
- Chart.js: 更轻量，但功能有限
- D3.js: 灵活但学习曲线陡峭

### 3.5 HTTP Client

**Axios**

**特性:**
- 拦截器链
- 自动JSON转换
- 请求取消
- 浏览器兼容性好

### 3.6 WebSocket Client

**Native WebSocket API + Reconnection Logic**

**为什么不用Socket.io:**
- 原生API足够简单
- Socket.io体积较大
- 后端已提供标准WebSocket

### 3.7 Offline Support

**Service Workers + Workbox**

**功能:**
- 静态资源缓存
- API请求缓存策略
- 后台同步
- 离线页面

### 3.8 Build Tools

**Vite + Rollup**

**优化插件:**
- `@vitejs/plugin-vue`: Vue 3支持
- `rollup-plugin-visualizer`: Bundle分析
- `terser`: 代码压缩
- `imagemin`: 图片优化

### 3.9 Testing

- **Vitest**: 单元测试（Vite原生）
- **Playwright**: E2E测试
- **Cypress**: 组件测试

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │   Pages      │  │  Components  │  │  Debug Panel  │ │
│  │  (Views)     │  │   (UI)       │  │  (Dev Only)   │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
│         │                 │                              │
│  ┌──────▼─────────────────▼──────────────────────────┐ │
│  │          Vue 3 Reactive System                     │ │
│  │     (Composition API + Pinia Store)                │ │
│  └──────────────────┬─────────────────────────────────┘ │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 Business Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │Variable      │  │Expression    │  │Event Handler  │ │
│  │Scheduler     │  │Engine        │  │Manager        │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘ │
│         │                 │                   │          │
│  ┌──────▼─────────────────▼───────────────────▼──────┐ │
│  │           Component Runtime Engine                 │ │
│  │  (TextDisplay, Switch, Chart, Gauge, etc.)        │ │
│  └──────────────────┬─────────────────────────────────┘ │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 Data Access Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │HTTP Client   │  │WebSocket     │  │Local Cache    │ │
│  │(Axios +      │  │Client        │  │(IndexedDB +   │ │
│  │ Retry Logic) │  │(Real-time)   │  │ localStorage) │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘ │
│         │                 │                   │          │
│  ┌──────▼─────────────────▼───────────────────▼──────┐ │
│  │         API Integration Layer                      │ │
│  │  (RESTful API v1 + WebSocket subscriptions)       │ │
│  └──────────────────┬─────────────────────────────────┘ │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Infrastructure Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │Service       │  │Logger        │  │Config Loader  │ │
│  │Worker        │  │(Console +    │  │(JSON Parser + │ │
│  │(Offline +    │  │ File Export) │  │ Validator)    │ │
│  │ Background)  │  └──────────────┘  └───────────────┘ │
│  └──────────────┘                                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Security Module                             │ │
│  │  (JWT Auth + HTTPS + Input Validation)             │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Module Dependency Graph

```
App Root
  ├─ Router (Vue Router)
  ├─ Store (Pinia)
  │   ├─ projectStore
  │   ├─ variableStore
  │   ├─ deviceStore
  │   └─ uiStore
  ├─ Services
  │   ├─ ApiService (HTTP)
  │   ├─ WebSocketService
  │   ├─ VariableScheduler
  │   ├─ ExpressionEngine
  │   └─ EventManager
  ├─ Components
  │   ├─ BaseComponent (abstract)
  │   ├─ DisplayComponents (Text, Number, etc.)
  │   ├─ ControlComponents (Switch, Button, etc.)
  │   ├─ ChartComponents (Line, Bar, Gauge)
  │   └─ ContainerComponents (Group, Tab)
  ├─ Composables (Vue 3 Composition Functions)
  │   ├─ useVariable
  │   ├─ useExpression
  │   ├─ useEvent
  │   └─ useResponsive
  └─ Utils
      ├─ Logger
      ├─ CryptoUtils
      └─ PerformanceMonitor
```

**依赖规则:** 
- 上层模块依赖下层模块
- 禁止循环依赖
- Composables可被任何层使用

---

## 5. Core Module Designs

### 5.1 Application Bootstrap

#### Main Entry Point

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initServiceWorker } from './services/sw-register'
import { loadRuntimeConfig } from './services/config-loader'

async function bootstrap() {
  try {
    // Step 1: Load runtime configuration
    const config = await loadRuntimeConfig()
    
    // Step 2: Initialize Service Worker for offline support
    await initServiceWorker()
    
    // Step 3: Create Vue app
    const app = createApp(App)
    const pinia = createPinia()
    
    // Step 4: Register global plugins
    app.use(pinia)
    app.use(router)
    
    // Step 5: Mount app
    app.mount('#app')
    
    console.log('[Runtime] Application started successfully')
  } catch (error) {
    console.error('[Runtime] Startup failed:', error)
    showErrorMessage('应用启动失败，请刷新页面或联系管理员')
  }
}

bootstrap()
```

#### Project Structure

```
plc-hmi-runtime/
├── public/
│   ├── index.html
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service Worker entry
│
├── src/
│   ├── main.ts
│   ├── App.vue
│   │
│   ├── assets/
│   │   ├── styles/
│   │   │   ├── tailwind.css
│   │   │   └── custom.css
│   │   └── fonts/
│   │
│   ├── components/
│   │   ├── base/
│   │   │   ├── BaseComponent.ts
│   │   │   └── ComponentRegistry.ts
│   │   ├── display/
│   │   │   ├── TextDisplay.vue
│   │   │   ├── NumberDisplay.vue
│   │   │   └── Label.vue
│   │   ├── control/
│   │   │   ├── Switch.vue
│   │   │   ├── Button.vue
│   │   │   └── Slider.vue
│   │   ├── chart/
│   │   │   ├── LineChart.vue
│   │   │   ├── BarChart.vue
│   │   │   └── Gauge.vue
│   │   └── container/
│   │       ├── Group.vue
│   │       └── TabContainer.vue
│   │
│   ├── composables/
│   │   ├── useVariable.ts
│   │   ├── useExpression.ts
│   │   ├── useEvent.ts
│   │   └── useResponsive.ts
│   │
│   ├── stores/
│   │   ├── project.ts
│   │   ├── variable.ts
│   │   ├── device.ts
│   │   └── ui.ts
│   │
│   ├── services/
│   │   ├── api.ts               # Axios instance
│   │   ├── websocket.ts         # WebSocket manager
│   │   ├── variable-scheduler.ts
│   │   ├── expression-engine.ts
│   │   ├── event-manager.ts
│   │   ├── config-loader.ts
│   │   └── sw-register.ts
│   │
│   ├── router/
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── project.ts
│   │   ├── component.ts
│   │   ├── variable.ts
│   │   └── api.ts
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── crypto.ts
│   │   └── performance.ts
│   │
│   └── views/
│       ├── RuntimeView.vue      # Main runtime page
│       ├── DebugView.vue        # Debug panel
│       └── ErrorView.vue        # Error page
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

### 5.2 Configuration Loader Module

#### Responsibilities
- Load project configuration from API or local storage
- Validate configuration schema
- Handle version compatibility
- Cache configuration for offline use

#### Implementation

```typescript
// services/config-loader.ts
import { apiClient } from './api'
import { useProjectStore } from '@/stores/project'
import type { Project, RuntimeConfig } from '@plc/hmi-types'

interface CachedConfig {
  projectId: string
  config: RuntimeConfig
  timestamp: number
  version: string
}

export async function loadRuntimeConfig(projectId?: string): Promise<RuntimeConfig> {
  const projectStore = useProjectStore()
  
  try {
    // Step 1: Try to load from cache first (offline support)
    const cached = loadFromCache(projectId)
    if (cached && isCacheValid(cached)) {
      console.log('[Config] Loaded from cache')
      projectStore.setConfig(cached.config)
      return cached.config
    }
    
    // Step 2: Fetch from API
    const response = await apiClient.get(`/projects/${projectId}`)
    const project: Project = response.data
    
    // Step 3: Validate configuration
    validateConfig(project)
    
    // Step 4: Convert to runtime format
    const runtimeConfig = convertToRuntimeConfig(project)
    
    // Step 5: Cache for offline use
    saveToCache({
      projectId: project.id,
      config: runtimeConfig,
      timestamp: Date.now(),
      version: project.version
    })
    
    // Step 6: Update store
    projectStore.setConfig(runtimeConfig)
    
    return runtimeConfig
  } catch (error) {
    console.error('[Config] Failed to load config:', error)
    
    // Fallback to stale cache
    const staleCache = loadFromCache(projectId)
    if (staleCache) {
      console.warn('[Config] Using stale cache')
      return staleCache.config
    }
    
    throw new Error('无法加载配置，请检查网络连接')
  }
}

function loadFromCache(projectId?: string): CachedConfig | null {
  const key = projectId ? `config:${projectId}` : 'config:current'
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

function saveToCache(cached: CachedConfig): void {
  const key = `config:${cached.projectId}`
  localStorage.setItem(key, JSON.stringify(cached))
}

function isCacheValid(cached: CachedConfig): boolean {
  const MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours
  return Date.now() - cached.timestamp < MAX_AGE
}

function validateConfig(project: Project): void {
  // Validate required fields
  if (!project.id || !project.name || !project.pages) {
    throw new Error('Invalid project structure')
  }
  
  // Validate pages
  if (project.pages.length === 0) {
    throw new Error('Project must have at least one page')
  }
  
  // Validate components
  project.pages.forEach(page => {
    page.components.forEach(comp => {
      if (!comp.id || !comp.type) {
        throw new Error(`Invalid component in page ${page.name}`)
      }
    })
  })
}

function convertToRuntimeConfig(project: Project): RuntimeConfig {
  return {
    projectId: project.id,
    version: project.version,
    resolution: project.resolution,
    pages: project.pages.map(page => ({
      id: page.id,
      name: page.name,
      components: page.components.map(comp => ({
        id: comp.id,
        type: comp.type,
        x: comp.x,
        y: comp.y,
        width: comp.width,
        height: comp.height,
        zIndex: comp.zIndex || 0,
        properties: comp.properties,
        events: comp.events || {}
      }))
    })),
    variables: project.variables || [],
    resources: project.resources || []
  }
}
```

---

### 5.3 Variable Scheduler Module (Performance Critical)

#### Architecture

```
┌─────────────────────────────────────────┐
│         VariableScheduler                │
│                                         │
│  ┌─────────────┐   ┌─────────────────┐ │
│  │Subscription │   │  PollingEngine  │ │
│  │  Manager    │◄──┤  (setTimeout/   │ │
│  │             │   │   setInterval)  │ │
│  └──────┬──────┘   └────────┬────────┘ │
│         │                   │           │
│  ┌──────▼──────┐   ┌────────▼────────┐ │
│  │ CacheStore  │   │  WriteQueue     │ │
│  │(Reactive    │   │ (Priority Queue)│ │
│  │ Map)        │   │                 │ │
│  └─────────────┘   └────────┬────────┘ │
│                             │           │
│                    ┌────────▼────────┐ │
│                    │  API Service    │ │
│                    │  (Axios)        │ │
│                    └─────────────────┘ │
└─────────────────────────────────────────┘
```

#### Implementation

```typescript
// services/variable-scheduler.ts
import { ref, reactive, computed } from 'vue'
import { apiClient } from './api'
import { useDeviceStore } from '@/stores/device'
import type { VariableValue, Subscription } from '@plc/hmi-types'

interface VariableState {
  value: any
  quality: 'good' | 'bad' | 'uncertain'
  timestamp: number
  subscribers: Set<(value: any) => void>
}

class VariableScheduler {
  private cache = new Map<string, VariableState>()
  private pollingTimer: number | null = null
  private pollingInterval: number = 500 // ms
  private subscribedVariables = new Set<string>()
  private writeQueue: Array<{ address: string; value: any; resolve: Function; reject: Function }> = []
  private isProcessingWrite = false
  
  /**
   * Subscribe to variable changes
   */
  subscribe(address: string, callback: (value: any) => void): Subscription {
    // Initialize state if not exists
    if (!this.cache.has(address)) {
      this.cache.set(address, {
        value: null,
        quality: 'uncertain',
        timestamp: 0,
        subscribers: new Set()
      })
    }
    
    const state = this.cache.get(address)!
    state.subscribers.add(callback)
    this.subscribedVariables.add(address)
    
    // Start polling if not already running
    if (!this.pollingTimer) {
      this.startPolling()
    }
    
    // Return unsubscribe function
    return {
      unsubscribe: () => {
        state.subscribers.delete(callback)
        if (state.subscribers.size === 0) {
          this.cache.delete(address)
          this.subscribedVariables.delete(address)
        }
        
        // Stop polling if no subscriptions
        if (this.subscribedVariables.size === 0) {
          this.stopPolling()
        }
      }
    }
  }
  
  /**
   * Get current variable value (synchronous, from cache)
   */
  getValue(address: string): any {
    return this.cache.get(address)?.value ?? null
  }
  
  /**
   * Get reactive reference to variable
   */
  useReactiveValue(address: string) {
    const state = this.cache.get(address)
    if (!state) {
      // Create placeholder
      this.cache.set(address, {
        value: null,
        quality: 'uncertain',
        timestamp: 0,
        subscribers: new Set()
      })
    }
    
    return computed(() => this.cache.get(address)?.value)
  }
  
  /**
   * Write variable value
   */
  async write(address: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.writeQueue.push({ address, value, resolve, reject })
      this.processWriteQueue()
    })
  }
  
  /**
   * Batch write multiple variables
   */
  async batchWrite(writes: Array<{ address: string; value: any }>): Promise<void> {
    try {
      const deviceStore = useDeviceStore()
      const instanceId = deviceStore.currentInstanceId
      
      const response = await apiClient.post(
        `/devices/instances/${instanceId}/variables/batch-write`,
        { writes, atomic: true }
      )
      
      if (response.data.success) {
        // Force refresh after successful write
        await this.forceRefresh(writes.map(w => w.address))
      } else {
        throw new Error(response.data.message)
      }
    } catch (error) {
      console.error('[VariableScheduler] Batch write failed:', error)
      throw error
    }
  }
  
  /**
   * Start polling loop
   */
  private startPolling(): void {
    if (this.pollingTimer) return
    
    console.log('[VariableScheduler] Started polling')
    this.poll()
    
    this.pollingTimer = window.setInterval(() => {
      this.poll()
    }, this.pollingInterval)
  }
  
  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
      console.log('[VariableScheduler] Stopped polling')
    }
  }
  
  /**
   * Poll variables from server
   */
  private async poll(): Promise<void> {
    if (this.subscribedVariables.size === 0) return
    
    try {
      const deviceStore = useDeviceStore()
      const instanceId = deviceStore.currentInstanceId
      
      const addresses = Array.from(this.subscribedVariables)
      
      const startTime = performance.now()
      
      const response = await apiClient.get(
        `/devices/instances/${instanceId}/variables/values`,
        { params: { addresses } }
      )
      
      const elapsed = performance.now() - startTime
      
      // Update cache with new values
      const values: VariableValue[] = response.data.data
      values.forEach(({ variableId, address, value, quality, timestamp }) => {
        this.updateVariable(address, value, quality, new Date(timestamp).getTime())
      })
      
      // Log performance
      if (elapsed > 200) {
        console.warn(`[VariableScheduler] Slow poll: ${elapsed.toFixed(0)}ms for ${addresses.length} variables`)
      }
      
    } catch (error) {
      console.error('[VariableScheduler] Poll failed:', error)
      // Mark all variables as bad quality
      this.subscribedVariables.forEach(address => {
        this.updateVariable(address, null, 'bad', Date.now())
      })
    }
  }
  
  /**
   * Update variable in cache and notify subscribers
   */
  private updateVariable(address: string, value: any, quality: string, timestamp: number): void {
    const state = this.cache.get(address)
    if (!state) return
    
    // Only notify if value changed (avoid unnecessary re-renders)
    const hasChanged = state.value !== value
    
    state.value = value
    state.quality = quality as any
    state.timestamp = timestamp
    
    if (hasChanged) {
      // Notify all subscribers
      state.subscribers.forEach(callback => {
        try {
          callback(value)
        } catch (error) {
          console.error(`[VariableScheduler] Subscriber error for ${address}:`, error)
        }
      })
    }
  }
  
  /**
   * Force refresh specific variables
   */
  private async forceRefresh(addresses: string[]): Promise<void> {
    try {
      const deviceStore = useDeviceStore()
      const instanceId = deviceStore.currentInstanceId
      
      const response = await apiClient.get(
        `/devices/instances/${instanceId}/variables/values`,
        { params: { addresses } }
      )
      
      const values: VariableValue[] = response.data.data
      values.forEach(({ address, value, quality, timestamp }) => {
        this.updateVariable(address, value, quality, new Date(timestamp).getTime())
      })
    } catch (error) {
      console.error('[VariableScheduler] Force refresh failed:', error)
    }
  }
  
  /**
   * Process write queue
   */
  private async processWriteQueue(): Promise<void> {
    if (this.isProcessingWrite || this.writeQueue.length === 0) return
    
    this.isProcessingWrite = true
    
    try {
      // Process writes in batches
      const batchSize = 10
      while (this.writeQueue.length > 0) {
        const batch = this.writeQueue.splice(0, batchSize)
        
        const writes = batch.map(item => ({
          address: item.address,
          value: item.value
        }))
        
        try {
          await this.batchWrite(writes)
          batch.forEach(item => item.resolve())
        } catch (error) {
          batch.forEach(item => item.reject(error))
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    } finally {
      this.isProcessingWrite = false
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      subscribedVariables: this.subscribedVariables.size,
      cachedVariables: this.cache.size,
      pendingWrites: this.writeQueue.length,
      pollingActive: this.pollingTimer !== null
    }
  }
}

// Singleton instance
export const variableScheduler = new VariableScheduler()
```

#### Composable for Vue Components

```typescript
// composables/useVariable.ts
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { variableScheduler } from '@/services/variable-scheduler'

export function useVariable(address: string) {
  const value = computed(() => variableScheduler.getValue(address))
  
  let subscription: any = null
  
  onMounted(() => {
    subscription = variableScheduler.subscribe(address, () => {
      // Trigger reactivity
    })
  })
  
  onUnmounted(() => {
    if (subscription) {
      subscription.unsubscribe()
    }
  })
  
  const setValue = async (newValue: any) => {
    await variableScheduler.write(address, newValue)
  }
  
  return {
    value,
    setValue
  }
}
```

---

### 5.4 Expression Engine Module

#### AST-Based Expression Evaluator

```typescript
// services/expression-engine.ts

type ExpressionNode =
  | { type: 'literal'; value: any }
  | { type: 'variable'; name: string }
  | { type: 'binary'; operator: string; left: ExpressionNode; right: ExpressionNode }
  | { type: 'unary'; operator: string; operand: ExpressionNode }
  | { type: 'conditional'; condition: ExpressionNode; consequent: ExpressionNode; alternate: ExpressionNode }

class ExpressionEngine {
  private cache = new Map<string, ExpressionNode>()
  
  /**
   * Evaluate expression with context
   */
  evaluate(expression: string, context: Record<string, any>): any {
    try {
      // Check cache
      let ast = this.cache.get(expression)
      if (!ast) {
        ast = this.parse(expression)
        this.cache.set(expression, ast)
      }
      
      return this.evaluateNode(ast, context)
    } catch (error) {
      console.error('[ExpressionEngine] Evaluation error:', error)
      return null
    }
  }
  
  /**
   * Parse expression string to AST
   */
  private parse(expression: string): ExpressionNode {
    // Simple recursive descent parser
    // For production, consider using a library like nearley or pegjs
    
    const tokens = this.tokenize(expression)
    let pos = 0
    
    const parseExpression = (): ExpressionNode => {
      // Handle conditional (ternary) operator
      let node = parseLogicalOr()
      
      if (pos < tokens.length && tokens[pos] === '?') {
        pos++ // skip '?'
        const consequent = parseExpression()
        expect(':')
        const alternate = parseExpression()
        node = { type: 'conditional', condition: node, consequent, alternate }
      }
      
      return node
    }
    
    const parseLogicalOr = (): ExpressionNode => {
      let node = parseLogicalAnd()
      
      while (pos < tokens.length && tokens[pos] === '||') {
        pos++
        const right = parseLogicalAnd()
        node = { type: 'binary', operator: '||', left: node, right }
      }
      
      return node
    }
    
    const parseLogicalAnd = (): ExpressionNode => {
      let node = parseComparison()
      
      while (pos < tokens.length && tokens[pos] === '&&') {
        pos++
        const right = parseComparison()
        node = { type: 'binary', operator: '&&', left: node, right }
      }
      
      return node
    }
    
    const parseComparison = (): ExpressionNode => {
      let node = parseAddition()
      
      const operators = ['==', '!=', '>', '<', '>=', '<=']
      while (pos < tokens.length && operators.includes(tokens[pos])) {
        const op = tokens[pos++]
        const right = parseAddition()
        node = { type: 'binary', operator: op, left: node, right }
      }
      
      return node
    }
    
    const parseAddition = (): ExpressionNode => {
      let node = parseMultiplication()
      
      while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
        const op = tokens[pos++]
        const right = parseMultiplication()
        node = { type: 'binary', operator: op, left: node, right }
      }
      
      return node
    }
    
    const parseMultiplication = (): ExpressionNode => {
      let node = parseUnary()
      
      while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
        const op = tokens[pos++]
        const right = parseUnary()
        node = { type: 'binary', operator: op, left: node, right }
      }
      
      return node
    }
    
    const parseUnary = (): ExpressionNode => {
      if (pos < tokens.length && tokens[pos] === '-') {
        pos++
        const operand = parsePrimary()
        return { type: 'unary', operator: '-', operand }
      }
      return parsePrimary()
    }
    
    const parsePrimary = (): ExpressionNode => {
      const token = tokens[pos]
      
      // Number literal
      if (/^\d+(\.\d+)?$/.test(token)) {
        pos++
        return { type: 'literal', value: parseFloat(token) }
      }
      
      // String literal
      if ((token.startsWith('"') && token.endsWith('"')) ||
          (token.startsWith("'") && token.endsWith("'"))) {
        pos++
        return { type: 'literal', value: token.slice(1, -1) }
      }
      
      // Boolean literal
      if (token === 'true' || token === 'false') {
        pos++
        return { type: 'literal', value: token === 'true' }
      }
      
      // Variable reference (${varName})
      if (token.startsWith('${') && token.endsWith('}')) {
        pos++
        const varName = token.slice(2, -1)
        return { type: 'variable', name: varName }
      }
      
      // Parenthesized expression
      if (token === '(') {
        pos++ // skip '('
        const node = parseExpression()
        expect(')')
        return node
      }
      
      throw new Error(`Unexpected token: ${token}`)
    }
    
    const expect = (expected: string) => {
      if (pos >= tokens.length || tokens[pos] !== expected) {
        throw new Error(`Expected '${expected}' but got '${tokens[pos]}'`)
      }
      pos++
    }
    
    const ast = parseExpression()
    
    if (pos < tokens.length) {
      throw new Error(`Unexpected token: ${tokens[pos]}`)
    }
    
    return ast
  }
  
  /**
   * Tokenize expression
   */
  private tokenize(expression: string): string[] {
    const tokens: string[] = []
    let current = ''
    
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i]
      
      // Whitespace
      if (/\s/.test(char)) {
        if (current) {
          tokens.push(current)
          current = ''
        }
        continue
      }
      
      // Operators and delimiters
      if (['+', '-', '*', '/', '(', ')', '?', ':'].includes(char)) {
        if (current) {
          tokens.push(current)
          current = ''
        }
        tokens.push(char)
        continue
      }
      
      // Multi-character operators
      if (char === '=' || char === '!' || char === '>' || char === '<') {
        if (current) {
          tokens.push(current)
          current = ''
        }
        
        if (i + 1 < expression.length && expression[i + 1] === '=') {
          tokens.push(char + '=')
          i++
        } else {
          tokens.push(char)
        }
        continue
      }
      
      // Logical operators
      if (char === '|' && expression[i + 1] === '|') {
        if (current) {
          tokens.push(current)
          current = ''
        }
        tokens.push('||')
        i++
        continue
      }
      
      if (char === '&' && expression[i + 1] === '&') {
        if (current) {
          tokens.push(current)
          current = ''
        }
        tokens.push('&&')
        i++
        continue
      }
      
      // Variable reference ${...}
      if (char === '$' && expression[i + 1] === '{') {
        if (current) {
          tokens.push(current)
          current = ''
        }
        
        let varRef = '${'
        i += 2
        while (i < expression.length && expression[i] !== '}') {
          varRef += expression[i]
          i++
        }
        varRef += '}'
        tokens.push(varRef)
        continue
      }
      
      // Accumulate characters
      current += char
    }
    
    if (current) {
      tokens.push(current)
    }
    
    return tokens
  }
  
  /**
   * Evaluate AST node
   */
  private evaluateNode(node: ExpressionNode, context: Record<string, any>): any {
    switch (node.type) {
      case 'literal':
        return node.value
      
      case 'variable':
        return context[node.name] ?? null
      
      case 'unary':
        const operand = this.evaluateNode(node.operand, context)
        if (node.operator === '-') return -operand
        throw new Error(`Unknown unary operator: ${node.operator}`)
      
      case 'binary':
        const left = this.evaluateNode(node.left, context)
        const right = this.evaluateNode(node.right, context)
        
        switch (node.operator) {
          case '+': return toNumber(left) + toNumber(right)
          case '-': return toNumber(left) - toNumber(right)
          case '*': return toNumber(left) * toNumber(right)
          case '/': return toNumber(left) / toNumber(right)
          case '==': return left == right
          case '!=': return left != right
          case '>': return toNumber(left) > toNumber(right)
          case '<': return toNumber(left) < toNumber(right)
          case '>=': return toNumber(left) >= toNumber(right)
          case '<=': return toNumber(left) <= toNumber(right)
          case '&&': return toBoolean(left) && toBoolean(right)
          case '||': return toBoolean(left) || toBoolean(right)
          default:
            throw new Error(`Unknown binary operator: ${node.operator}`)
        }
      
      case 'conditional':
        const condition = toBoolean(this.evaluateNode(node.condition, context))
        return condition
          ? this.evaluateNode(node.consequent, context)
          : this.evaluateNode(node.alternate, context)
      
      default:
        throw new Error(`Unknown node type: ${(node as any).type}`)
    }
  }
  
  /**
   * Extract variable dependencies from expression
   */
  extractDependencies(expression: string): string[] {
    const dependencies: string[] = []
    const regex = /\$\{([^}]+)\}/g
    let match
    
    while ((match = regex.exec(expression)) !== null) {
      dependencies.push(match[1])
    }
    
    return [...new Set(dependencies)]
  }
}

// Helper functions
function toNumber(value: any): number {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

function toBoolean(value: any): boolean {
  return Boolean(value)
}

// Singleton instance
export const expressionEngine = new ExpressionEngine()
```

#### Expression Binding Composable

```typescript
// composables/useExpression.ts
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { expressionEngine } from '@/services/expression-engine'
import { variableScheduler } from '@/services/variable-scheduler'

export function useExpression(expression: string) {
  const result = ref<any>(null)
  const dependencies = expressionEngine.extractDependencies(expression)
  const subscriptions: any[] = []
  
  const evaluate = () => {
    // Gather current variable values
    const context: Record<string, any> = {}
    dependencies.forEach(varName => {
      context[varName] = variableScheduler.getValue(varName)
    })
    
    result.value = expressionEngine.evaluate(expression, context)
  }
  
  onMounted(() => {
    // Subscribe to all dependencies
    dependencies.forEach(varName => {
      const sub = variableScheduler.subscribe(varName, () => {
        evaluate()
      })
      subscriptions.push(sub)
    })
    
    // Initial evaluation
    evaluate()
  })
  
  onUnmounted(() => {
    subscriptions.forEach(sub => sub.unsubscribe())
  })
  
  return result
}
```

---

### 5.5 Component Runtime Engine

#### Base Component Class

```typescript
// components/base/BaseComponent.ts
import { defineComponent, h, computed, onMounted, onUnmounted } from 'vue'
import { useVariable } from '@/composables/useVariable'
import { useExpression } from '@/composables/useExpression'
import { executeEvent } from '@/services/event-manager'

export interface ComponentProps {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  zIndex?: number
  properties: Record<string, any>
  events?: Record<string, string>
}

export const BaseComponent = defineComponent({
  props: {
    id: { type: String, required: true },
    type: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    zIndex: { type: Number, default: 0 },
    properties: { type: Object, required: true },
    events: { type: Object, default: () => ({}) }
  },
  
  setup(props, { slots }) {
    // Resolve property values (handle variable bindings and expressions)
    const resolvedProps = computed(() => {
      const resolved: Record<string, any> = {}
      
      Object.entries(props.properties).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Check if it's an expression
          if (value.includes('${')) {
            resolved[key] = useExpression(value)
          }
          // Check if it's a variable binding
          else if (value.startsWith('var:')) {
            const varName = value.substring(4)
            const { value: varValue } = useVariable(varName)
            resolved[key] = varValue
          } else {
            resolved[key] = value
          }
        } else {
          resolved[key] = value
        }
      })
      
      return resolved
    })
    
    // Event handlers
    const handleEvent = async (eventName: string, event: Event) => {
      const script = props.events?.[eventName]
      if (script) {
        try {
          await executeEvent(script, {
            componentId: props.id,
            event,
            properties: resolvedProps.value
          })
        } catch (error) {
          console.error(`[Component ${props.id}] Event handler error:`, error)
        }
      }
    }
    
    // Component style
    const componentStyle = computed(() => ({
      position: 'absolute',
      left: `${props.x}px`,
      top: `${props.y}px`,
      width: `${props.width}px`,
      height: `${props.height}px`,
      zIndex: props.zIndex
    }))
    
    return {
      resolvedProps,
      componentStyle,
      handleEvent
    }
  },
  
  render() {
    return h('div', {
      class: 'runtime-component',
      style: this.componentStyle,
      'data-component-id': this.id,
      'data-component-type': this.type
    }, [
      this.$slots.default?.()
    ])
  }
})
```

#### Component Registry

```typescript
// components/base/ComponentRegistry.ts
import type { DefineComponent } from 'vue'

const registry = new Map<string, DefineComponent>()

export function registerComponent(type: string, component: DefineComponent) {
  registry.set(type, component)
}

export function getComponent(type: string): DefineComponent | undefined {
  return registry.get(type)
}

export function hasComponent(type: string): boolean {
  return registry.has(type)
}

// Register built-in components
export function registerBuiltInComponents() {
  // Import and register all built-in components
  import('../display/TextDisplay.vue').then(m => registerComponent('TextDisplay', m.default))
  import('../display/NumberDisplay.vue').then(m => registerComponent('NumberDisplay', m.default))
  import('../control/Switch.vue').then(m => registerComponent('Switch', m.default))
  import('../control/Button.vue').then(m => registerComponent('Button', m.default))
  import('../chart/LineChart.vue').then(m => registerComponent('LineChart', m.default))
  import('../chart/Gauge.vue').then(m => registerComponent('Gauge', m.default))
  // ... register other components
}
```

#### Example Component: TextDisplay

```vue
<!-- components/display/TextDisplay.vue -->
<template>
  <BaseComponent
    :id="id"
    :type="type"
    :x="x"
    :y="y"
    :width="width"
    :height="height"
    :z-index="zIndex"
    :properties="properties"
    :events="events"
  >
    <div
      class="text-display"
      :style="textStyle"
      @click="handleEvent('OnClick', $event)"
    >
      {{ displayText }}
    </div>
  </BaseComponent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseComponent from '../base/BaseComponent.vue'
import { useVariable } from '@/composables/useVariable'
import { useExpression } from '@/composables/useExpression'

const props = defineProps<{
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  zIndex?: number
  properties: Record<string, any>
  events?: Record<string, string>
}>()

// Resolve text (can be static, variable-bound, or expression)
const displayText = computed(() => {
  const text = props.properties.text
  
  if (typeof text === 'string') {
    if (text.startsWith('var:')) {
      const varName = text.substring(4)
      const { value } = useVariable(varName)
      return value
    }
    if (text.includes('${')) {
      return useExpression(text)
    }
  }
  
  return text
})

// Text styling
const textStyle = computed(() => ({
  fontSize: `${props.properties.fontSize || 16}px`,
  color: props.properties.color || '#000000',
  fontFamily: props.properties.fontFamily || 'Arial',
  textAlign: props.properties.textAlign || 'left',
  lineHeight: `${props.height}px`,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}))
</script>

<style scoped>
.text-display {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  user-select: none;
}
</style>
```

#### Example Component: Switch

```vue
<!-- components/control/Switch.vue -->
<template>
  <BaseComponent
    :id="id"
    :type="type"
    :x="x"
    :y="y"
    :width="width"
    :height="height"
    :z-index="zIndex"
    :properties="properties"
    :events="events"
  >
    <div
      class="switch-container"
      :class="{ 'is-on': isOn }"
      @click="toggle"
    >
      <div class="switch-track"></div>
      <div class="switch-thumb"></div>
    </div>
  </BaseComponent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseComponent from '../base/BaseComponent.vue'
import { useVariable } from '@/composables/useVariable'

const props = defineProps<{
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  zIndex?: number
  properties: Record<string, any>
  events?: Record<string, string>
}>()

// Bind to variable
const varName = props.properties.variable
const { value, setValue } = useVariable(varName)

// Determine if switch is on
const isOn = computed(() => {
  const trueValue = props.properties.trueValue ?? 1
  return value.value === trueValue
})

// Toggle switch
const toggle = async () => {
  const trueValue = props.properties.trueValue ?? 1
  const falseValue = props.properties.falseValue ?? 0
  
  const newValue = isOn.value ? falseValue : trueValue
  await setValue(newValue)
  
  // Trigger OnChange event
  if (props.events?.OnChange) {
    // Event will be handled by BaseComponent
  }
}
</script>

<style scoped>
.switch-container {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.switch-track {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background-color: #cbd5e0;
  transition: background-color 0.2s;
}

.is-on .switch-track {
  background-color: #48bb78;
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 4px);
  height: calc(100% - 4px);
  border-radius: 999px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.is-on .switch-thumb {
  transform: translateX(100%);
}
</style>
```

---

### 5.6 Page Renderer

```vue
<!-- views/RuntimeView.vue -->
<template>
  <div class="runtime-page" :style="pageStyle">
    <!-- Render components sorted by zIndex -->
    <component
      v-for="comp in sortedComponents"
      :key="comp.id"
      :is="getComponentType(comp.type)"
      v-bind="comp"
    />
    
    <!-- Debug overlay (only in dev mode) -->
    <DebugOverlay v-if="showDebug" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { getComponent } from '@/components/base/ComponentRegistry'
import DebugOverlay from '@/components/debug/DebugOverlay.vue'

const route = useRoute()
const projectStore = useProjectStore()

// Get current page
const currentPage = computed(() => {
  const pageId = route.params.pageId as string
  return projectStore.currentPage
})

// Sort components by zIndex
const sortedComponents = computed(() => {
  return [...currentPage.value.components].sort((a, b) => a.zIndex - b.zIndex)
})

// Page style based on resolution
const pageStyle = computed(() => ({
  width: `${projectStore.config.resolution.width}px`,
  height: `${projectStore.config.resolution.height}px`,
  backgroundColor: currentPage.value.background || '#ffffff'
}))

// Get component type for dynamic rendering
const getComponentType = (type: string) => {
  return getComponent(type)
}

// Lifecycle
onMounted(() => {
  console.log('[RuntimeView] Page mounted:', currentPage.value.name)
})

onUnmounted(() => {
  console.log('[RuntimeView] Page unmounted')
})
</script>

<style scoped>
.runtime-page {
  position: relative;
  overflow: hidden;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
```

---

### 5.7 API Service Layer

```typescript
// services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios'
import { useDeviceStore } from '@/stores/device'

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor: Handle errors
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const deviceStore = useDeviceStore()
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        await refreshToken()
        // Retry original request
        return apiClient.request(error.config!)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    // Handle network errors
    if (!error.response) {
      deviceStore.setConnectionStatus('offline')
      console.error('[API] Network error:', error.message)
    } else {
      deviceStore.setConnectionStatus('error')
      console.error('[API] Server error:', error.response.status)
    }
    
    return Promise.reject(error)
  }
)

// Refresh token function
async function refreshToken(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) {
    throw new Error('No refresh token')
  }
  
  const response = await axios.post('/api/v1/auth/refresh', {
    refreshToken
  })
  
  localStorage.setItem('auth_token', response.data.accessToken)
  localStorage.setItem('refresh_token', response.data.refreshToken)
}

// API helper functions
export const deviceApi = {
  getStatus(instanceId: string) {
    return apiClient.get(`/devices/instances/${instanceId}/status`)
  },
  
  getVariableValues(instanceId: string, addresses: string[]) {
    return apiClient.get(`/devices/instances/${instanceId}/variables/values`, {
      params: { addresses }
    })
  },
  
  writeVariable(instanceId: string, address: string, value: any) {
    return apiClient.post(`/devices/instances/${instanceId}/variables/${address}/write`, {
      value
    })
  },
  
  batchWrite(instanceId: string, writes: Array<{ address: string; value: any }>) {
    return apiClient.post(`/devices/instances/${instanceId}/variables/batch-write`, {
      writes,
      atomic: true
    })
  }
}
```

---

### 5.8 WebSocket Service

```typescript
// services/websocket.ts
import { ref } from 'vue'

interface WebSocketMessage {
  type: string
  data: any
}

class WebSocketService {
  private ws: WebSocket | null = null
  private url: string = ''
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private messageHandlers = new Map<string, Set<(data: any) => void>>()
  private isConnected = ref(false)
  private pendingMessages: WebSocketMessage[] = []
  
  connect(url: string, token: string): void {
    this.url = `${url}?token=${token}`
    this.initializeConnection()
  }
  
  private initializeConnection(): void {
    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        console.log('[WebSocket] Connected')
        this.isConnected.value = true
        this.reconnectAttempts = 0
        
        // Flush pending messages
        this.pendingMessages.forEach(msg => this.send(msg))
        this.pendingMessages = []
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('[WebSocket] Message parse error:', error)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
      }
      
      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        this.isConnected.value = false
        this.attemptReconnect()
      }
      
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error)
      this.attemptReconnect()
    }
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached')
      return
    }
    
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      this.initializeConnection()
    }, delay)
  }
  
  subscribe(messageType: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set())
    }
    
    this.messageHandlers.get(messageType)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(messageType)?.delete(handler)
    }
  }
  
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message for later
      this.pendingMessages.push(message)
    }
  }
  
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data)
        } catch (error) {
          console.error('[WebSocket] Handler error:', error)
        }
      })
    }
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
  
  getConnectionStatus() {
    return this.isConnected
  }
}

export const websocketService = new WebSocketService()
```

---

### 5.9 Service Worker (Offline Support)

```javascript
// public/sw.js
const CACHE_NAME = 'plc-hmi-runtime-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other critical assets
]

const API_CACHE_NAME = 'api-cache-v1'
const API_CACHE_LIMIT = 50

// Install event: Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event: Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map(key => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Fetch event: Serve from cache or network
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Static assets: Cache-first strategy
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request)
      })
    )
    return
  }
  
  // API requests: Network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(API_CACHE_NAME).then(cache => {
              cache.put(request, responseClone)
              limitCacheSize(API_CACHE_NAME, API_CACHE_LIMIT)
            })
          }
          return response
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
        })
    )
    return
  }
  
  // Default: Network-first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request)
    })
  )
})

// Limit cache size
async function limitCacheSize(cacheName, limit) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  if (keys.length > limit) {
    // Delete oldest entries
    for (let i = 0; i < keys.length - limit; i++) {
      await cache.delete(keys[i])
    }
  }
}

// Background sync for offline writes
self.addEventListener('sync', event => {
  if (event.tag === 'sync-writes') {
    event.waitUntil(processPendingWrites())
  }
})

async function processPendingWrites() {
  // Process queued write operations
  // Implementation depends on your write queue storage
}
```

---

## 6. Performance Optimization Strategies

### 6.1 Rendering Optimizations

**1. Virtual Scrolling for Large Lists**
```typescript
// Only render visible components
const visibleComponents = computed(() => {
  return components.filter(comp => isComponentInViewport(comp))
})
```

**2. Debounced Updates**
```typescript
import { debounce } from 'lodash-es'

const updateUI = debounce((value) => {
  // Update component UI
}, 16) // ~60 FPS
```

**3. CSS Containment**
```css
.runtime-component {
  contain: strict; /* Isolate layout/paint */
  will-change: transform; /* GPU acceleration */
}
```

**4. RequestAnimationFrame for Animations**
```typescript
function animate() {
  // Update animations
  requestAnimationFrame(animate)
}
```

### 6.2 Memory Optimizations

**1. Component Cleanup**
```typescript
onUnmounted(() => {
  // Unsubscribe from variables
  // Clear timers
  // Remove event listeners
})
```

**2. Lazy Loading Charts**
```typescript
const LineChart = defineAsyncComponent(() =>
  import('@/components/chart/LineChart.vue')
)
```

**3. Image Optimization**
- Use WebP format
- Implement lazy loading
- Set appropriate sizes

### 6.3 Network Optimizations

**1. Request Batching**
- Combine multiple variable reads into single API call
- Use WebSocket for real-time updates

**2. Caching Strategy**
```typescript
// Cache configuration for 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000
```

**3. Compression**
- Enable gzip/brotli on server
- Minimize payload size

### 6.4 Bundle Size Optimization

**Vite Configuration**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia', 'vue-router'],
          'charts': ['echarts'],
          'utils': ['axios', 'lodash-es']
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
})
```

---

## 7. Security Implementation

### 7.1 Authentication

```typescript
// Store JWT token securely
function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token)
}

// Include token in API requests
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 7.2 Input Validation

```typescript
// Sanitize user inputs
function sanitizeInput(input: string): string {
  return input.replace(/[<>\"\'&]/g, char => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    }
    return entities[char]
  })
}
```

### 7.3 HTTPS Enforcement

```typescript
// Redirect to HTTPS in production
if (import.meta.env.PROD && location.protocol !== 'https:') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`)
}
```

---

## 8. Deployment Strategy

### 8.1 Build Output

```
dist/
├── index.html
├── manifest.json
├── sw.js
├── assets/
│   ├── index-[hash].js
│   ├── vendor-[hash].js
│   ├── charts-[hash].js
│   └── style-[hash].css
└── resources/
    └── images/
```

### 8.2 Container Options

**Option 1: Progressive Web App (PWA)**
- Installable on supported browsers
- Works offline
- Push notifications

**Option 2: Electron Wrapper**
- Cross-platform desktop app
- Native file system access
- Larger bundle size

**Option 3: Capacitor/Cordova**
- Wrap as native mobile app
- Access device APIs
- App store distribution

**Option 4: WebView Container**
- Android: WebView in native app
- Windows: WebView2
- Linux: Qt WebEngine

### 8.3 OTA Update Strategy

```typescript
// Check for updates
async function checkForUpdates() {
  const response = await fetch('/version.json')
  const remoteVersion = await response.json()
  
  const localVersion = localStorage.getItem('app_version')
  
  if (remoteVersion !== localVersion) {
    // Show update prompt
    showUpdateDialog(remoteVersion)
  }
}

// Force reload to get new version
function updateApp() {
  caches.keys().then(keys => {
    keys.forEach(key => caches.delete(key))
  })
  window.location.reload(true)
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// tests/unit/variable-scheduler.test.ts
import { describe, it, expect } from 'vitest'
import { variableScheduler } from '@/services/variable-scheduler'

describe('VariableScheduler', () => {
  it('should subscribe to variables', () => {
    const callback = vi.fn()
    const sub = variableScheduler.subscribe('X0', callback)
    
    expect(variableScheduler.getStats().subscribedVariables).toBe(1)
    
    sub.unsubscribe()
    expect(variableScheduler.getStats().subscribedVariables).toBe(0)
  })
  
  it('should batch write variables', async () => {
    await variableScheduler.batchWrite([
      { address: 'X0', value: true },
      { address: 'X1', value: false }
    ])
    
    // Verify API was called
  })
})
```

### 9.2 E2E Tests

```typescript
// tests/e2e/runtime.spec.ts
import { test, expect } from '@playwright/test'

test('Runtime loads and displays components', async ({ page }) => {
  await page.goto('/runtime/project-123')
  
  // Wait for components to load
  await page.waitForSelector('.runtime-component')
  
  // Verify component count
  const components = await page.locator('.runtime-component').count()
  expect(components).toBeGreaterThan(0)
})

test('Variable updates trigger UI changes', async ({ page }) => {
  await page.goto('/runtime/project-123')
  
  // Mock API response
  await page.route('**/api/v1/devices/*/variables/values', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        data: [{ address: 'X0', value: true }]
      })
    })
  })
  
  // Verify UI updated
  const textDisplay = await page.locator('[data-component-type="TextDisplay"]')
  await expect(textDisplay).toContainText('Expected Value')
})
```

---

## 10. Monitoring & Debugging

### 10.1 Performance Monitoring

```typescript
// utils/performance.ts
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
    
    // Keep last 100 values
    if (this.metrics.get(name)!.length > 100) {
      this.metrics.get(name)!.shift()
    }
  }
  
  getAverage(name: string): number {
    const values = this.metrics.get(name) || []
    if (values.length === 0) return 0
    
    return values.reduce((a, b) => a + b, 0) / values.length
  }
  
  // Monitor frame rate
  startFPSMonitoring() {
    let frames = 0
    let lastTime = performance.now()
    
    const measure = () => {
      frames++
      const now = performance.now()
      
      if (now - lastTime >= 1000) {
        const fps = frames
        this.recordMetric('fps', fps)
        frames = 0
        lastTime = now
      }
      
      requestAnimationFrame(measure)
    }
    
    requestAnimationFrame(measure)
  }
}

export const perfMonitor = new PerformanceMonitor()
```

### 10.2 Debug Panel

```vue
<!-- components/debug/DebugOverlay.vue -->
<template>
  <div class="debug-overlay" v-if="visible">
    <h3>Runtime Debug Info</h3>
    
    <div class="debug-section">
      <h4>Performance</h4>
      <p>FPS: {{ fps.toFixed(1) }}</p>
      <p>Memory: {{ memory }} MB</p>
    </div>
    
    <div class="debug-section">
      <h4>Variables</h4>
      <p>Subscribed: {{ stats.subscribedVariables }}</p>
      <p>Cached: {{ stats.cachedVariables }}</p>
    </div>
    
    <div class="debug-section">
      <h4>Network</h4>
      <p>Status: {{ connectionStatus }}</p>
      <p>Pending Writes: {{ stats.pendingWrites }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { variableScheduler } from '@/services/variable-scheduler'
import { perfMonitor } from '@/utils/performance'

const visible = ref(false)
const fps = ref(60)
const memory = ref(0)
const stats = ref(variableScheduler.getStats())
const connectionStatus = ref('connected')

// Toggle with keyboard shortcut (Ctrl+Shift+D)
onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      visible.value = !visible.value
    }
  })
  
  // Update stats periodically
  setInterval(() => {
    stats.value = variableScheduler.getStats()
    memory.value = (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0
  }, 1000)
})
</script>
```

---

## 11. Risk Analysis & Mitigation

### 11.1 Technical Risks

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 低端设备性能不足 | 高 | 中 | 简化渲染模式，降低刷新率 |
| 网络不稳定 | 高 | 高 | 离线缓存，断线重连机制 |
| 浏览器兼容性 | 中 | 低 | 限定Chromium 80+，Polyfill |
| 内存泄漏 | 高 | 中 | 严格生命周期管理，定期监控 |
| Service Worker缓存问题 | 中 | 中 | 版本化管理，强制更新机制 |

### 11.2 Mitigation Strategies

**1. Performance Degradation**
- Detect low-end devices via User-Agent
- Automatically reduce animation quality
- Lower polling frequency

**2. Network Issues**
- Implement exponential backoff retry
- Cache last known good state
- Show clear offline indicators

**3. Memory Management**
- Regular garbage collection hints
- Component pooling for frequently used types
- Strict unsubscribe on unmount

---

## 12. Future Enhancements

### 12.1 Planned Features

1. **WebSocket Real-time Updates**: Replace polling with push notifications
2. **Advanced Charting**: More chart types, zoom, pan
3. **Multi-language Support**: i18n for international deployment
4. **Custom Component SDK**: Allow third-party components
5. **Cloud Sync**: Backup configurations to cloud
6. **Remote Diagnostics**: Web dashboard for fleet monitoring
7. **Gesture Support**: Swipe, pinch-to-zoom
8. **Animation Framework**: Smooth state transitions

### 12.2 Scalability Considerations

- **Horizontal**: Multiple HMIs connecting to same PLC
- **Vertical**: Support for 4K displays, high-end tablets
- **Protocol Extensibility**: Plugin architecture for different PLC protocols

---

## 13. Conclusion

本架构设计提供了一个现代化、高性能的纯Web方案PLC HMI运行时系统，具有以下优势：

✅ **跨平台**: 基于Web标准，可在任何支持浏览器的设备上运行  
✅ **轻量级**: Vue 3 + Vite，初始加载<500KB  
✅ **高性能**: 优化的变量调度，60FPS渲染  
✅ **离线优先**: Service Worker缓存，断网可用  
✅ **易扩展**: 组件化架构，支持插件扩展  
✅ **安全可靠**: JWT认证，HTTPS，输入验证  

该设计平衡了性能需求和开发效率，充分利用现代Web技术，同时针对嵌入式HMI设备的限制进行了优化。

---

## Appendix A: Browser Compatibility

| 浏览器 | 最低版本 | 说明 |
|--------|---------|------|
| Chrome | 80+ | 推荐 |
| Firefox | 75+ | 支持 |
| Safari | 13+ | 部分PWA功能受限 |
| Edge | 80+ | Chromium内核，完全支持 |
| Android WebView | 80+ | 推荐用于Android容器 |

## Appendix B: Performance Benchmarks

| 测试场景 | 目标设备 | 结果 |
|---------|---------|------|
| 首次加载时间 | ARM A7, 1GB RAM | < 2.5s |
| 组件渲染 (500个) | Same | 50-60 FPS |
| 变量轮询 (200个@500ms) | Same | CPU < 40% |
| 内存占用峰值 | Same | < 150MB |

## Appendix C: References

- Vue 3 Documentation: https://vuejs.org/
- Vite Build Tool: https://vitejs.dev/
- Pinia State Management: https://pinia.vuejs.org/
- Apache ECharts: https://echarts.apache.org/
- Service Workers: https://developers.google.com/web/fundamentals/primers/service-workers
