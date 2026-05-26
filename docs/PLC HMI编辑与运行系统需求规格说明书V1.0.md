[TOC]

# 第一章 系统总体架构与模块划分（模块级需求）

# 1.1 系统整体架构

系统采用 **设计时 + 运行时分离架构**。

## 1.1.1 架构总览

```
┌─────────────────────────────────┐
│        设计时系统                │
│  (Cloud Web + Electron + Vue3)  │
└────────────────┬────────────────┘
                 │ 发布
                 ▼
    ┌──────────────────────────┐
    │       运行时系统          │
    │        (Android)         │
    └─────────────┬────────────┘
                  │ HTTP/HTTPS
                  ▼
    ┌──────────────────────────┐
    │       PLC 接口服务        │
    └──────────────────────────┘
```

# 1.2 设计时系统模块划分

设计时系统必须拆分为以下独立模块：

## 1.2.1 项目管理模块（Project Manager）

### 职责

- 管理 HMI 项目文件
- 新建/打开/保存/删除项目
- 管理版本号
- 管理最近打开列表

### 功能要求

1. 支持新建项目：
   - 输入项目名称
   - 设置默认分辨率
   - 选择目标设备型号

2. 支持保存：
   - 手动保存
   - 自动保存（默认 2 分钟一次）
   - 保存前数据校验

3. 支持打开：
   - 本地文件
   - 云端文件

4. 支持版本控制：
   - 自动生成 version 字段
   - 支持版本升级策略（向下兼容）

### 模块接口

```ts
createProject(config: ProjectConfig): Project
openProject(path: string): Project
saveProject(project: Project): void
exportProject(project: Project, type: "full" | "config"): File
```

## 1.2.2 组件库模块（Component Registry）

### 职责

- 注册所有可用组件类型
- 提供组件元数据
- 支持插件扩展

### 数据结构

```ts
interface ComponentMeta {
  type: string
  category: string
  defaultSize: { width: number; height: number }
  propertiesSchema: PropertySchema[]
  supportsEvents: string[]
}
```

### 功能要求

1. 分类展示
2. 列表/宫格模式切换
3. 动态加载插件组件

## 1.2.3 画布编辑模块（Canvas Editor）

### 职责

- 提供可视化编辑能力
- 拖拽、缩放、对齐
- 管理组件实例

### 必须支持功能

#### 拖拽

- 拖入时显示虚影
- 自动吸附网格（默认开启）
- 支持关闭吸附

#### 多选操作

- Shift 多选
- 框选
- 批量移动

#### 对齐辅助

- 自动对齐线
- 等间距分布

#### 图层管理

- 置顶
- 置底
- 上移一层
- 下移一层

#### 群组管理

- 群组
- 解除群组

### 数据结构

```ts
interface Component {
  id: string
  type: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  properties: Record<string, any>
  zIndex: number
}
```

## 1.2.4 属性编辑模块（Property Panel）

### 职责

- 编辑组件属性
- 校验属性合法性
- 提供变量绑定 UI

### 功能要求

1. 动态生成属性表单
2. 支持以下类型：
   - string
   - number
   - boolean
   - enum
   - variable selector

3. 实时校验
4. 修改后实时更新画布

## 1.2.5 事件脚本模块（Event Engine - Design Time）

### 职责

- 编辑脚本
- 提供语法提示
- 校验脚本合法性

### 要求

1. 支持 JavaScript
2. 提供内置 API：
   - getComponent(id)
   - setValue(componentId, value)
   - httpRequest(config)

3. 禁止访问 window / document

## 1.2.6 仿真模块（Simulator）

### 职责

- 在设计时模拟运行时行为
- 真实发起 HTTP 请求
- 显示通信日志

### 功能

- 模拟变量轮询
- 模拟写入
- 模拟异常
- 断网测试

## 1.2.7 发布模块（Publisher）

### 职责

- 打包运行时
- 生成配置文件
- 上传到设备

### 发布类型

| 类型   | 内容         |
| ------ | ------------ |
| full   | APK + config |
| config | 仅配置文件   |

### 接口

```ts
buildFullPackage(project: Project): File
buildConfigPackage(project: Project): File
uploadToDevice(ip: string, file: File): Result
```

# 1.3 运行时系统模块划分

## 1.3.1 配置加载模块

职责：

- 解析 JSON
- 校验版本
- 构建组件树

## 1.3.2 渲染引擎模块

职责：

- 渲染组件
- 处理动画
- 支持缩放

## 1.3.3 变量调度模块（核心模块）

职责：

- 管理变量缓存
- 统一轮询
- 批量读取
- 去重

必须实现：

```ts
subscribe(variableName: string, callback: Function)
write(variableName: string, value: any)
startPolling()
stopPolling()
```

## 1.3.4 通信模块

职责：

- HTTP 封装
- 重试机制
- 超时机制

## 1.3.5 事件执行模块

职责：

- 执行脚本
- 沙箱环境
- 异常捕获

## 1.3.6 日志模块

职责：

- 本地日志记录
- 导出日志
- 日志等级控制

# 1.4 部署结构

## 1.4.1 设计时部署

- 云服务器
- CDN 静态资源
- WebSocket（可选）

## 1.4.2 运行时部署

- Android APK
- 本地配置文件目录
- 支持 OTA 更新

# 第二章 设计时系统 —— 项目管理模块

本章定义数据模型、状态机、接口契约、异常场景、版本策略、并发控制，可直接用于后端与前端实现。

# 2.1 模块定位

项目管理模块负责：

- HMI 项目的生命周期管理
- 本地与云端存储管理
- 自动保存机制
- 项目版本控制
- 文件结构校验

# 2.2 核心数据模型定义

## 2.2.1 Project 数据结构（完整定义）

```ts
interface Project {
  id: string // UUID
  name: string // 项目名称
  version: string // 语义化版本号 1.0.0
  createdAt: number // 时间戳
  updatedAt: number
  resolution: {
    width: number
    height: number
  }
  deviceModel?: string
  pages: Page[]
  globalVariables: Variable[]
  resources: Resource[]
  metadata: {
    author?: string
    description?: string
    thumbnail?: string
  }
}
```

## 2.2.2 Page 数据结构

```ts
interface Page {
  id: string
  name: string
  background?: string
  components: Component[]
}
```

## 2.2.3 Variable 数据结构

```ts
interface Variable {
  name: string
  type: 'int' | 'float' | 'bool' | 'string'
  address?: string
  pollingInterval?: number
  defaultValue?: any
}
```

## 2.2.4 Resource 数据结构

```ts
interface Resource {
  id: string
  type: 'image' | 'font'
  path: string
  hash: string
}
```

# 2.3 项目生命周期状态机

## 2.3.1 状态定义

| 状态    | 描述         |
| ------- | ------------ |
| INIT    | 未创建       |
| CREATED | 新建未保存   |
| CLEAN   | 已保存无修改 |
| DIRTY   | 已修改未保存 |
| SAVING  | 保存中       |
| ERROR   | 保存失败     |

## 2.3.2 状态流转规则

```
INIT → CREATED
CREATED → DIRTY
DIRTY → SAVING
SAVING → CLEAN
SAVING → ERROR
CLEAN → DIRTY
```

## 2.3.3 强制规则

- 若状态为 DIRTY，关闭编辑界面必须弹出确认框
- 若状态为 SAVING，不允许再次触发保存
- 自动保存成功后状态变为 CLEAN

# 2.4 功能需求详细定义

# 2.4.1 新建项目

## 输入

- name
- resolution
- deviceModel（可选）

## 校验规则

- name 不可为空
- name 不可包含非法字符（/:\*?"<>|）
- resolution 必须 ≥ 320x240
- 分辨率最大不超过 4K

## 默认行为

- 自动创建第一页
- 自动生成 UUID
- 版本号初始化为 1.0.0

# 2.4.2 打开项目

支持：

- 本地 JSON 文件
- 云端项目 ID

## 打开流程

1. 读取 JSON
2. 校验 JSON Schema
3. 校验 version 字段
4. 若版本低于当前版本 → 执行升级策略
5. 构建内存对象

## 错误场景

| 错误          | 处理               |
| ------------- | ------------------ |
| JSON 格式错误 | 提示文件损坏       |
| 版本过高      | 提示需要升级编辑器 |
| 资源缺失      | 列出缺失资源       |

# 2.4.3 保存项目

## 保存类型

- 手动保存
- 自动保存

## 自动保存机制

- 触发条件：
  - 有修改
  - 距离上次保存 ≥ 120 秒

- 自动保存文件名：
  `projectName.autosave.json`
- 启动时检测是否存在未正常关闭的 autosave 文件

## 保存流程

1. 进入 SAVING 状态
2. 执行数据完整性校验
3. 写入文件（原子写入）
4. 成功 → CLEAN
5. 失败 → ERROR

## 原子写入策略（必须实现）

1. 写入临时文件
2. 校验成功
3. 替换原文件

避免文件损坏。

# 2.4.4 项目导出

## 导出完整包

包含：

- config.json
- resources/
- manifest.json

## manifest.json 结构

```json
{
  "projectId": "uuid",
  "version": "1.0.0",
  "buildTime": 1700000000,
  "editorVersion": "2.1.0"
}
```

## 导出配置文件

- 仅 config.json
- 必须包含 version 字段

# 2.5 版本控制策略

## 2.5.1 语义版本规范

格式：

```
MAJOR.MINOR.PATCH
```

规则：

- MAJOR：结构性变更
- MINOR：新增字段
- PATCH：修复

## 2.5.2 升级策略

系统必须维护：

```ts
upgradeMap: Record<string, (project: any) => any>
```

当旧版本加载时：

逐级升级至当前版本。

禁止跨版本跳跃升级。

# 2.6 云端存储支持

## 2.6.1 云端接口定义

```ts
GET / api / project / { id }
POST / api / project
PUT / api / project / { id }
DELETE / api / project / { id }
```

## 2.6.2 并发冲突处理

采用：

- version 字段校验
- 若云端版本 > 本地版本 → 提示冲突

冲突处理方式：

- 强制覆盖
- 保存为副本

# 2.7 权限模型

## 用户角色

| 角色   | 权限     |
| ------ | -------- |
| Admin  | 所有权限 |
| Editor | 编辑     |
| Viewer | 只读     |

## 权限控制点

- 保存
- 发布
- 删除
- 共享（分享）

# 2.8 数据校验规则（强制）

保存前必须校验：

- 是否存在重复组件 ID
- 是否存在未绑定变量
- 是否存在非法脚本
- 是否存在循环引用页面

# 2.9 性能要求

- 支持 50MB 项目文件
- 打开时间 < 3 秒
- 保存时间 < 1 秒

# 2.10 单元测试要求

必须覆盖：

- 新建流程
- 保存流程
- 升级流程
- 冲突流程
- 异常文件加载

# 第三章 设计时系统 —— 组件库与组件注册模块

本章定义组件元模型、注册机制、插件扩展规范、属性 Schema 结构、事件声明规范以及运行时映射规则。本章是整个系统的“**可扩展核心**”，必须严格实现。

# 3.1 模块职责

组件库模块负责：

- 注册系统组件
- 管理组件分类
- 提供组件元数据
- 支持插件组件扩展
- 输出组件 Schema 供属性面板动态生成 UI
- 生成运行时可识别的组件定义

# 3.2 组件元模型定义（核心）

## 3.2.1 ComponentMeta 完整定义

```ts
interface ComponentMeta {
  type: string // 唯一标识
  name: string // 显示名称
  category: string // 分类
  icon: string // 图标路径
  defaultSize: {
    width: number
    height: number
  }
  resizable: boolean
  rotatable: boolean
  supportsEvents: string[]
  propertySchema: PropertySchema[]
  runtimeRenderer: string // 对应运行时渲染类型
  version: string // 组件版本
  isCore: boolean // 是否系统核心组件
}
```

# 3.3 属性 Schema 定义规范

属性 UI 由 Schema 自动生成，禁止手写属性面板。

## 3.3.1 PropertySchema 结构

```ts
interface PropertySchema {
  key: string
  label: string
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'enum'
    | 'color'
    | 'variable'
    | 'image'
    | 'expression'
    | 'event'
  defaultValue?: any
  required?: boolean
  group?: string
  min?: number
  max?: number
  options?: { label: string; value: any }[]
  validator?: string // 校验规则表达式
}
```

# 3.4 核心组件定义（必须内置）

## 3.4.1 文本显示组件（TextDisplay）

```ts
{
  type: "TextDisplay",
  category: "display",
  defaultSize: { width: 120, height: 40 },
  supportsEvents: ["OnChange"],
  propertySchema: [
    { key: "text", type: "string" },
    { key: "variable", type: "variable" },
    { key: "fontSize", type: "number", min: 8, max: 72 },
    { key: "color", type: "color" }
  ]
}
```

## 3.4.2 开关组件（Switch）

```ts
{
  type: "Switch",
  category: "interaction",
  defaultSize: { width: 80, height: 40 },
  supportsEvents: ["OnClick", "OnChange"],
  propertySchema: [
    { key: "variable", type: "variable", required: true },
    { key: "trueValue", type: "number", defaultValue: 1 },
    { key: "falseValue", type: "number", defaultValue: 0 }
  ]
}
```

## 3.4.3 波形组件（Chart）

```ts
{
  type: "Chart",
  category: "sampling",
  defaultSize: { width: 300, height: 200 },
  supportsEvents: [],
  propertySchema: [
    { key: "variable", type: "variable", required: true },
    { key: "samplingInterval", type: "number", min: 50 },
    { key: "maxPoints", type: "number", min: 10 }
  ]
}
```

# 3.5 组件注册机制

## 3.5.1 注册接口

```ts
registerComponent(meta: ComponentMeta): void
getComponentMeta(type: string): ComponentMeta
getComponentsByCategory(category: string): ComponentMeta[]
```

## 3.5.2 注册规则

- type 必须唯一
- 不允许覆盖 isCore = true 的组件
- 插件组件必须带 version

# 3.6 插件扩展机制

## 3.6.1 插件包结构

```
plugin/
 ├─ manifest.json
 ├─ component.js
 ├─ icon.png
```

## 3.6.2 manifest.json

```json
{
  "name": "CustomGauge",
  "version": "1.0.0",
  "entry": "component.js"
}
```

## 3.6.3 插件加载流程

1. 读取 manifest
2. 执行 component.js
3. 调用 registerComponent
4. 校验 Schema 合法性

## 3.6.4 插件安全限制

- 不允许访问 window
- 不允许发起网络请求
- 不允许修改系统组件
- 必须运行在沙箱环境

# 3.7 分类系统

## 默认分类

| 分类        | 描述   |
| ----------- | ------ |
| display     | 展示类 |
| interaction | 交互类 |
| sampling    | 采样类 |
| container   | 容器类 |
| graphic     | 图形类 |

支持：

- 自定义分类
- 分类排序
- 隐藏分类

# 3.8 组件拖拽数据结构

拖拽时必须生成：

```ts
{
  type: "Switch",
  defaultProps: {},
  instanceSize: { width: 80, height: 40 }
}
```

# 3.9 组件实例创建规则

创建实例时：

1. 生成 UUID
2. 复制 defaultValue
3. 初始化 zIndex
4. 标记页面 ID

# 3.10 组件与运行时映射

必须保证：

```
Design type === Runtime renderer type
```

例如：

| 设计时 type | 运行时 renderer |
| ----------- | --------------- |
| Switch      | SwitchRenderer  |
| Chart       | ChartRenderer   |

# 3.11 属性校验机制

保存前必须校验：

- required 字段是否填写
- number 是否超出范围
- enum 是否在 options 内
- variable 是否存在

# 3.12 性能要求

- 支持 200 种组件类型
- 加载时间 < 500ms
- 插件加载不影响核心组件启动

# 3.13 单元测试要求

必须覆盖：

- 注册冲突
- 插件非法字段
- Schema 错误
- 分类过滤
- 属性默认值生成

# 第四章 设计时系统 —— 画布编辑模块（Canvas Editor）

本章定义画布的坐标系统、缩放模型、拖拽算法、对齐算法、图层系统、多选机制、撤销重做机制以及性能控制策略。该模块是设计时的核心交互引擎。

# 4.1 模块职责

Canvas Editor 负责：

- 可视化页面编辑
- 组件拖拽与定位
- 多选与批量操作
- 图层管理
- 缩放与视口控制
- 操作历史管理（Undo/Redo）
- 吸附与对齐计算

# 4.2 坐标系统设计

必须采用 **逻辑坐标 + 视图坐标分离模型**。

## 4.2.1 逻辑坐标（Logical Coordinate）

- 单位：像素
- 原点：(0,0) 左上角
- 范围：0 ≤ x ≤ resolution.width
- 范围：0 ≤ y ≤ resolution.height
- 所有组件 position 均存储为逻辑坐标

## 4.2.2 视图坐标（View Coordinate）

- 受缩放影响
- 计算公式：

```ts
viewX = logicalX * scale + offsetX
viewY = logicalY * scale + offsetY
```

# 4.3 缩放模型

## 4.3.1 缩放范围

- 最小：0.5
- 最大：3.0
- 默认：1.0
- 步进：0.1

## 4.3.2 缩放中心规则

缩放必须基于：

- 鼠标位置为中心
- 若无鼠标位置，则基于画布中心

## 4.3.3 缩放公式

```ts
offsetX = mouseX - logicalX * newScale
offsetY = mouseY - logicalY * newScale
```

# 4.4 网格系统

## 4.4.1 网格参数

- 默认间距：10px
- 可配置：5–50px
- 可开关

## 4.4.2 吸附规则

当吸附开启：

```ts
snappedX = Math.round(x / gridSize) * gridSize
snappedY = Math.round(y / gridSize) * gridSize
```

## 4.4.3 吸附优先级

1. 对齐线
2. 网格
3. 自由移动

# 4.5 拖拽系统

## 4.5.1 拖拽阶段

1. DragStart
2. DragMove
3. DragEnd

## 4.5.2 拖拽算法

- 拖拽过程中只更新视图坐标
- DragEnd 时写回逻辑坐标
- 避免频繁修改数据模型

## 4.5.3 边界限制

组件不得超出页面边界：

```ts
x >= 0
y >= 0
x + width <= pageWidth
y + height <= pageHeight
```

# 4.6 多选机制

## 4.6.1 多选方式

- Shift 点击
- 框选（拖动矩形）
- Ctrl+A 全选

## 4.6.2 框选算法

选中条件：

```ts
componentRect 与 selectionRect 相交
```

支持两种模式：

- 相交即选
- 完全包含才选（可配置）

## 4.6.3 批量移动规则

- 以选中集合的最小 bounding box 为基准
- 保持相对位置不变

# 4.7 对齐辅助系统

## 4.7.1 对齐线触发规则

当组件边缘与其他组件边缘距离 ≤ 5px 时触发。

对齐类型：

- 左对齐
- 右对齐
- 上对齐
- 下对齐
- 中心对齐

## 4.7.2 计算算法

```ts
if (abs(compA.left - compB.left) <= threshold) showVerticalGuideLine()
```

## 4.7.3 等间距分布

选中 ≥ 3 个组件时可启用：

- 水平分布
- 垂直分布

算法：

```ts
totalSpace = last.right - first.left
gap = (totalSpace - totalWidth) / (n - 1)
```

# 4.8 图层系统

## 4.8.1 zIndex 规则

- 每个组件必须有 zIndex
- 页面加载时按 zIndex 排序

## 4.8.2 操作命令

- bringToFront
- sendToBack
- moveForward
- moveBackward

## 4.8.3 图层面板（建议实现）

显示：

- 组件名称
- 锁定状态
- 显示/隐藏状态

## 4.8.4 群组管理

- 组件群组
- 解散群组

# 4.9 锁定机制

组件可设置：

- locked: true/false

锁定后：

- 不可拖动
- 不可调整大小
- 允许修改属性

# 4.10 撤销 / 重做机制（核心）

必须采用 **命令模式 + 历史栈**。

## 4.10.1 Command 接口

```ts
interface Command {
  execute(): void
  undo(): void
}
```

## 4.10.2 操作类型

- AddComponent
- DeleteComponent
- MoveComponent
- ResizeComponent
- UpdateProperty
- LayerChange

## 4.10.3 历史栈规则

- 最大历史步数：100
- 新操作后清空 redo 栈
- 支持 Ctrl+Z / Ctrl+Y

# 4.11 组件尺寸调整

## 4.11.1 调整方式

- 八方向拉伸点
- 等比例缩放（按住 Shift）
- 允许组件定义是否必须等比例缩放

## 4.11.2 最小尺寸限制

组件必须 ≥ 20x20

# 4.12 右键菜单功能

- 复制
- 粘贴
- 删除
- 锁定
- 对齐
- 图层操作

# 4.13 页面管理支持

用页签实现多页面管理

# 4.14 性能优化策略

必须实现：

1. 只重绘变更区域
2. 使用虚拟 DOM 或 Canvas 分层
3. 批量更新使用 requestAnimationFrame
4. 组件超过 300 时启用简化模式（禁用实时对齐线）

# 4.15 事件分发模型

必须统一使用：

```ts
EventBus
```

禁止组件直接相互调用。

# 4.16 边界异常处理

必须处理：

- 拖拽丢失焦点
- 组件删除后历史记录恢复
- 页面切换未保存状态提示

# 4.17 单元测试要求

必须覆盖：

- 拖拽
- 缩放
- 多选
- 对齐
- Undo/Redo
- 边界条件

# 第五章 设计时系统 —— 属性编辑与变量绑定模块

本章定义：

- 动态属性表单生成引擎
- 变量浏览器与绑定机制
- 表达式绑定系统
- 属性依赖刷新机制
- 校验引擎
- 性能与一致性控制

该模块是组件系统与数据系统之间的“连接层”，必须高度结构化实现。

# 5.1 模块职责

属性编辑模块负责：

- 根据 ComponentMeta.propertySchema 自动生成表单
- 维护组件属性状态
- 提供变量选择 UI
- 支持表达式绑定？
- 实时校验输入合法性
- 触发画布更新
- 触发项目 DIRTY 状态

# 5.2 动态表单生成引擎

## 5.2.1 输入

- ComponentMeta.propertySchema
- Component.properties

## 5.2.2 渲染流程

1. 遍历 propertySchema
2. 根据 type 映射控件类型
3. 读取 defaultValue（若属性为空）
4. 绑定双向数据

## 5.2.3 类型映射表（必须实现）

| Schema type | UI 控件          |
| ----------- | ---------------- |
| string      | Input            |
| number      | NumberInput      |
| boolean     | Switch           |
| enum        | Select           |
| color       | ColorPicker      |
| variable    | VariableSelector |
| image       | ImageSelector    |
| expression  | ExpressionEditor |
| event       | EventEditor      |

## 5.2.4 分组显示

若 propertySchema.group 存在：

- 同 group 的字段放入同一个折叠面板
- 默认展开 basic 组

# 5.3 属性数据更新流程

## 5.3.1 更新步骤

1. 用户输入
2. 触发校验
3. 更新 Component.properties
4. 标记 Project 为 DIRTY
5. 触发 Canvas 局部刷新

## 5.3.2 禁止行为

- 禁止直接修改原始对象引用
- 必须通过统一接口：

```ts
updateComponentProperty(
  componentId: string,
  key: string,
  value: any
): void
```

# 5.4 变量绑定系统

# 5.4.1 变量选择器（VariableSelector）

必须支持：

- 搜索
- 类型过滤
- 分组（可按地址段分组）
- 显示变量类型

## 5.4.2 绑定规则

- variable 类型属性只能绑定 Variable.name
- 必须校验变量是否存在
- 必须校验类型匹配

例如：

| 组件属性        | 允许变量类型 |
| --------------- | ------------ |
| Switch.variable | bool/int     |
| Chart.variable  | int/float    |

## 5.4.3 变量引用跟踪（必须实现）

系统必须维护：

```ts
variableUsageMap: Record<
  variableName,
  { pageId: string; componentId: string; property: string }[]
>
```

用于：

- 删除变量时检测是否被使用
- 发布前校验

# 5.5 表达式绑定系统（高级功能）

## 5.5.1 表达式属性类型

type: "expression"

允许：

```js
${var1} > 100 ? "red" : "green"
```

## 5.5.2 表达式解析流程

1. 解析变量占位符 `${}`
2. 转换为可执行函数
3. 构建依赖变量列表
4. 注册变量监听

## 5.5.3 表达式执行安全要求

- 禁止访问 window
- 禁止访问 global
- 禁止 new Function 直接执行用户代码
- 必须使用沙箱表达式解析器

建议：

- 采用 AST 解析
- 白名单操作符

## 5.5.4 依赖更新机制

当变量变更时：

```ts
if variable in expressionDependencies:
  reEvaluateExpression()
  updateProperty()
```

# 5.6 校验引擎

## 5.6.1 校验类型

- required 校验
- 类型校验
- 范围校验
- 自定义 validator 表达式校验
- 变量存在校验
- 表达式语法校验

## 5.6.2 validator 表达式示例

Schema:

```ts
validator: 'value >= 0 && value <= 100'
```

执行时：

```ts
validate(value: any): boolean
```

## 5.6.3 校验时机

- 输入时实时校验
- 失焦时强校验
- 保存前全量校验

# 5.7 属性依赖系统

## 5.7.1 依赖场景示例

当 displayMode = "image" 时：

- 显示 image 属性
- 隐藏 text 属性

## 5.7.2 Schema 扩展字段（新增）

```ts
visibleWhen?: string   // 表达式
```

示例：

```ts
visibleWhen: "displayMode === 'image'"
```

## 5.7.3 依赖刷新机制

属性变更时：

- 重新计算所有 visibleWhen
- 局部刷新 UI

# 5.8 事件编辑器（EventEditor）

## 5.8.1 支持事件列表

来自 ComponentMeta.supportsEvents

## 5.8.2 编辑器能力

- 代码高亮
- 自动补全（变量、组件 ID）
- 语法校验
- 错误提示

## 5.8.3 保存格式

```ts
events: {
  OnClick?: string
  OnChange?: string
}
```

# 5.9 批量属性编辑

当多选组件时：

- 仅显示共有属性
- 修改时批量更新
- 若值不同显示为 “—”

# 5.10 资源选择器

image 类型属性：

- 支持上传
- 支持预览
- 显示资源引用数量
- 删除时检测是否被引用

# 5.11 性能优化

必须实现：

- 表单虚拟渲染（组件 > 100 时）
- 防抖更新（输入 300ms）
- 局部刷新而非全量重渲染

# 5.12 异常场景处理

必须处理：

- 删除变量后属性自动清空
- 删除组件后 variableUsageMap 更新
- 表达式依赖变量不存在

# 5.13 单元测试要求

覆盖：

- 动态表单生成
- 类型映射
- 变量绑定校验
- 表达式解析
- 依赖刷新
- 批量编辑

# 第六章 设计时系统 —— 仿真模块（Simulator）

本章定义设计时仿真运行环境，必须做到**行为与运行时一致**，否则发布后将产生不可控偏差。

仿真模块本质是一个“嵌入式运行时内核”。

# 6.1 模块职责

仿真模块必须实现：

- 加载当前 Project
- 构建运行时组件树
- 建立变量调度系统
- 发起真实 HTTP 请求
- 执行事件脚本
- 输出通信日志
- 注入网络异常
- 支持停止/重启仿真

# 6.2 仿真启动流程

## 6.2.1 启动步骤

```text
1. 校验当前 Project 是否保存
2. 构建 RuntimeModel
3. 初始化 VariableScheduler
4. 初始化 HttpClient
5. 构建组件渲染实例
6. 启动变量轮询
7. 进入 RUNNING 状态
```

## 6.2.2 状态机

| 状态         | 描述   |
| ------------ | ------ |
| IDLE         | 未启动 |
| INITIALIZING | 初始化 |
| RUNNING      | 运行中 |
| PAUSED       | 暂停   |
| STOPPED      | 已停止 |
| ERROR        | 异常   |

# 6.3 仿真内核架构

## 6.3.1 核心模块结构

```text
Simulator
 ├── RuntimeModel
 ├── VariableScheduler
 ├── HttpClient
 ├── EventExecutor
 ├── LogCenter
 └── NetworkController
```

# 6.4 RuntimeModel 构建

## 6.4.1 构建规则

- 只读取当前页面
- 根据 Component.type 映射 RuntimeRenderer
- 构建组件运行时对象

## 6.4.2 RuntimeComponent 结构

```ts
interface RuntimeComponent {
  id: string
  type: string
  props: Record<string, any>
  eventHandlers: Record<string, Function>
  update(): void
  destroy(): void
}
```

# 6.5 变量调度模拟（核心）

仿真必须复刻运行时调度逻辑。

## 6.5.1 VariableScheduler 接口

```ts
interface VariableScheduler {
  subscribe(name: string, callback: (value: any) => void): void
  unsubscribe(name: string, callback: Function): void
  write(name: string, value: any): Promise<void>
  start(): void
  stop(): void
}
```

## 6.5.2 轮询策略

- 默认 500ms
- 支持变量级 pollingInterval
- 自动合并相同周期变量批量读取

## 6.5.3 批量读取格式

```json
POST /api/read
{
  "variables": ["var1", "var2"]
}
```

# 6.6 写入流程

## 6.6.1 写入步骤

```text
1. 用户触发交互
2. 调用 scheduler.write()
3. 发送 HTTP 写入请求
4. 写入成功后立即触发 read()
5. 更新本地缓存
6. 通知所有订阅者
```

## 6.6.2 写入失败处理

- 标记组件错误状态
- 显示红色边框
- 输出错误日志

# 6.7 HTTP 客户端封装

## 6.7.1 HttpClient 接口

```ts
interface HttpClient {
  get(url: string, config?: any): Promise<any>
  post(url: string, body: any): Promise<any>
}
```

## 6.7.2 必须实现

- 超时（默认 5 秒）
- 自动重试（默认 2 次）
- 统一错误封装

## 6.7.3 错误类型

| 错误             | code |
| ---------------- | ---- |
| TIMEOUT          | 1001 |
| NETWORK_ERROR    | 1002 |
| SERVER_ERROR     | 1003 |
| INVALID_RESPONSE | 1004 |

# 6.8 事件执行模块

## 6.8.1 执行规则

- 在独立沙箱执行
- 禁止访问 DOM
- 提供内置 API：

```ts
getComponent(id)
setValue(componentId, value)
readVariable(name)
writeVariable(name, value)
```

## 6.8.2 异常处理

- 捕获异常
- 输出日志
- 不中断整体仿真

# 6.9 通信日志系统

## 6.9.1 日志类型

| 类型   | 示例         |
| ------ | ------------ |
| READ   | 读取变量     |
| WRITE  | 写入变量     |
| ERROR  | 请求失败     |
| SCRIPT | 脚本执行错误 |

## 6.9.2 日志结构

```ts
interface LogEntry {
  timestamp: number
  type: string
  message: string
  payload?: any
}
```

## 6.9.3 UI 要求

- 实时滚动
- 支持过滤
- 支持导出 JSON

# 6.10 网络异常注入机制

必须支持人工模拟：

- 断网
- 高延迟
- 随机失败
- 固定失败

## 6.10.1 NetworkController

```ts
interface NetworkController {
  setOffline(flag: boolean): void
  setLatency(ms: number): void
  setFailureRate(rate: number): void
}
```

# 6.11 页面切换行为

- 切换页面时：
  - 销毁当前 RuntimeComponent
  - 取消变量订阅
  - 构建新页面

# 6.12 性能要求

- 支持 300+ 组件实时仿真
- 单次批量读取响应时间 < 200ms
- UI 不阻塞主线程

# 6.13 与设计系统隔离原则

必须保证：

- 仿真数据不写入 Project
- 不修改 Component 原始数据
- 所有运行状态存在于 RuntimeModel

# 6.14 单元测试要求

覆盖：

- 轮询合并
- 写入回读
- 网络异常注入
- 脚本异常
- 页面切换资源释放

# 第七章 设计时系统 —— 发布模块（Publisher）

本章定义：

- 构建流程
- 发布包结构
- Android 运行时整合策略
- 配置文件签名机制
- 版本升级策略
- OTA 更新设计
- 设备端部署流程

发布模块是设计时系统与运行时系统的交汇点，必须严格定义接口与产物格式。

# 7.1 模块职责

Publisher 必须实现：

- 构建运行时发布包
- 构建独立配置文件包
- 生成 manifest
- 生成资源目录
- 版本号处理
- 可选签名
- 上传至目标设备

# 7.2 发布类型定义

## 7.2.1 Full Package（完整发布）

包含：

```text
release/
 ├─ app-release.apk
 ├─ config.json
 ├─ resources/
 ├─ manifest.json
 └─ signature.sig
```

## 7.2.2 Config Only（配置更新）

包含：

```text
update/
 ├─ config.json
 ├─ resources/
 ├─ manifest.json
 └─ signature.sig
```

# 7.3 构建流程

## 7.3.1 构建流程步骤

```text
1. 保存当前项目
2. 执行全量校验
3. 生成 config.json
4. 收集资源文件
5. 生成 manifest.json
6. 执行签名（可选）
7. 生成压缩包
```

# 7.4 config.json 生成规范

## 7.4.1 必须包含字段

```json
{
  "projectId": "uuid",
  "version": "1.0.0",
  "resolution": {
    "width": 1024,
    "height": 600
  },
  "pages": [],
  "variables": [],
  "resources": []
}
```

## 7.4.2 严格要求

- 不允许包含编辑器状态字段
- 不允许包含 undo 历史
- 不允许包含临时变量

# 7.5 资源打包规则

## 7.5.1 资源收集策略

遍历：

- 所有组件 image 属性
- 所有表达式中引用资源
- 页面背景图

生成：

```text
resources/
 ├─ images/
 └─ fonts/
```

## 7.5.2 资源去重

依据：

```ts
hash(fileContent)
```

相同 hash 仅保留一份。

# 7.6 manifest.json 规范

## 7.6.1 结构定义

```json
{
  "projectId": "uuid",
  "projectName": "HMI Demo",
  "version": "1.2.0",
  "buildTime": 1700000000,
  "editorVersion": "2.1.0",
  "runtimeMinVersion": "1.0.0",
  "resourceHash": "sha256",
  "configHash": "sha256"
}
```

## 7.6.2 校验用途

运行时加载时必须：

- 校验 runtimeMinVersion
- 校验 configHash
- 校验 resourceHash

# 7.7 签名机制（必须实现）

## 7.7.1 签名内容

签名内容包括：

- config.json
- manifest.json
- 所有资源文件 hash

## 7.7.2 签名算法

建议：

- RSA + SHA256

生成：

```text
signature.sig
```

## 7.7.3 运行时校验流程

```text
1. 读取 signature.sig
2. 使用内置公钥校验
3. 校验失败 → 拒绝加载
```

# 7.8 APK 组合策略

## 7.8.1 两种模式

### 模式A：固定运行时 APK

- 运行时 APK 不变
- 发布仅包含 config 包
- 推荐用于工业现场

### 模式B：重新打包 APK

- 将 config.json 嵌入 assets
- 使用自动构建流水线生成新 APK

推荐优先采用 模式A。

# 7.9 OTA 更新设计

## 7.9.1 更新方式

- HTTP 下载
- 局域网推送
- U盘导入

## 7.9.2 更新流程

```text
1. 下载 update.zip
2. 校验签名
3. 解压到 staging 目录
4. 校验完整性
5. 替换当前配置
6. 重启运行时
```

## 7.9.3 回滚机制（必须实现）

- 保留上一版本 config 目录
- 若启动失败 → 自动回滚

# 7.10 设备上传功能

## 7.10.1 上传接口

```ts
uploadToDevice(
  ip: string,
  port: number,
  file: File
): Promise<Result>
```

## 7.10.2 支持协议

- HTTP PUT
- FTP（可选）
- SFTP（推荐）

# 7.11 发布前校验清单

必须通过以下校验才允许发布：

- 所有变量已绑定合法
- 无表达式语法错误
- 无未引用资源
- 页面至少存在一个
- 分辨率合法
- 无循环依赖

# 7.12 性能要求

- 构建时间 < 3 秒（中等项目）
- 资源去重算法 O(n)
- 打包后文件大小可预测

# 7.13 错误处理

必须明确：

| 错误     | 行为     |
| -------- | -------- |
| 签名失败 | 阻止发布 |
| 资源丢失 | 阻止发布 |
| 上传失败 | 显示重试 |

# 7.14 单元测试要求

覆盖：

- manifest 生成
- hash 计算
- 签名验证
- 资源去重
- 回滚流程模拟

# 第八章 运行时系统 —— 配置加载与初始化模块

本章定义运行时启动核心流程，是 Android 端的第一执行模块。
必须保证：**安全、稳定、可回滚、可诊断**。

# 8.1 模块职责

配置加载与初始化模块负责：

- 加载本地 config 包
- 校验签名
- 校验版本
- 校验完整性
- 构建内存模型
- 初始化资源系统
- 初始化变量调度系统
- 启动主界面

# 8.2 运行时目录结构

## 8.2.1 应用内部目录结构

```text
/data/data/<package>/
 ├─ config/
 │   ├─ current/
 │   │   ├─ config.json
 │   │   ├─ manifest.json
 │   │   ├─ resources/
 │   │   └─ signature.sig
 │   ├─ backup/
 │   └─ staging/
 └─ logs/
```

# 8.3 启动状态机

## 8.3.1 状态定义

| 状态           | 描述       |
| -------------- | ---------- |
| INIT           | 应用启动   |
| VERIFY         | 校验配置   |
| LOAD_CONFIG    | 解析 JSON  |
| LOAD_RESOURCES | 加载资源   |
| BUILD_MODEL    | 构建组件树 |
| READY          | 初始化完成 |
| ERROR          | 启动失败   |

## 8.3.2 启动流程

```text
INIT
 → VERIFY
 → LOAD_CONFIG
 → LOAD_RESOURCES
 → BUILD_MODEL
 → READY
```

若任意阶段失败：

→ ERROR → 尝试回滚

# 8.4 签名校验流程

## 8.4.1 校验步骤

```text
1. 读取 signature.sig
2. 读取 manifest.json
3. 校验 configHash
4. 校验 resourceHash
5. 使用内置公钥验证签名
```

## 8.4.2 校验失败处理

- 记录日志
- 尝试加载 backup 目录
- 若 backup 也失败 → 显示错误页面

# 8.5 JSON 解析与版本升级

## 8.5.1 JSON 解析规则

- 使用严格 JSON 解析
- 禁止容错模式
- 必须校验字段完整性

## 8.5.2 版本检查

```ts
if (config.version < runtimeMinVersion) reject
```

## 8.5.3 版本升级支持

若 config 版本低于当前 runtime 支持版本：

- 执行内置 upgradeMap
- 生成升级后的内存结构
- 不写回磁盘

# 8.6 内存模型构建

## 8.6.1 RuntimeProject 结构

```ts
interface RuntimeProject {
  id: string
  version: string
  resolution: { width: number; height: number }
  pages: RuntimePage[]
  variables: RuntimeVariable[]
}
```

## 8.6.2 RuntimePage

```ts
interface RuntimePage {
  id: string
  components: RuntimeComponent[]
}
```

# 8.7 资源加载机制

## 8.7.1 图片加载策略

- 延迟加载（Lazy Load）
- 首屏优先加载
- LRU 缓存（建议 50MB 上限）

## 8.7.2 字体加载

- 启动阶段加载
- 缓存全局引用

# 8.8 组件树构建

## 8.8.1 构建流程

```text
for each page:
   for each component:
      create RuntimeComponent
      inject props
      register variable subscriptions
```

## 8.8.2 构建顺序

必须按 zIndex 排序构建。

# 8.9 初始化变量系统

## 8.9.1 初始化步骤

- 建立变量缓存
- 建立订阅表
- 启动轮询线程

## 8.9.2 默认缓存值

若 variable.defaultValue 存在：

- 初始化缓存
- 页面初始显示使用默认值

# 8.10 页面初始化策略

## 8.10.1 默认页面

- 第一个页面为启动页
- 或 manifest 指定启动页

## 8.10.2 页面切换时

- 释放旧页面组件
- 取消变量订阅
- 加载新页面组件

# 8.11 错误页面机制

若启动失败：

显示内置错误页面：

- 错误码
- 错误描述
- 当前 config 版本
- 回滚状态

# 8.12 回滚机制

## 8.12.1 触发条件

- 启动异常
- 签名失败
- JSON 解析失败

## 8.12.2 回滚流程

```text
1. 删除 current
2. 复制 backup → current
3. 重启应用
```

# 8.13 日志记录

必须记录：

- 启动时间
- config 版本
- 校验结果
- 升级行为
- 回滚行为

日志写入：

```text
logs/startup.log
```

# 8.14 性能要求

- 启动时间 < 2 秒（中等项目）
- 内存峰值 < 200MB
- 不阻塞主线程（解析与校验在 IO 线程）

# 8.15 线程模型

## 必须使用

- 主线程：UI 渲染
- IO 线程：文件读取
- Worker 线程：JSON 解析与校验
- 调度线程：变量轮询

禁止在主线程执行：

- 文件 IO
- 签名校验
- 大量 JSON 解析

# 8.16 安全要求

- 配置文件不可被外部修改（内部存储）
- 不允许加载外部路径 config
- 必须校验签名

# 8.17 单元测试要求

覆盖：

- 正常启动流程
- 签名失败
- JSON 错误
- 版本不兼容
- 回滚成功

# 第九章 运行时系统 —— 渲染引擎与组件运行框架

本章定义 Android 运行时的 UI 渲染架构、组件生命周期模型、变量驱动刷新机制、表达式计算系统以及性能优化策略。

该模块直接决定系统稳定性与帧率表现，必须严格实现。

# 9.1 渲染架构选型

## 9.1.1 架构原则

必须满足：

- 支持 ≥ 500 组件
- 支持频繁变量刷新（≥100ms）
- 局部刷新能力
- 低 GC 压力
- 可控内存占用

## 9.1.2 实现方式

- Android View + 自定义渲染容器
- 每个组件为轻量级自定义 View
- 页面为单层容器（FrameLayout 或自定义容器）

# 9.2 运行时组件框架

# 9.2.1 RuntimeComponent 基类

```kotlin
abstract class RuntimeComponent(
    val id: String,
    val props: MutableMap<String, Any>
) {
    abstract fun attach(container: ViewGroup)
    abstract fun detach()
    abstract fun updateProperty(key: String, value: Any)
    abstract fun onVariableChanged(name: String, value: Any)
}
```

# 9.2.2 生命周期定义

| 阶段     | 方法                |
| -------- | ------------------- |
| 创建     | constructor         |
| 挂载     | attach()            |
| 运行     | onVariableChanged() |
| 更新属性 | updateProperty()    |
| 销毁     | detach()            |

## 生命周期顺序

```text
create → attach → subscribe variables → running
detach → unsubscribe → destroy
```

# 9.3 组件注册系统

运行时必须维护：

```kotlin
object RendererRegistry {
    fun register(type: String, factory: () -> RuntimeComponent)
    fun create(type: String): RuntimeComponent
}
```

必须保证：

设计时 type == 运行时注册 type

# 9.4 变量驱动刷新机制

## 9.4.1 订阅流程

```text
1. 组件 attach
2. 解析 props 中 variable 字段
3. 调用 VariableScheduler.subscribe()
4. 注册 onVariableChanged
```

## 9.4.2 刷新规则

当变量变更：

```kotlin
override fun onVariableChanged(name: String, value: Any) {
    updateUI(value)
}
```

禁止全页面重绘。

# 9.5 表达式驱动系统

## 9.5.1 表达式初始化

启动时：

- 解析 expression 字段
- 构建 AST
- 收集依赖变量
- 注册变量订阅

## 9.5.2 执行流程

```text
variable changed →
  evaluate expression →
  compare old result →
  if changed → updateProperty
```

必须避免：

- 无差异重复刷新
- 主线程大量表达式执行

## 9.5.3 表达式线程模型

- 表达式执行在 Worker 线程
- 结果切回主线程更新 UI

# 9.6 刷新调度模型

## 9.6.1 UI 更新节流

必须实现：

- 单帧最多刷新一次
- 使用 Choreographer 或 postOnAnimation

## 9.6.2 批量变量更新

若多个变量在同一轮询周期更新：

- 批量合并
- 同帧更新

# 9.7 组件交互事件处理

## 9.7.1 交互流程

```text
用户点击 →
  RuntimeComponent →
  调用 writeVariable →
  调用 HttpClient →
  写入成功 →
  触发变量更新 →
  更新 UI
```

## 9.7.2 防抖机制

对于按钮类组件：

- 300ms 内禁止重复触发

# 9.8 页面切换机制

## 9.8.1 切换流程

```text
1. detach 当前页面所有组件
2. 清空 ViewGroup
3. 构建新页面组件
4. attach()
```

## 9.8.2 资源释放

必须：

- 取消变量订阅
- 清理图片引用
- 清理表达式监听

避免内存泄漏。

# 9.9 图层渲染规则

必须按 zIndex 排序添加 View：

```kotlin
components.sortedBy { it.zIndex }
```

# 9.10 大规模组件优化策略

## 9.10.1 当组件数量 > 300

自动启用：

- 关闭动画
- 关闭阴影效果
- 禁用透明度混合

## 9.10.2 图片优化

- 使用 BitmapFactory.Options.inSampleSize
- 避免超大图片

# 9.11 帧率目标

- 目标 60 FPS
- 最低不低于 45 FPS

# 9.12 内存控制

## 9.12.1 图片缓存

- LRUCache
- 50MB 上限
- 自动回收

## 9.12.2 对象复用

- 避免频繁 new 对象
- 使用对象池（可选）

# 9.13 异常隔离机制

单个组件异常：

- 捕获异常
- 打印日志
- 不影响其他组件运行

# 9.14 日志输出

组件异常必须记录：

```text
ComponentID
PropertyKey
ErrorMessage
StackTrace
```

# 9.15 性能监控（建议实现）

运行时必须支持：

- 当前 FPS
- 当前变量数量
- 当前组件数量
- 当前内存占用

可隐藏调试面板显示。

# 9.16 单元测试要求

覆盖：

- 组件 attach/detach
- 变量更新刷新
- 表达式计算
- 页面切换
- 大量组件性能测试

# 第十章 运行时系统 —— 变量调度与通信模块

本章是**性能核心章节**。
决定：

- 刷新延迟
- 网络负载
- CPU 占用
- 稳定性

必须严格实现。

# 10.1 模块职责

变量调度与通信模块负责：

- 变量订阅管理
- 批量轮询调度
- 写入一致性控制
- HTTP 通信封装
- 重试与超时机制
- 缓存一致性
- 负载控制

# 10.2 总体架构

```text
VariableScheduler
 ├── SubscriptionManager
 ├── PollingEngine
 ├── WriteQueue
 ├── CacheStore
 └── HttpClient
```

# 10.3 变量缓存模型

## 10.3.1 CacheStore 结构

```kotlin
data class VariableState(
    val name: String,
    var value: Any?,
    var lastUpdate: Long,
    var subscribers: MutableSet<(Any?) -> Unit>
)
```

必须使用：

```kotlin
ConcurrentHashMap<String, VariableState>
```

# 10.4 订阅管理

## 10.4.1 订阅接口

```kotlin
fun subscribe(name: String, callback: (Any?) -> Unit)
fun unsubscribe(name: String, callback: (Any?) -> Unit)
```

## 10.4.2 订阅规则

- 重复订阅不重复添加
- 组件 detach 时必须取消订阅
- 若无订阅者，变量不参与轮询

# 10.5 轮询调度引擎

# 10.5.1 轮询基本策略

- 默认周期：500ms
- 支持 variable.pollingInterval 覆盖
- 相同周期变量分组

## 10.5.2 分组结构

```kotlin
Map<Long, MutableSet<String>> // key = pollingInterval
```

## 10.5.3 调度线程模型

- 单独 PollingThread
- 使用 ScheduledExecutorService
- 每组独立任务

# 10.6 批量读取算法（核心）

## 10.6.1 批量读取流程

```text
1. 收集本周期变量列表
2. 过滤无订阅变量
3. 构建批量请求
4. 发起 HTTP POST /read
5. 解析响应
6. 更新 CacheStore
7. 通知订阅者
```

## 10.6.2 批量请求格式

```json
POST /api/read
{
  "variables": ["v1","v2","v3"]
}
```

## 10.6.3 响应格式

```json
{
  "v1": 123,
  "v2": 0,
  "v3": 45.6
}
```

## 10.6.4 差异更新机制（必须实现）

```kotlin
if (oldValue != newValue) {
    notifySubscribers()
}
```

避免无效刷新。

# 10.7 写入队列模型

## 10.7.1 WriteQueue 结构

```kotlin
data class WriteTask(
    val variable: String,
    val value: Any,
    val timestamp: Long
)
```

使用：

```kotlin
LinkedBlockingQueue<WriteTask>
```

## 10.7.2 写入流程

```text
1. 写入请求入队
2. Worker 线程处理
3. 发起 POST /write
4. 成功 → 强制 read
5. 更新缓存
```

## 10.7.3 写入一致性策略（必须）

### 策略：写后读（Write-Through）

写入成功后必须立即读取确认。

## 10.7.4 写入合并优化（可选）

若 50ms 内对同变量多次写入：

- 只保留最后一次

# 10.8 HTTP 客户端设计

## 10.8.1 要求

- 连接池支持
- Keep-Alive
- 超时控制
- 自动重试

## 10.8.2 推荐实现（Android）

- 使用 OkHttp
- 连接池 5~10
- 读写超时 5 秒
- 重试 2 次

## 10.8.3 重试规则

仅重试：

- 网络异常
- 超时

不重试：

- 400/500 逻辑错误

# 10.9 超时与失败策略

## 10.9.1 轮询失败

连续失败 3 次：

- 标记通信异常
- 通知 UI 显示“离线”

## 10.9.2 恢复机制

成功一次即恢复在线状态。

# 10.10 高并发变量优化

## 10.10.1 若变量数量 > 200

自动启用：

- 分批读取（每批 100）
- 错峰轮询

## 10.10.2 错峰算法

```kotlin
groupIndex = variable.hashCode() % batchCount
```

不同批次分布在不同时间片。

# 10.11 线程安全要求

必须：

- CacheStore 使用并发容器
- UI 回调切回主线程
- 禁止在主线程执行 HTTP

# 10.12 内存控制

## 10.12.1 禁止缓存历史值

只保存当前值。

## 10.12.2 避免闭包泄漏

订阅回调必须弱引用组件。

# 10.13 性能指标目标

- 200 变量，500ms 周期，CPU < 15%
- 单次批量请求 < 200ms
- 写入延迟 < 300ms

# 10.14 异常隔离

单变量异常：

- 不影响其他变量更新
- 记录错误

# 10.15 监控指标

运行时必须记录：

- 当前变量数量
- 当前轮询周期
- 最近响应时间
- 失败次数

可供调试面板显示。

# 10.16 单元测试要求

覆盖：

- 批量读取
- 差异更新
- 写后读一致性
- 高并发测试（200+变量）
- 断网恢复

# 第十一章 运行时系统 —— 日志、监控与异常处理模块

本章定义运行时的可观测性与稳定性保障体系。
目标：**可诊断、可恢复、可追溯、可监控**。

# 11.1 模块职责

日志与监控模块必须实现：

- 分级日志系统
- 启动日志
- 通信日志
- 组件异常日志
- 崩溃捕获与恢复
- 性能监控指标
- 本地日志存储
- 日志导出能力
- 调试模式开关

# 11.2 日志分级模型

## 11.2.1 日志等级

| 等级    | 用途       |
| ------- | ---------- |
| VERBOSE | 调试细节   |
| DEBUG   | 开发调试   |
| INFO    | 正常运行   |
| WARN    | 非致命异常 |
| ERROR   | 严重错误   |
| FATAL   | 崩溃级错误 |

## 11.2.2 日志接口

```kotlin
interface Logger {
    fun v(tag: String, msg: String)
    fun d(tag: String, msg: String)
    fun i(tag: String, msg: String)
    fun w(tag: String, msg: String)
    fun e(tag: String, msg: String, throwable: Throwable? = null)
}
```

# 11.3 日志存储策略

## 11.3.1 存储位置

```text
/data/data/<package>/logs/
```

## 11.3.2 文件滚动策略

- 单文件最大 5MB
- 保留最近 5 个文件
- 超出自动删除最旧

## 11.3.3 日志格式

```text
[2026-03-04 10:23:45.123][INFO][VariableScheduler] Polling success: 200 vars in 120ms
```

# 11.4 启动日志

必须记录：

- 启动时间
- 设备型号
- Android 版本
- config 版本
- 签名校验结果
- 回滚状态

# 11.5 通信日志

## 11.5.1 记录内容

- 请求 URL
- 请求变量数量
- 响应时间
- 状态码
- 错误原因

## 11.5.2 性能统计

必须维护：

```kotlin
data class NetworkStats(
    var totalRequests: Long,
    var avgResponseTime: Long,
    var failureCount: Long
)
```

# 11.6 组件异常隔离

## 11.6.1 组件执行保护

所有 RuntimeComponent 方法必须：

```kotlin
try {
    // logic
} catch (e: Exception) {
    Logger.e("Component-$id", "Runtime error", e)
}
```

## 11.6.2 单组件异常不影响全局

禁止：

- 组件异常导致页面崩溃
- 表达式异常导致轮询停止

# 11.7 崩溃捕获机制

## 11.7.1 全局异常捕获

注册：

```kotlin
Thread.setDefaultUncaughtExceptionHandler
```

## 11.7.2 崩溃处理流程

```text
1. 记录 crash.log
2. 保存最近变量状态
3. 标记异常启动
4. 重启应用
```

# 11.8 崩溃恢复策略

## 11.8.1 启动检测

若检测到上次异常退出：

- 显示提示
- 提供恢复模式选项

## 11.8.2 安全模式（建议实现）

安全模式：

- 禁用表达式执行
- 禁用自定义脚本
- 降低轮询频率

# 11.9 性能监控模块

## 11.9.1 实时指标

必须采集：

- 当前 FPS
- 当前变量数量
- 当前组件数量
- 内存占用
- CPU 占用
- 网络延迟

## 11.9.2 采集方式

- FPS：Choreographer
- 内存：Runtime.getRuntime()
- CPU：/proc/stat（可选）

# 11.10 调试面板（可隐藏）

## 11.10.1 触发方式

- 连续点击 5 次屏幕角落
- 或特殊手势

## 11.10.2 显示内容

- 当前页面 ID
- 变量数量
- 轮询周期
- 网络状态
- 最近 10 条错误日志

# 11.11 远程诊断（可选扩展）

## 11.11.1 提供接口

```text
GET /diagnostics
```

返回：

```json
{
  "fps": 58,
  "variables": 200,
  "memoryMB": 120,
  "networkLatency": 150
}
```

# 11.12 日志导出功能

## 11.12.1 导出方式

- USB 导出
- HTTP 下载
- 本地复制

## 11.12.2 导出内容

- logs/
- config version
- manifest
- diagnostics.json

# 11.13 日志级别控制

必须支持：

- 生产模式 → INFO 以上
- 调试模式 → DEBUG 以上
- 动态切换日志级别

# 11.14 内存泄漏监控（建议实现）

- 页面切换后检测引用
- 使用 LeakCanary（开发模式）

# 11.15 安全要求

- 日志不得包含敏感信息（Token）
- 禁止记录 PLC 认证密码
- 导出日志需授权

# 11.16 性能要求

- 日志写入非阻塞
- 异步写文件
- 崩溃记录 ≤ 200ms 完成

# 11.17 单元测试要求

覆盖：

- 日志滚动
- 崩溃捕获
- 安全模式启动
- 性能监控数据更新
- 日志导出

# 第十二章 系统安全模型与权限控制（设计时 + 运行时）

本章定义：

- 设计时权限模型
- 云端接口安全
- 运行时安全机制
- 通信安全
- 本地数据保护
- 防篡改策略
- 工业环境安全建议

目标：满足工业场景安全要求，避免未授权控制 PLC。

# 12.1 安全总体原则

必须遵循：

1. 最小权限原则（Least Privilege）
2. 默认拒绝（Default Deny）
3. 明确边界（Zero Trust）
4. 所有通信可验证
5. 所有发布包可验证

# 12.2 设计时系统安全模型

# 12.2.1 用户角色模型

## 角色定义

| 角色       | 权限           |
| ---------- | -------------- |
| SuperAdmin | 全部权限       |
| Admin      | 项目管理、发布 |
| Editor     | 编辑项目       |
| Viewer     | 只读           |
| Auditor    | 查看日志       |

# 12.2.2 权限粒度

必须控制：

- 创建项目
- 删除项目
- 发布
- 修改变量
- 修改脚本
- 上传插件
- 查看通信日志

## 权限结构

```ts
interface Permission {
  resource: string
  action: 'read' | 'write' | 'delete' | 'publish'
}
```

# 12.2.3 RBAC 实现要求

- 使用基于角色的访问控制（RBAC）
- 所有接口必须校验 Token
- 不允许仅前端控制权限

# 12.3 认证机制

# 12.3.1 设计时认证

推荐：

- JWT Token
- 访问令牌有效期 ≤ 2 小时
- Refresh Token 机制

# 12.3.2 Token 存储

- HttpOnly Cookie（推荐）
- 不允许存储在 localStorage

# 12.3.3 Token 校验

所有接口必须校验：

```http
Authorization: Bearer <token>
```

# 12.4 云端接口安全

## 12.4.1 必须启用 HTTPS

- TLS 1.2+
- 禁止 HTTP 明文

## 12.4.2 接口限流

必须实现：

- 每用户 QPS 限制
- IP 限流
- 防暴力破解

# 12.5 插件安全机制

## 12.5.1 插件上传限制

- 仅 Admin 可上传
- 必须扫描 manifest
- 禁止外部网络调用

## 12.5.2 沙箱机制

插件执行必须：

- 禁止访问全局对象
- 禁止访问文件系统
- 禁止执行 eval

# 12.6 发布包安全

# 12.6.1 配置签名机制（强制）

发布包必须：

- 使用 RSA 私钥签名
- 运行时内置公钥验证

# 12.6.2 防篡改策略

运行时启动必须校验：

- configHash
- resourceHash
- signature.sig

任何修改必须拒绝加载。

# 12.7 运行时通信安全

# 12.7.1 PLC 通信安全

推荐支持：

- HTTPS
- Token 鉴权
- 或局域网内白名单 IP

# 12.7.2 Token 管理

运行时必须：

- 安全存储 Token
- 不写入日志
- 支持过期刷新

# 12.8 本地数据保护

# 12.8.1 配置存储位置

必须使用：

- Android 内部存储
- 不允许使用外部 SD 卡

# 12.8.2 本地加密（可选增强）

若涉及敏感参数：

- 使用 AES-256 加密 config.json
- 密钥存储于 Android Keystore

# 12.9 防止非法控制 PLC

# 12.9.1 操作白名单

必须支持：

- 限制可写变量
- 限制变量写入范围

例如：

```json
{
  "var1": { "min": 0, "max": 100 }
}
```

# 12.9.2 写入频率限制

同变量：

- 最小写入间隔 ≥ 100ms

# 12.10 日志安全

必须：

- 不记录密码
- 不记录完整 Token
- 不记录私钥

# 12.11 崩溃数据安全

crash.log 中必须：

- 屏蔽敏感字段
- 限制最大文件大小

# 12.12 设备物理安全建议（工业场景）

建议：

- 禁止 USB 调试
- 锁定系统设置
- 使用专用工业终端
- 禁止安装第三方应用

# 12.13 证书更新机制

## 12.13.1 公钥更新策略

支持：

- OTA 更新公钥
- 多公钥验证

避免单点失效。

# 12.14 安全事件日志

必须记录：

- 登录失败
- 权限拒绝
- 签名校验失败
- 多次写入异常

# 12.15 安全审计接口（可选）

提供：

```http
GET /security/audit
```

返回：

- 最近 100 条安全事件

# 12.16 安全测试要求

必须覆盖：

- Token 过期
- 权限绕过尝试
- 篡改 config
- 非法写入变量
- 插件越权执行

# 12.17 合规性建议

若进入工业领域，建议对标：

- IEC 62443（工业网络安全）
- ISO 27001（信息安全管理）
- Android 企业设备管理规范
