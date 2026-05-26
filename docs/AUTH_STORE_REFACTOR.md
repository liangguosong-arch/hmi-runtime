# 用户会话管理重构

## 概述

本次重构将用户会话管理从直接使用localStorage迁移到使用Pinia store，以提供更好的响应式更新、类型安全性和可维护性。

## 变更内容

### 1. 创建了认证Store (`src/stores/auth.ts`)

- 定义了`SessionData`接口来规范会话数据结构
- 实现了响应式的会话状态管理
- 提供了获取当前用户信息的计算属性
- 保留了localStorage作为持久化存储，但通过store统一管理

### 2. 更新了登录面板 (`src/components/system/LoginPanel.vue`)

- 引入并使用`useAuthStore`
- 登录成功后通过`authStore.setSession()`保存会话数据
- 移除了直接的localStorage操作

### 3. 更新了用户显示组件 (`src/components/system/UserDisplay.vue`)

- 引入并使用`useAuthStore`
- 优先从auth store获取用户信息，回退到组件属性
- 实现了响应式的用户信息显示

### 4. 更新了登出按钮 (`src/components/system/LogoutButton.vue`)

- 引入并使用`useAuthStore`
- 登出时通过`authStore.clearSession()`清除会话
- 移除了直接的localStorage操作

### 5. 更新了API服务 (`src/services/api.ts`)

- 请求拦截器现在从auth store获取token
- 刷新token功能也更新为使用auth store

### 6. 更新了应用初始化 (`src/main.ts`)

- 在应用启动时加载存储在localStorage中的会话数据

## 优势

1. **响应式更新**: 当用户登录或登出时，所有依赖用户信息的组件会自动更新
2. **类型安全**: TypeScript支持更好的类型检查
3. **集中管理**: 所有会话相关逻辑集中在一个地方
4. **易于测试**: Store模式更容易进行单元测试
5. **向后兼容**: 仍然使用localStorage进行持久化，页面刷新后会话不会丢失

## 使用方式

### 在其他组件中获取用户信息

```typescript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 获取当前用户信息
const username = authStore.currentUsername
const role = authStore.currentRole
const isAuthenticated = authStore.isAuthenticated
```

### 登录/登出

```typescript
// 登录成功后
authStore.setSession({
  username: 'user',
  displayName: 'User Name',
  userId: '123',
  token: 'jwt-token',
  role: 'admin'
})

// 登出时
authStore.clearSession()
```