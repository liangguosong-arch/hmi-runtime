# Express 统一服务器实现总结

## 实现概述

成功将 PLC HMI Runtime 项目改造为使用 Node.js Express 作为统一的 HTTP 服务器，同时提供前端页面服务和后端 API 服务。

## 主要变更

### 1. 新增文件

#### server.js
- 统一的 Express 服务器入口
- 开发环境集成 Vite 中间件（支持 HMR）
- 生产环境服务静态文件
- 提供项目管理 API 端点
- SPA 路由回退支持

#### .env 和 .env.production
- 环境配置文件
- 定义端口、设备服务等配置

#### SERVER_GUIDE.md
- 详细的使用指南
- API 文档
- 部署建议

### 2. 修改文件

#### package.json
**新增依赖：**
- `express`: ^4.18.2 - Web 框架
- `cors`: ^2.8.5 - CORS 支持
- `@types/express`: ^4.17.21 - TypeScript 类型定义
- `@types/cors`: ^2.8.17 - TypeScript 类型定义

**脚本更新：**
```json
{
  "dev": "node server.js",           // 原: "vite"
  "preview": "node server.js",       // 原: "vite preview"
  "start": "npm run build && node server.js"  // 新增
}
```

#### src/services/api.ts
**主要变更：**
- 分离了两个 API 客户端：
  - `apiClient`: 用于本地项目管理 API (`/api`)
  - `deviceApiClient`: 用于设备/PLC 通信 (动态配置)
- 新增 `projectApi` 对象，封装项目管理相关方法
- 更新 `deviceApi` 使用 `deviceApiClient`
- 简化错误处理逻辑

#### src/services/config-loader.ts
**主要变更：**
- 导入 `projectApi` 替代直接使用 `apiClient`
- 使用 `projectApi.updateProject()` 方法
- 代码更简洁，职责更清晰

## 架构优势

### 1. 环境一致性
- 开发和生产环境使用相同的服务器架构
- 减少环境差异导致的问题
- 简化部署流程

### 2. 统一端口
- 前端和 API 在同一端口运行
- 避免跨域问题
- 简化配置

### 3. 开发体验
- 保留 Vite HMR 功能
- 实时编译和热更新
- 完整的开发工具链

### 4. 生产性能
- Express 高效服务静态文件
- 合理的缓存策略
- 低资源占用

## API 端点

### 项目管理 API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/projects/update` | 更新/保存项目 |
| GET | `/api/projects` | 获取项目列表 |
| GET | `/api/projects/:projectName` | 获取单个项目 |
| GET | `/api/health` | 健康检查 |

### 设备通信 API

通过 `deviceApiClient` 访问外部设备服务：
- 变量读写
- 批量操作
- 设备状态查询

## 测试结果

### ✅ 服务器启动
```
🚀 HMI Runtime Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Environment: Development
  Frontend:    http://localhost:3000
  API Base:    http://localhost:3000/api
  Projects:    http://localhost:3000/api/projects
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ✅ API 测试
- 健康检查: `GET /api/health` - 返回 200
- 项目列表: `GET /api/projects` - 返回项目列表
- 项目更新: `POST /api/projects/update` - 成功保存文件

### ✅ 文件存储
- 项目文件成功保存到 `public/projects/` 目录
- JSON 格式正确
- 自动创建目录

## 使用说明

### 开发环境
```bash
npm run dev
```
访问: http://localhost:3000

### 生产环境
```bash
npm start
```
或分步执行:
```bash
npm run build
npm run preview
```

## 迁移注意事项

### 对现有代码的影响
1. **API 调用**: 所有使用 `apiClient` 的地方现在指向 `/api` 而不是设备服务
2. **设备通信**: 使用 `deviceApiClient` 进行 PLC 通信
3. **环境变量**: 确保 `.env` 文件存在且配置正确

### 向后兼容
- 现有的项目文件格式保持不变
- 设备通信逻辑保持不变
- Vue 组件无需修改

## 未来扩展

### 可能的增强
1. **WebSocket 支持**: 添加实时通信功能
2. **用户认证**: 实现登录和权限管理
3. **项目版本控制**: 支持项目历史版本
4. **备份恢复**: 自动备份项目文件
5. **监控日志**: 详细的访问和操作日志

### 性能优化
1. **缓存策略**: 添加 HTTP 缓存头
2. **压缩**: 启用 gzip/brotli 压缩
3. **CDN**: 静态资源 CDN 加速
4. **负载均衡**: 多实例部署支持

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 修改端口
   $env:PORT=3001; npm run dev
   ```

2. **依赖安装失败**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Vite HMR 不工作**
   - 确认使用 `npm run dev`
   - 检查 NODE_ENV 是否为 development
   - 查看浏览器控制台错误

## 总结

成功实现了基于 Express 的统一服务器架构，具有以下特点：

✅ 开发和生产环境一致
✅ 前端和 API 统一端口
✅ 保留 Vite 开发体验
✅ 完整的项目管理 API
✅ 良好的错误处理和日志
✅ 易于部署和维护

该实现为项目提供了坚实的基础，支持未来的功能扩展和优化。
