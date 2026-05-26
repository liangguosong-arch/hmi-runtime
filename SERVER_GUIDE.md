# HMI Runtime Server 使用指南

## 概述

本项目使用 Node.js Express 作为统一的 HTTP 服务器，同时提供前端页面服务和后端 API 服务。这种架构确保了开发环境和生产环境的一致性。

## 架构特点

- **统一服务器**：前端页面和后端 API 在同一个端口上运行
- **Vite 集成**：开发环境下使用 Vite 中间件提供热模块替换（HMR）
- **API 路由**：提供项目管理相关的 RESTful API
- **SPA 支持**：正确处理 Vue Router 的路由回退
- **静态文件服务**：自动服务 public 目录和构建后的文件

## 启动方式

### 开发环境

```bash
npm run dev
```

这将启动一个开发服务器，包含：
- Vite HMR 支持
- 实时编译和热更新
- API 端点：`http://localhost:3000/api/*`
- 前端页面：`http://localhost:3000`

### 生产环境

```bash
# 构建并启动
npm start

# 或者分步执行
npm run build
npm run preview
```

## API 端点

### 项目管理 API

#### 1. 更新/保存项目
```
POST /api/projects/update
Content-Type: application/json

{
  "project": { /* ProjectFileDTO */ },
  "filePath": "public/projects/default.hmi"
}
```

响应：
```json
{
  "code": 200,
  "message": "Project updated successfully",
  "data": {
    "path": "public/projects/default.hmi"
  }
}
```

#### 2. 获取项目列表
```
GET /api/projects
```

响应：
```json
{
  "code": 200,
  "data": [
    {
      "id": "project-id",
      "name": "Project Name",
      "version": "1.0.0",
      "fileName": "default.hmi",
      "path": "public/projects/default.hmi"
    }
  ]
}
```

#### 3. 获取单个项目
```
GET /api/projects/:projectName
```

响应：
```json
{
  "code": 200,
  "data": { /* ProjectFileDTO */ }
}
```

#### 4. 健康检查
```
GET /api/health
```

响应：
```json
{
  "code": 200,
  "message": "OK",
  "timestamp": 1777276538227,
  "environment": "development"
}
```

## 配置说明

### 环境变量

项目使用以下环境变量进行配置：

#### .env (开发环境)
```env
# Device Service Configuration
VITE_DEVICE_HOST=localhost
VITE_DEVICE_PORT=8080

# Server Configuration
PORT=3000
NODE_ENV=development
```

#### .env.production (生产环境)
```env
# Device Service Configuration
VITE_DEVICE_HOST=localhost
VITE_DEVICE_PORT=8080

# Server Configuration
PORT=3000
NODE_ENV=production
```

### API 客户端配置

项目中有两个 API 客户端：

1. **apiClient** - 用于本地项目管理 API
   - Base URL: `/api`
   - 用途：项目保存、加载等

2. **deviceApiClient** - 用于设备/PLC 通信
   - Base URL: `http://localhost:8080/api/v1` (可动态配置)
   - 用途：变量读写、设备状态查询等

## 项目文件存储

项目文件（.hmi）默认存储在 `public/projects/` 目录下。服务器会自动创建该目录（如果不存在）。

## 安全特性

- **CORS 支持**：已配置跨域资源共享
- **路径安全检查**：防止目录遍历攻击
- **错误处理**：完善的错误处理和日志记录
- **优雅关闭**：支持 SIGTERM 和 SIGINT 信号处理

## 故障排除

### 端口被占用

如果端口 3000 被占用，可以通过环境变量修改：

```bash
# Windows PowerShell
$env:PORT=3001; npm run dev

# Linux/Mac
PORT=3001 npm run dev
```

### 依赖安装问题

如果遇到依赖安装问题，尝试：

```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### Vite HMR 不工作

确保：
1. 使用的是 `npm run dev` 而不是直接运行 `node server.js`
2. NODE_ENV 设置为 `development`
3. 浏览器控制台没有报错

## 部署建议

### Docker 部署示例

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "server.js"]
```

### Nginx 反向代理

如果使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name hmi.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 开发注意事项

1. **不要直接修改 dist 目录**：所有更改应该在 src 目录中进行，然后通过 `npm run build` 生成
2. **API 测试**：可以使用 Postman 或 curl 测试 API 端点
3. **日志查看**：服务器日志会输出到控制台，便于调试
4. **热更新**：修改 Vue 组件后，浏览器会自动刷新

## 技术支持

如有问题，请查看：
- 服务器控制台日志
- 浏览器开发者工具控制台
- 网络请求详情
