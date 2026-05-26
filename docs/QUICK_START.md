# PLC HMI Runtime - 快速启动指南

## 🚀 当前状态

核心框架和基础显示组件已完成,可以开始测试和开发更多组件。

## 📦 已实现的功能

### ✅ 核心框架
- Vue 3 + TypeScript + Vite 项目架构
- Pinia 状态管理 (project, device, ui stores)
- Vue Router 路由配置
- 主题管理系统 (3个预设主题)
- 变量调度器 (轮询、缓存、订阅)
- 表达式引擎 (AST解析)
- 组件注册系统
- 配置加载器

### ✅ Vue Composables
- `useVariable()` - 变量绑定
- `useExpression()` - 表达式计算
- `useTheme()` - 主题管理

### ✅ Display Components
- **TextDisplay** - 文本显示(支持静态文本、变量绑定、表达式)
- **NumericDisplay** - 数值显示(支持格式化、趋势指示、告警阈值)
- **ProgressBar** - 进度条(支持动画、条纹、分段、阈值颜色)

### ✅ 页面和工具
- RuntimeView - 主运行时页面
- ErrorView - 错误显示页面
- DebugPanel - 调试面板(点击5次角落触发)

## 🎯 快速测试

### 1. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 2. 查看演示项目

应用会自动加载内置的演示项目,包含:
- 一个 TextDisplay 组件显示 "Hello HMI Runtime!"
- 一个 NumericDisplay 组件显示温度变量
- 一个 ProgressBar 组件显示进度

### 3. 打开调试面板

在页面上任意位置连续点击5次,会显示调试面板,包含:
- 系统信息 (FPS, 内存)
- 设备连接状态
- 变量调度统计
- 项目信息
- 最近日志

## 📝 使用示例

### 创建新组件

```vue
<!-- src/components/display/MyComponent.vue -->
<template>
  <BaseComponent :instance="instance">
    <div class="my-component" :style="componentStyle">
      {{ displayValue }}
    </div>
  </BaseComponent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseComponent from '@/components/base/BaseComponent.vue'
import { useVariable } from '@/composables/useVariable'
import type { Component } from '@plc/hmi-types'

const props = defineProps<{
  instance: Component
}>()

// 绑定变量
const { value } = useVariable(props.instance.properties.variable)

const displayValue = computed(() => {
  return value.value || 'N/A'
})

const componentStyle = computed(() => ({
  // 样式
}))
</script>
```

### 注册组件

```typescript
// src/components/registerComponents.ts
componentRegistry.register('MyComponent', () => import('./display/MyComponent.vue'))
```

### 在项目配置中使用

```json
{
  "id": "page-1",
  "name": "Main Page",
  "components": [
    {
      "id": "comp-1",
      "type": "MyComponent",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 50,
      "properties": {
        "variable": "temperature"
      }
    }
  ]
}
```

## 🔧 开发下一个组件

参考文档:
- [需求规格说明书](./PLC%20HMI编辑与运行系统需求规格说明书V1.0.md) - 完整的组件定义
- [组件元数据](../docs/core-components.ts) - 核心组件定义
- [API文档](./API_DOCUMENTATION(最终版).md) - API接口说明

建议优先实现的组件:
1. **Switch** - 开关组件(控制类)
2. **Button** - 按钮组件(交互类)
3. **Rectangle** - 矩形(图形类)
4. **ImageDisplay** - 图片显示

## 📊 项目结构

```
src/
├── components/          # 组件
│   ├── base/           # 基础组件
│   │   ├── BaseComponent.vue
│   │   └── ComponentRegistry.ts
│   ├── display/        # 显示组件 ✅
│   │   ├── TextDisplay.vue
│   │   ├── NumericDisplay.vue
│   │   └── ProgressBar.vue
│   └── registerComponents.ts
├── composables/        # Vue组合式函数 ✅
│   ├── useVariable.ts
│   ├── useExpression.ts
│   └── useTheme.ts
├── stores/            # Pinia状态管理 ✅
│   ├── project.ts
│   ├── device.ts
│   └── ui.ts
├── services/          # 核心服务 ✅
│   ├── api.ts
│   ├── variable-scheduler.ts
│   ├── expression-engine.ts
│   ├── theme.ts
│   └── config-loader.ts
├── views/             # 页面视图 ✅
│   ├── RuntimeView.vue
│   └── ErrorView.vue
├── router/            # 路由配置 ✅
│   └── index.ts
└── types/             # TypeScript类型 ✅
    ├── project.ts
    ├── component.ts
    ├── variable.ts
    └── theme.ts
```

## 🎨 主题使用

组件中可以使用主题色:

```typescript
import { resolveColor } from '@/services/theme'

const color = resolveColor({
  useTheme: true,
  themeColorKey: 'stateRunning'  // 从主题获取颜色
})

// 或直接使用十六进制
const color = resolveColor('#ff0000')
```

可用主题色键:
- `primary` - 主色
- `secondary` - 次要色
- `success` - 成功色
- `warning` - 警告色
- `error` - 错误色
- `stateRunning` - 运行状态
- `stateStopped` - 停止状态
- `stateAlarm` - 报警状态

## 🐛 调试技巧

1. **查看控制台日志** - 所有关键操作都有日志输出
2. **使用DebugPanel** - 实时查看系统状态
3. **检查Pinia DevTools** - 查看store状态变化
4. **Vue DevTools** - 检查组件树和响应式数据

## 📖 相关文档

- [README.md](../README.md) - 项目总览
- [需求规格说明书](./PLC%20HMI编辑与运行系统需求规格说明书V1.0.md) - 完整系统设计
- [Runtime System Architecture Design](./Runtime%20System%20Architecture%20Design.md) - 运行时架构

## ⚡ 下一步

1. 实现 Control Components (Switch, Button, Slider)
2. 实现 Graphic Components (Rectangle, Circle, Line)
3. 添加更多 Display Components (LevelIndicator, DateTime等)
4. 编写单元测试
5. 性能优化和代码分割

---

**Happy Coding! 🎉**
