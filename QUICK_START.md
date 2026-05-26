# 快速启动指南

## 🚀 5分钟快速开始

### 1. 安装依赖（首次运行）

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 3. 访问应用

打开浏览器访问：http://localhost:3000

### 4. 测试 API

```powershell
# 健康检查
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing

# 获取项目列表
Invoke-WebRequest -Uri "http://localhost:3000/api/projects" -UseBasicParsing
```

## 📦 生产部署

### 构建并启动

```bash
npm start
```

这将：
1. 构建 Vue 应用
2. 启动生产服务器

### 分步执行

```bash
# 步骤 1: 构建
npm run build

# 步骤 2: 启动
npm run preview
```

## 🔧 配置说明

### 修改端口

创建或编辑 `.env` 文件：

```env
PORT=3001
```

### 配置设备服务

编辑 `.env` 文件：

```env
VITE_DEVICE_HOST=192.168.1.100
VITE_DEVICE_PORT=8080
```

## 📁 项目结构

```
runtime/
├── server.js              # Express 服务器
├── src/                   # Vue 源代码
│   ├── services/
│   │   ├── api.ts        # API 客户端配置
│   │   └── config-loader.ts  # 项目加载器
│   └── ...
├── public/
│   └── projects/         # 项目文件存储目录
│       └── *.hmi
├── dist/                 # 构建输出（自动生成）
├── .env                  # 开发环境配置
└── .env.production      # 生产环境配置
```

## 🎯 常用命令

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产版本 |
| `npm start` | 构建并启动生产服务器 |
| `npm test` | 运行测试 |

## 🐛 常见问题

### Q: 端口 3000 被占用怎么办？

A: 修改 `.env` 文件中的 PORT 变量，或使用环境变量：
```bash
$env:PORT=3001; npm run dev  # PowerShell
PORT=3001 npm run dev        # Linux/Mac
```

### Q: 如何查看服务器日志？

A: 服务器日志会直接输出到控制台。查看：
- 启动信息
- API 请求日志
- 错误信息

### Q: 项目文件保存在哪里？

A: 默认保存在 `public/projects/` 目录下，文件格式为 `.hmi`（JSON）。

### Q: 如何重置项目？

A: 删除 `public/projects/` 目录下的项目文件，重新启动服务器会自动创建默认项目。

## 📞 获取帮助

- 查看 [SERVER_GUIDE.md](./SERVER_GUIDE.md) 获取详细文档
- 查看 [EXPRESS_SERVER_IMPLEMENTATION.md](./EXPRESS_SERVER_IMPLEMENTATION.md) 了解实现细节
- 检查服务器控制台输出
- 查看浏览器开发者工具

## ✨ 下一步

1. **浏览项目**：访问 http://localhost:3000 查看 HMI 运行时
2. **测试 API**：使用 Postman 或 curl 测试 API 端点
3. **创建项目**：通过编辑器创建新的 HMI 项目
4. **连接设备**：配置 PLC 设备连接参数

---

**祝您使用愉快！** 🎉
