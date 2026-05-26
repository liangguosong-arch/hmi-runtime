# PLC HMI Runtime System

基于 Vue 3 + TypeScript 的纯Web方案PLC HMI运行时系统。

## 项目结构

```
plc-hmi-runtime/
├── src/
│   ├── main.ts                    # 应用入口
│   ├── App.vue                    # 根组件
│   │
│   ├── types/                     # TypeScript类型定义
│   │   ├── index.ts
│   │   ├── project.ts            # 项目/页面/组件类型
│   │   ├── component.ts          # 组件元数据类型
│   │   ├── variable.ts           # 变量相关类型
│   │   ├── theme.ts              # 主题类型
│   │   └── api.ts                # API响应类型
│   │
│   ├── services/                  # 核心服务层
│   │   ├── api.ts                # HTTP客户端 (Axios)
│   │   ├── variable-scheduler.ts # 变量调度器 ⭐核心
│   │   ├── expression-engine.ts  # 表达式引擎 (AST)
│   │   ├── theme.ts              # 主题管理系统
│   │   ├── websocket.ts          # WebSocket客户端
│   │   └── config-loader.ts      # 配置加载器
│   │
│   ├── stores/                    # Pinia状态管理
│   │   ├── project.ts            # 项目状态
│   │   ├── device.ts             # 设备状态
│   │   └── ui.ts                 # UI状态
│   │
│   ├── components/                # 运行时组件
│   │   ├── base/
│   │   │   ├── BaseComponent.vue # 组件基类
│   │   │   └── ComponentRegistry.ts # 组件注册表
│   │   ├── display/              # 显示组件
│   │   │   ├── TextDisplay.vue
│   │   │   ├── NumericDisplay.vue
│   │   │   └── ...
│   │   ├── control/              # 控制组件
│   │   │   ├── Switch.vue
│   │   │   ├── Button.vue
│   │   │   └── ...
│   │   ├── chart/                # 图表组件
│   │   │   ├── BarChart.vue
│   │   │   ├── TrendChart.vue
│   │   │   └── PieChart.vue
│   │   └── industrial/           # 工业组件
│   │       ├── Tank.vue
│   │       ├── Motor.vue
│   │       └── ...
│   │
│   ├── composables/               # Vue组合式函数
│   │   ├── useVariable.ts        # 变量绑定
│   │   ├── useExpression.ts      # 表达式计算
│   │   └── useTheme.ts           # 主题钩子
│   │
│   ├── views/                     # 页面视图
│   │   ├── RuntimeView.vue       # 运行时主页面
│   │   └── ErrorView.vue         # 错误页面
│   │
│   └── router/                    # 路由配置
│       └── index.ts
│
├── public/
│   ├── index.html
│   ├── manifest.json             # PWA清单
│   └── sw.js                     # Service Worker
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 已完成的模块

### ✅ Phase 1: 核心框架 (已完成)
- [x] Vite + Vue 3 + TypeScript 项目配置
- [x] 类型系统定义 (Project, Component, Variable, Theme)
- [x] 主题管理系统 (多主题切换, CSS变量同步)
- [x] HTTP API客户端 (Axios + JWT认证)
- [x] 变量调度器 (轮询, 缓存, 订阅机制)
- [x] 表达式引擎 (AST解析, 依赖追踪)
- [x] Vue Composables (useVariable, useExpression, useTheme)
- [x] 组件注册系统 (ComponentRegistry)
- [x] BaseComponent 基类
- [x] Pinia Stores (project, device, ui)
- [x] Vue Router 配置
- [x] RuntimeView 和 ErrorView 页面
- [x] DebugPanel 调试面板
- [x] Config Loader 配置加载器

### ✅ Phase 2: Display Components (已完成)
- [x] TextDisplay - 文本显示组件
- [x] NumericDisplay - 数值显示组件
- [x] ProgressBar - 进度条组件

### 🚧 Phase 3: 待实现
- [ ] 控制组件: Switch, Button, Slider
- [ ] 图形组件: Rectangle, Circle, Line
- [ ] 图表组件: BarChart, TrendChart, PieChart
- [ ] 工业组件: Tank, Motor, Pump, Valve, Pipe
- [ ] 报警组件: AlarmBanner, AlarmTable
- [ ] 容器组件: Group, TabContainer
- [ ] PWA配置 (Service Worker)
- [ ] 单元测试
- [ ] 性能优化

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

## 核心架构说明

### 1. 变量调度器 (VariableScheduler)

**位置**: `src/services/variable-scheduler.ts`

**功能**:
- 统一变量轮询 (默认500ms)
- 差异更新 (只在值变化时通知)
- 写入队列 + 批处理
- 订阅/取消订阅机制

**使用示例**:
```typescript
import { variableScheduler } from '@/services/variable-scheduler'

// 订阅变量
const subscription = variableScheduler.subscribe('X0', (value) => {
  console.log('X0 changed:', value)
})

// 获取当前值
const currentValue = variableScheduler.getValue('X0')

// 写入变量
await variableScheduler.write('X0', true)

// 取消订阅
subscription.unsubscribe()
```

### 2. 表达式引擎 (ExpressionEngine)

**位置**: `src/services/expression-engine.ts`

**功能**:
- AST解析和执行
- 支持算术/逻辑/条件表达式
- 变量依赖提取
- 缓存优化

**支持的表达式**:
```javascript
// 算术运算
${temp} + 10
${pressure} * 2 - 5

// 逻辑运算
${temp} > 100 && ${pressure} < 50

// 条件表达式
${status} == 1 ? '运行' : '停止'

// 复杂表达式
${temp} > 80 ? 'red' : (${temp} > 60 ? 'yellow' : 'green')
```

### 3. 主题系统 (Theme)

**位置**: `src/services/theme.ts`

**功能**:
- 3个预设主题 (亮色/暗色/高对比度)
- CSS变量自动同步
- localStorage持久化
- 运行时动态切换

**使用示例**:
```typescript
import { setTheme, getThemeColor, resolveColor } from '@/services/theme'

// 切换主题
setTheme('dark-industrial')

// 在组件中使用主题色
const color = resolveColor(props.backgroundColor)
// props.backgroundColor = { useTheme: true, themeColorKey: 'stateRunning' }
```

## 组件实现指南

### 组件模板

```vue
<template>
  <div
    class="runtime-component"
    :style="componentStyle"
    @click="handleClick"
  >
    <!-- 组件内容 -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useVariable } from '@/composables/useVariable'
import { resolveColor } from '@/services/theme'

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

// 变量绑定示例
const varName = props.properties.variable
const { value, setValue } = useVariable(varName)

// 样式计算
const componentStyle = computed(() => ({
  position: 'absolute',
  left: `${props.x}px`,
  top: `${props.y}px`,
  width: `${props.width}px`,
  height: `${props.height}px`,
  zIndex: props.zIndex || 0,
  color: resolveColor(props.properties.color)
}))

// 事件处理
const handleClick = async () => {
  // 触发表达式或写入变量
  if (props.events?.onClick) {
    // 执行事件脚本
  }
}
</script>

<style scoped>
.runtime-component {
  contain: strict; /* 性能优化 */
}
</style>
```

## 下一步工作

### Phase 3: 控制组件 (下一步)
1. Switch - 开关组件
2. Button - 按钮组件
3. Slider - 滑块组件
4. Input - 输入框组件

### Phase 4: 图形和容器组件
1. 基本图形: Rectangle, Circle, Line, Polygon
2. 容器: Group, TabContainer
3. 图片显示: ImageDisplay

### Phase 5: 高级组件
1. 图表组件: BarChart, TrendChart, PieChart (使用ECharts)
2. 工业组件: Tank, Motor, Pump, Valve, Pipe
3. 报警组件: AlarmBanner, AlarmTable

### Phase 6: PWA和优化
1. Service Worker配置
2. 离线缓存策略
3. 性能优化 (懒加载, 代码分割)
4. 单元测试

## 技术栈

- **框架**: Vue 3.4 + Composition API
- **状态管理**: Pinia 2.1
- **路由**: Vue Router 4.2
- **HTTP**: Axios 1.6
- **图表**: ECharts 5.4
- **构建工具**: Vite 5.0
- **CSS**: Tailwind CSS 3.4
- **语言**: TypeScript 5.3

## 性能目标

| 指标 | 目标值 |
|------|--------|
| 首次加载时间 | < 2.5秒 |
| 帧率 | ≥ 50 FPS |
| 变量更新延迟 | < 200ms |
| 内存占用 | < 150MB |
| Bundle大小 (gzipped) | < 500KB |

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Android WebView 80+

## License

MIT
"# hmi-runtime" 
