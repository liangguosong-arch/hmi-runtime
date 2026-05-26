# Toast 消息提示系统使用指南

## 概述

Toast 是一个全局的消息提示系统，用于向用户显示各种类型的通知消息，包括成功、错误、警告和信息提示。

## 架构

```
RuntimeView.vue (提供 toastService)
    ↓ provide('toastService')
所有子组件可以通过以下方式访问：
    1. 直接使用 toastService
    2. 通过 inject 获取
    3. 使用 useToast composable
```

## 使用方式

### 方式 1：直接导入（推荐）

最简单的方式，适用于任何组件：

```vue
<script setup lang="ts">
import { toastService } from '@/services/toast-service'

function handleClick() {
  // 显示成功消息
  toastService.success('操作成功！')

  // 显示错误消息
  toastService.error('操作失败，请重试')

  // 显示警告消息
  toastService.warning('请注意检查输入')

  // 显示信息消息
  toastService.info('这是一条提示信息')
}
</script>
```

### 方式 2：通过 inject 获取

适用于需要解耦或测试的场景：

```vue
<script setup lang="ts">
import { inject } from 'vue'

const toastService = inject<any>('toastService')

function handleClick() {
  if (toastService) {
    toastService.success('操作成功！')
  }
}
</script>
```

### 方式 3：使用 useToast composable

提供更丰富的 API：

```vue
<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { showSuccess, showError, showWarning, showInfo, showToast } = useToast()

function handleClick() {
  showSuccess('操作成功！')
  showError('操作失败')
  showWarning('请注意')
  showInfo('提示信息')

  // 自定义选项
  showToast('自定义消息', {
    type: 'success',
    duration: 5000,
    title: '标题'
  })
}
</script>
```

## API 参考

### toastService 方法

#### `show(options)`
显示一个 toast 通知

```typescript
toastService.show({
  message: '消息内容',
  type: 'info',        // 'info' | 'success' | 'warning' | 'error'
  duration: 3000,      // 持续时间（毫秒），0 表示不自动关闭
  title: '标题'        // 可选
})
```

#### `info(message, duration?)`
显示信息消息

```typescript
toastService.info('这是一条提示信息', 3000)
```

#### `success(message, duration?)`
显示成功消息

```typescript
toastService.success('操作成功！', 3000)
```

#### `warning(message, duration?)`
显示警告消息

```typescript
toastService.warning('请注意检查输入', 5000)
```

#### `error(message, duration?)`
显示错误消息

```typescript
toastService.error('操作失败，请重试', 5000)
```

#### `remove(id)`
手动移除指定的 toast

```typescript
const id = toastService.success('操作成功')
// 稍后手动移除
toastService.remove(id)
```

#### `clear()`
清除所有 toast

```typescript
toastService.clear()
```

### useToast composable

```typescript
interface UseToastReturn {
  showMessage: (message: string, type?: ToastType, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showToast: (message: string, options?: {
    type?: ToastType
    duration?: number
    title?: string
  }) => void
}
```

## 使用示例

### LoginPanel 登录成功/失败提示

```vue
<script setup lang="ts">
import { toastService } from '@/services/toast-service'

async function handleLogin() {
  try {
    const result = await login(username, password)

    if (result.success) {
      toastService.success('登录成功！')
      // 跳转到主页
    } else {
      toastService.error(result.message || '登录失败')
    }
  } catch (error) {
    toastService.error('网络错误，请稍后重试')
  }
}
</script>
```

### LogoutButton 注销提示

```vue
<script setup lang="ts">
import { toastService } from '@/services/toast-service'

async function handleLogout() {
  try {
    await logout()
    toastService.success('已成功注销')
  } catch (error) {
    toastService.error('注销失败，请重试')
  }
}
</script>
```

### 表单验证提示

```vue
<script setup lang="ts">
import { toastService } from '@/services/toast-service'

function validateForm() {
  if (!formData.username) {
    toastService.warning('请输入用户名')
    return false
  }

  if (!formData.email) {
    toastService.warning('请输入邮箱地址')
    return false
  }

  if (!isValidEmail(formData.email)) {
    toastService.error('邮箱格式不正确')
    return false
  }

  return true
}
</script>
```

### 长时间操作提示

```vue
<script setup lang="ts">
import { toastService } from '@/services/toast-service'

async function handleExport() {
  // 显示正在处理的提示（不自动关闭）
  const toastId = toastService.info('正在导出数据，请稍候...', 0)

  try {
    await exportData()
    toastService.remove(toastId)
    toastService.success('导出成功！')
  } catch (error) {
    toastService.remove(toastId)
    toastService.error('导出失败，请重试')
  }
}
</script>
```

## 最佳实践

1. **选择合适的消息类型**
   - `success`: 操作成功完成
   - `error`: 操作失败或发生错误
   - `warning`: 需要注意但不阻止操作
   - `info`: 一般性提示信息

2. **设置合理的持续时间**
   - 短消息：2000-3000ms
   - 中等消息：4000-5000ms
   - 长消息：6000-8000ms
   - 重要消息：0（不自动关闭，需用户手动关闭）

3. **消息文案简洁明了**
   - 避免过长的消息
   - 使用用户能理解的语言
   - 必要时添加标题

4. **避免过度使用**
   - 不要在循环中频繁显示 toast
   - 重要的操作才显示提示
   - 考虑合并多个相关提示

## 样式定制

Toast 组件支持以下样式定制：

- 位置：固定在右上角（top: 20px, right: 20px）
- 最大宽度：400px
- 最小宽度：300px
- 颜色主题：根据类型自动应用不同颜色
- 深色模式：自动适配系统深色主题

## 注意事项

1. Toast 组件已在 RuntimeView 中全局注册，无需额外引入
2. toastService 是单例，所有组件共享同一个实例
3. Toast 会自动堆叠显示，最多同时显示多个消息
4. 点击 Toast 可以手动关闭
5. 鼠标悬停时不会自动关闭
