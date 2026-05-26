# PLC 设备通信接口说明文档

## 文档概述

本文档定义了 HMI 系统与云端服务器之间的 RESTful API 接口规范，涵盖设备管理、变量配置、程序代码、状态监控和设备控制等核心功能。

**API 版本**: v1  
**基础路径**: `/api/v1`  
**协议**: HTTPS (生产环境) / HTTP (开发环境)  
**数据格式**: JSON  
**字符编码**: UTF-8

---

## 目录

1. [认证与授权](#1-认证与授权)
2. [通用规范](#2-通用规范)
3. [设备管理接口](#3-设备管理接口)
4. [变量管理接口](#4-变量管理接口)
5. [程序代码接口](#5-程序代码接口)
6. [设备状态监控接口](#6-设备状态监控接口)
7. [设备控制接口](#7-设备控制接口)
8. [项目管理接口](#8-项目管理接口)
9. [错误码说明](#9-错误码说明)

---

## 1. 认证与授权

### 1.1 认证机制

系统采用 **JWT (JSON Web Token)** 进行身份验证和授权控制。

#### 请求头格式

```http
Authorization: Bearer <token>
Content-Type: application/json
```

#### Token 获取流程

1. 用户通过登录接口获取 Access Token 和 Refresh Token
2. Access Token 有效期：2 小时
3. Refresh Token 有效期：7 天
4. Token 过期后使用 Refresh Token 刷新

### 1.2 权限等级

| 权限等级 | 说明   | 可访问接口                       |
| -------- | ------ | -------------------------------- |
| GUEST    | 访客   | 只读接口（设备列表、变量查询）   |
| OPERATOR | 操作员 | 读取状态、基本控制               |
| ENGINEER | 工程师 | 所有读取接口、程序下载、参数配置 |
| ADMIN    | 管理员 | 全部接口，包括用户管理、系统配置 |

---

## 2. 通用规范

### 2.1 统一响应格式

所有接口返回遵循统一结构：

```typescript
interface ApiResponse<T> {
  code: number // 业务状态码
  data: T // 响应数据
  message: string // 响应消息
  timestamp: number // 服务器时间戳（毫秒）
}
```

**成功响应示例**:

```json
{
  "code": 200,
  "data": {
    "id": "plc-001",
    "name": "西门子 S7-200 SMART"
  },
  "message": "success",
  "timestamp": 1712649600000
}
```

**失败响应示例**:

```json
{
  "code": 40401,
  "data": null,
  "message": "设备不存在",
  "timestamp": 1712649600000
}
```

### 2.2 分页规范

列表接口支持分页查询：

**请求参数**:

- `page`: 页码（从 1 开始，默认 1）
- `pageSize`: 每页数量（默认 20，最大 100）
- `sortBy`: 排序字段（可选）
- `order`: 排序方向（asc/desc，默认 asc）

**响应格式**:

```json
{
  "code": 200,
  "data": {
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "items": [...]
  },
  "message": "success",
  "timestamp": 1712649600000
}
```

### 2.3 过滤与搜索

支持通用查询参数：

- `search`: 关键词搜索（模糊匹配 name、model 等字段）
- `manufacturer`: 制造商过滤
- `type`: 设备类型过滤
- `status`: 状态过滤

### 2.4 日期时间格式

所有时间字段使用 ISO 8601 格式：

```
YYYY-MM-DDTHH:mm:ss.sssZ
示例: 2024-04-09T08:30:00.000Z
```

时间戳使用 Unix 毫秒时间戳。

---

## 3. 设备管理接口

### 3.1 获取支持的制造商列表

**接口**: `GET /devices/manufacturers`  
**权限**: GUEST+  
**描述**: 获取所有支持的 PLC/HMI 设备制造商列表

**请求参数**:

```typescript
interface ManufacturerQueryParams {
  type?: 'plc' | 'hmi' // 可选：按设备类型过滤
}
```

**响应数据**:

```typescript
interface Manufacturer {
  id: string // 制造商标识（如 "siemens", "mitsubishi"）
  name: string // 制造商名称（如 "西门子", "三菱"）
  nameEn: string // 英文名称（如 "Siemens", "Mitsubishi"）
  logo?: string // Logo URL（可选）
  country?: string // 国家/地区（可选）
  deviceCount: {
    // 各类型设备数量统计
    plc: number
    hmi: number
  }
  supportedProtocols?: string[] // 支持的通信协议列表
}
```

**示例请求**:

```http
GET /api/v1/devices/manufacturers?type=plc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**示例响应**:

```json
{
  "code": 200,
  "data": [
    {
      "id": "siemens",
      "name": "西门子",
      "nameEn": "Siemens",
      "logo": "https://cdn.example.com/logos/siemens.png",
      "country": "Germany",
      "deviceCount": {
        "plc": 3,
        "hmi": 2
      },
      "supportedProtocols": ["S7", "PROFINET", "PROFIBUS"]
    },
    {
      "id": "mitsubishi",
      "name": "三菱电机",
      "nameEn": "Mitsubishi Electric",
      "logo": "https://cdn.example.com/logos/mitsubishi.png",
      "country": "Japan",
      "deviceCount": {
        "plc": 2,
        "hmi": 1
      },
      "supportedProtocols": ["MC Protocol", "CC-Link"]
    },
    {
      "id": "omron",
      "name": "欧姆龙",
      "nameEn": "Omron",
      "logo": "https://cdn.example.com/logos/omron.png",
      "country": "Japan",
      "deviceCount": {
        "plc": 2,
        "hmi": 0
      },
      "supportedProtocols": ["FINS", "EtherNet/IP"]
    }
  ],
  "message": "success",
  "timestamp": 1712649600000
}
```

---

### 3.2 获取指定制造商的系列列表

**接口**: `GET /devices/manufacturers/{manufacturerId}/series`  
**权限**: GUEST+  
**描述**: 获取指定制造商下的所有设备系列

**路径参数**:

- `manufacturerId`: 制造商标识（如 "siemens"）

**请求参数**:

```typescript
interface SeriesQueryParams {
  type?: 'plc' | 'hmi' // 可选：按设备类型过滤
}
```

**响应数据**:

```typescript
interface DeviceSeries {
  id: string // 系列标识（如 "s7-200", "fx"）
  name: string // 系列名称（如 "S7-200 SMART", "FX 系列"）
  manufacturerId: string // 所属制造商 ID
  type: 'plc' | 'hmi' // 设备类型
  description?: string // 系列描述
  modelCount: number // 该系列下的型号数量
  minIoPoints?: number // 最小 I/O 点数
  maxIoPoints?: number // 最大 I/O 点数
  communicationProtocols?: string[] // 支持的通信协议
  features?: string[] // 系列特性标签
}
```

**示例请求**:

```http
GET /api/v1/devices/manufacturers/siemens/series?type=plc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**示例响应**:

```json
{
  "code": 200,
  "data": [
    {
      "id": "s7-200",
      "name": "S7-200 SMART",
      "manufacturerId": "siemens",
      "type": "plc",
      "description": "小型集成式 PLC，适合简单自动化任务",
      "modelCount": 1,
      "minIoPoints": 64,
      "maxIoPoints": 128,
      "communicationProtocols": ["PPI", "MPI", "PROFIBUS"],
      "features": ["高速计数", "脉冲输出", "PID 控制"]
    },
    {
      "id": "s7-1200",
      "name": "S7-1200",
      "manufacturerId": "siemens",
      "type": "plc",
      "description": "紧凑型模块化 PLC，适合中小型自动化系统",
      "modelCount": 1,
      "minIoPoints": 128,
      "maxIoPoints": 256,
      "communicationProtocols": ["PROFINET", "Ethernet/IP", "Modbus TCP"],
      "features": ["运动控制", "闭环控制", "通信"]
    },
    {
      "id": "s7-1500",
      "name": "S7-1500",
      "manufacturerId": "siemens",
      "type": "plc",
      "description": "高端模块化 PLC，适合大型复杂自动化系统",
      "modelCount": 1,
      "minIoPoints": 256,
      "maxIoPoints": 512,
      "communicationProtocols": ["PROFINET", "PROFIBUS", "OPC UA"],
      "features": ["高级运动控制", "安全集成", "能源管理"]
    }
  ],
  "message": "success",
  "timestamp": 1712649600000
}
```

---

### 3.3 获取指定系列的设备型号列表

**接口**: `GET /devices/series/{seriesId}/models`  
**权限**: GUEST+  
**描述**: 获取指定系列下的所有设备型号

**路径参数**:

- `seriesId`: 系列标识（如 "s7-200"）

**请求参数**:

```typescript
interface ModelQueryParams {
  page?: number
  pageSize?: number
}
```

**响应数据**:

```typescript
/**
 * 设备基础信息接口
 */
interface DeviceInfo {
  id: string
  name: string
  model: string
  manufacturer: string
  description?: string
  category?: string
}

/**
 * PLC 设备
 */
interface PLCDevice extends DeviceInfo {
  type: 'plc'
  series: string
  communicationProtocols?: string[]
  ioPoints?: number
  supportFeatures?: string[]
}

/**
 * HMI 设备
 */
interface HMIDevice extends DeviceInfo {
  type: 'hmi'
  resolution: {
    width: number
    height: number
  }
  touchSupport?: boolean
  screenType?: 'LCD' | 'OLED' | 'TFT'
  connectivity?: string[]
}
```

**示例请求**:

```http
GET /api/v1/devices/series/s7-200/models
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**示例响应**:

```json
{
  "code": 200,
  "data": {
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "items": [
      {
        "id": "plc-001",
        "type": "plc",
        "name": "西门子 S7-200 SMART",
        "model": "Siemens S7-200 SMART",
        "manufacturer": "Siemens",
        "series": "S7-200",
        "seriesId": "s7-200",
        "description": "小型集成式 PLC，适合简单自动化任务",
        "communicationProtocols": ["PPI", "MPI", "PROFIBUS"],
        "ioPoints": 128,
        "supportFeatures": ["高速计数", "脉冲输出", "PID 控制"],
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-03-20T14:30:00.000Z"
      }
    ]
  },
  "message": "success",
  "timestamp": 1712649600000
}
```

### 3.4 获取设备详情

**接口**: `GET /devices/{type}/{id}`  
**权限**: GUEST+  
**描述**: 获取单个设备的详细信息

**路径参数**:

- `type`: 设备类型（`plc` 或 `hmi`）
- `id`: 设备 ID

**示例请求**:

```http
GET /api/v1/devices/plc/plc-001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应数据**: 完整的 PLCDevice 或 HMIDevice 对象

### 3.5 注册新设备实例

**接口**: `POST /devices/instances`  
**权限**: ENGINEER+  
**描述**: 在实际项目中注册一个具体的设备实例

**请求体**:

```typescript
interface CreateDeviceInstanceRequest {
  projectId: string // 所属项目 ID
  deviceModelId: string // 设备型号 ID
  instanceName: string // 实例名称
  ipAddress?: string // IP 地址
  port?: number // 端口号
  communicationProtocol?: string // 通信协议
  configuration?: Record<string, any> // 额外配置
}
```

**响应数据**:

```typescript
interface DeviceInstance {
  id: string // 实例 ID
  projectId: string
  deviceModelId: string
  instanceName: string
  status: 'online' | 'offline' | 'error'
  ipAddress?: string
  port?: number
  lastConnectedAt?: string
  createdAt: string
  updatedAt: string
}
```

### 3.6 更新设备实例配置

**接口**: `PUT /devices/instances/{instanceId}`  
**权限**: ENGINEER+  
**描述**: 更新设备实例的配置信息

**请求体**: 部分更新的 DeviceInstance 字段

### 3.7 删除设备实例

**接口**: `DELETE /devices/instances/{instanceId}`  
**权限**: ENGINEER+  
**描述**: 删除设备实例

**响应**: 标准成功/失败响应

### 3.8 获取项目关联的设备实例列表

**接口**: `GET /projects/{projectId}/devices`  
**权限**: GUEST+  
**描述**: 获取指定项目下关联的所有设备实例

**响应数据**: DeviceInstance 数组

---

## 4. 变量管理接口

### 4.1 获取 PLC 变量列表

**接口**: `GET /plc/variables`  
**权限**: GUEST+  
**描述**: 获取指定型号 PLC 的变量列表

**请求参数**:

```typescript
interface VariableQueryParams {
  model: string // 设备型号（必填）
  type?: 'input' | 'output' | 'memory' // 变量类型过滤
  dataType?: string // 数据类型过滤（BOOL, INT, REAL 等）
  search?: string // 搜索关键词
  page?: number
  pageSize?: number
}
```

**响应数据**:

```typescript
interface PLCVariable {
  id: string // 变量唯一标识
  label: string // 显示标签
  value: string // 实际值（用于绑定）
  type: 'input' | 'output' | 'memory' // 变量类型
  address: string // 物理地址
  dataType: string // 数据类型
  description?: string // 描述信息
  unit?: string // 单位
  minValue?: number // 最小值
  maxValue?: number // 最大值
  accessLevel: 'read' | 'write' | 'read-write' // 访问权限
  createdAt: string
  updatedAt: string
}
```

**示例请求**:

```http
GET /api/v1/plc/variables?model=Siemens%20S7-200%20SMART&type=input&page=1&pageSize=50
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**示例响应**:

```json
{
  "code": 200,
  "data": {
    "total": 16,
    "page": 1,
    "pageSize": 50,
    "items": [
      {
        "id": "var-i0",
        "label": "输入点 I0",
        "value": "I0",
        "type": "input",
        "address": "I0.0",
        "dataType": "BOOL",
        "description": "数字量输入点 0",
        "accessLevel": "read",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  },
  "message": "success",
  "timestamp": 1712649600000
}
```

### 4.2 获取变量详情

**接口**: `GET /plc/variables/{address}`  
**权限**: GUEST+  
**描述**: 获取单个变量的详细信息

### 4.3 创建设备自定义变量

**接口**: `POST /devices/instances/{instanceId}/variables`  
**权限**: ENGINEER+  
**描述**: 为具体设备实例创建自定义变量

**请求体**:

```typescript
interface CreateCustomVariableRequest {
  label: string
  value: string
  type: 'input' | 'output' | 'memory'
  address: string
  dataType: string
  description?: string
  unit?: string
  minValue?: number
  maxValue?: number
  accessLevel: 'read' | 'write' | 'read-write'
}
```

### 4.4 更新自定义变量

**接口**: `PUT /devices/instances/{instanceId}/variables/{address}`  
**权限**: ENGINEER+

### 4.5 删除自定义变量

**接口**: `DELETE /devices/instances/{instanceId}/variables/{address}`  
**权限**: ENGINEER+

### 4.6 批量导入变量

**接口**: `POST /devices/instances/{instanceId}/variables/batch-import`  
**权限**: ENGINEER+  
**描述**: 批量导入变量定义（支持 CSV、Excel、JSON 格式）

**请求体**:

```typescript
interface BatchImportVariablesRequest {
  format: 'csv' | 'excel' | 'json'
  data: string // Base64 编码的文件内容或直接 JSON 数据
  overwrite?: boolean // 是否覆盖已存在的变量
}
```

---

## 5. 程序代码接口

### 5.1 读取 PLC 程序代码

**接口**: `GET /devices/instances/{instanceId}/program`  
**权限**: ENGINEER+  
**描述**: 从 PLC 设备读取当前运行的程序代码

**请求参数**:

```typescript
interface ProgramQueryParams {
  format?: 'source' | 'compiled' | 'both' // 代码格式
  includeComments?: boolean // 是否包含注释
}
```

**响应数据**:

```typescript
interface PLCProgram {
  deviceId: string
  programName: string
  version: string
  compiledAt: string
  sourceCode?: string // 源代码（如果 format 包含 source）
  compiledCode?: string // 编译后的代码（如果 format 包含 compiled）
  checksum: string // 校验和
  size: number // 程序大小（字节）
  downloadedAt: string // 下载时间
}
```

### 5.2 上传程序到 PLC

**接口**: `POST /devices/instances/{instanceId}/program/upload`  
**权限**: ENGINEER+  
**描述**: 将程序代码上传（下载）到 PLC 设备

**请求体**:

```typescript
interface UploadProgramRequest {
  programData: string // Base64 编码的程序文件
  format: 'source' | 'compiled'
  programName: string
  version: string
  overwrite?: boolean // 是否覆盖现有程序
  backupCurrent?: boolean // 是否备份当前程序
}
```

**响应数据**:

```typescript
interface UploadProgramResponse {
  success: boolean
  message: string
  backupId?: string // 备份 ID（如果进行了备份）
  uploadedAt: string
}
```

### 5.3 备份 PLC 程序

**接口**: `POST /devices/instances/{instanceId}/program/backup`  
**权限**: ENGINEER+  
**描述**: 备份当前 PLC 中的程序

**响应数据**:

```typescript
interface ProgramBackup {
  id: string
  deviceId: string
  programName: string
  version: string
  backupAt: string
  size: number
  checksum: string
  downloadUrl: string // 备份文件下载地址（24小时有效）
}
```

### 5.4 获取程序备份列表

**接口**: `GET /devices/instances/{instanceId}/program/backups`  
**权限**: ENGINEER+

**响应数据**: ProgramBackup 数组

### 5.5 恢复程序备份

**接口**: `POST /devices/instances/{instanceId}/program/restore/{backupId}`  
**权限**: ENGINEER+  
**描述**: 从备份恢复程序

### 5.6 删除程序备份

**接口**: `DELETE /devices/instances/{instanceId}/program/backups/{backupId}`  
**权限**: ENGINEER+

---

## 6. 设备状态监控接口

### 6.1 获取设备实时状态

**接口**: `GET /devices/instances/{instanceId}/status`  
**权限**: OPERATOR+  
**描述**: 获取设备的当前运行状态

**响应数据**:

```typescript
interface DeviceStatus {
  deviceId: string
  status: 'running' | 'stopped' | 'error' | 'maintenance' | 'offline'
  mode: 'auto' | 'manual' | 'teach' // 运行模式
  errorCode?: string // 错误代码（如果有）
  errorMessage?: string // 错误信息
  uptime: number // 运行时长（秒）
  cycleTime?: number // 扫描周期（毫秒）
  cpuUsage?: number // CPU 使用率（百分比）
  memoryUsage?: number // 内存使用率（百分比）
  temperature?: number // 温度（摄氏度）
  lastUpdateAt: string // 最后更新时间
}
```

**示例响应**:

```json
{
  "code": 200,
  "data": {
    "deviceId": "inst-001",
    "status": "running",
    "mode": "auto",
    "uptime": 86400,
    "cycleTime": 10,
    "cpuUsage": 35.5,
    "memoryUsage": 62.3,
    "temperature": 45.2,
    "lastUpdateAt": "2024-04-09T08:30:00.000Z"
  },
  "message": "success",
  "timestamp": 1712649600000
}
```

### 6.2 获取变量实时值

**接口**: `GET /devices/instances/{instanceId}/variables/values`  
**权限**: OPERATOR+  
**描述**: 批量读取变量的当前值

**请求参数**:

```typescript
interface VariableValuesQuery {
  addresses: string[] // 变量 ID 列表（最多 100 个）
}
```

**响应数据**:

```typescript
interface VariableValue {
  variableId: string
  address: string
  value: any // 变量值
  quality: 'good' | 'bad' | 'uncertain' // 数据质量
  timestamp: string // 采集时间
}
```

**示例请求**:

```http
GET /api/v1/devices/instances/inst-001/variables/values?addresses=X0,Y0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**示例响应**:

```json
{
  "code": 200,
  "data": [
    {
      "variableId": "var-i0",
      "address": "X0",
      "value": true,
      "quality": "good",
      "timestamp": "2024-04-09T08:30:00.000Z"
    },
    {
      "variableId": "var-q0",
      "address": "Y0",
      "value": false,
      "quality": "good",
      "timestamp": "2024-04-09T08:30:00.000Z"
    }
  ],
  "message": "success",
  "timestamp": 1712649600000
}
```

### 6.3 获取历史采样数据

**接口**: `GET /devices/instances/{instanceId}/variables/history`  
**权限**: OPERATOR+  
**描述**: 获取指定时间段内的变量历史数据

**请求参数**:

```typescript
interface HistoryDataQuery {
  addresses: string[] // 变量 ID 列表
  startTime: string // 开始时间（ISO 8601）
  endTime: string // 结束时间（ISO 8601）
  interval?: number // 采样间隔（秒），默认 60
  aggregation?: 'raw' | 'avg' | 'min' | 'max' // 聚合方式
  limit?: number // 最大返回记录数，默认 1000
}
```

**响应数据**:

```typescript
interface HistoryDataPoint {
  variableId: string
  address: string
  timestamp: string
  value: any
  quality: 'good' | 'bad' | 'uncertain'
}

interface HistoryDataResponse {
  data: HistoryDataPoint[]
  total: number
  startTime: string
  endTime: string
  interval: number
}
```

**示例请求**:

```http
GET /api/v1/devices/instances/inst-001/variables/history?addresses=var-m0&startTime=2024-04-08T00:00:00.000Z&endTime=2024-04-09T00:00:00.000Z&interval=300&aggregation=avg
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6.4 订阅实时数据（WebSocket）

**接口**: `WS /ws/devices/instances/{instanceId}/subscribe`  
**权限**: OPERATOR+  
**描述**: 通过 WebSocket 订阅变量的实时数据变化

**连接参数**:

```typescript
interface SubscribeRequest {
  addresses: string[] // 要订阅的变量 ID 列表
  samplingRate?: number // 采样率（毫秒），默认 1000
}
```

**推送数据格式**:

```typescript
interface RealtimeDataPush {
  type: 'variable_update'
  data: {
    variableId: string
    address: string
    value: any
    quality: 'good' | 'bad' | 'uncertain'
    timestamp: string
  }
}
```

**使用示例**:

```javascript
const ws = new WebSocket(
  'wss://api.your-hmi-app.com/ws/devices/instances/inst-001/subscribe',
)

ws.onopen = () => {
  ws.send(
    JSON.stringify({
      addresses: ['X0', 'X1', 'Y0'],
      samplingRate: 500,
    }),
  )
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Realtime update:', data)
}
```

### 6.5 获取设备报警信息

**接口**: `GET /devices/instances/{instanceId}/alarms`  
**权限**: OPERATOR+  
**描述**: 获取设备的当前和历史报警信息

**请求参数**:

```typescript
interface AlarmQueryParams {
  status?: 'active' | 'acknowledged' | 'cleared' // 报警状态
  severity?: 'info' | 'warning' | 'error' | 'critical' // 严重程度
  startTime?: string
  endTime?: string
  page?: number
  pageSize?: number
}
```

**响应数据**:

```typescript
interface Alarm {
  id: string
  deviceId: string
  alarmCode: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  status: 'active' | 'acknowledged' | 'cleared'
  triggeredAt: string
  acknowledgedAt?: string
  clearedAt?: string
  acknowledgedBy?: string
  relatedAddress?: string
}
```

### 6.6 确认报警

**接口**: `POST /devices/instances/{instanceId}/alarms/{alarmId}/acknowledge`  
**权限**: OPERATOR+  
**描述**: 确认报警

**请求体**:

```typescript
interface AcknowledgeAlarmRequest {
  comment?: string // 确认备注
}
```

---

## 7. 设备控制接口

### 7.1 写入单个变量值

**接口**: `POST /devices/instances/{instanceId}/variables/{address}/write`  
**权限**: OPERATOR+  
**描述**: 向指定变量写入值

**请求体**:

```typescript
interface WriteVariableRequest {
  value: any // 要写入的值
  timeout?: number // 超时时间（毫秒），默认 5000
}
```

**响应数据**:

```typescript
interface WriteVariableResponse {
  success: boolean
  message: string
  writtenAt: string
}
```

**示例请求**:

```http
POST /api/v1/devices/instances/inst-001/variables/X0/write
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "value": true
}
```

### 7.2 批量写入变量值

**接口**: `POST /devices/instances/{instanceId}/variables/batch-write`  
**权限**: OPERATOR+  
**描述**: 批量写入多个变量的值

**请求体**:

```typescript
interface BatchWriteRequest {
  writes: Array<{
    address: string
    value: any
  }>
  atomic?: boolean // 是否原子操作（全部成功或全部失败）
  timeout?: number
}
```

**响应数据**:

```typescript
interface BatchWriteResponse {
  success: boolean
  results: Array<{
    address: string
    success: boolean
    message?: string
  }>
  writtenAt: string
}
```

### 7.3 执行设备命令

**接口**: `POST /devices/instances/{instanceId}/commands/execute`  
**权限**: OPERATOR+  
**描述**: 执行预定义的设备命令

**请求体**:

```typescript
interface ExecuteCommandRequest {
  command: 'start' | 'stop' | 'reset' | 'pause' | 'resume' | string
  parameters?: Record<string, any>
  timeout?: number
}
```

**响应数据**:

```typescript
interface CommandExecutionResponse {
  success: boolean
  message: string
  executedAt: string
  result?: any
}
```

**示例**:

```http
POST /api/v1/devices/instances/inst-001/commands/execute
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "command": "start",
  "parameters": {
    "mode": "auto"
  }
}
```

### 7.4 切换运行模式

**接口**: `POST /devices/instances/{instanceId}/mode/switch`  
**权限**: ENGINEER+  
**描述**: 切换设备运行模式

**请求体**:

```typescript
interface SwitchModeRequest {
  mode: 'auto' | 'manual' | 'teach'
  password?: string // 可能需要密码确认
}
```

### 7.5 重启设备

**接口**: `POST /devices/instances/{instanceId}/restart`  
**权限**: ENGINEER+  
**描述**: 重启 PLC 设备

**请求体**:

```typescript
interface RestartRequest {
  type: 'soft' | 'hard' // 软重启或硬重启
  confirm: boolean // 必须显式确认
}
```

---

## 8. 项目管理接口

### 8.1 创建项目

**接口**: `POST /projects`  
**权限**: ENGINEER+  
**描述**: 创建新的 HMI 项目

**请求体**:

```typescript
interface CreateProjectRequest {
  name: string
  description?: string
  resolution: {
    width: number
    height: number
  }
  plcDeviceModel?: string
  hmiDeviceModel?: string
  customPlcModel?: string
  customHmiModel?: string
  themeId?: string
}
```

**响应数据**: Project 对象（完整结构见 types/editor.ts）

### 8.2 获取项目列表

**接口**: `GET /projects`  
**权限**: GUEST+

**请求参数**:

```typescript
interface ProjectQueryParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name'
  order?: 'asc' | 'desc'
}
```

### 8.3 获取项目详情

**接口**: `GET /projects/{projectId}`  
**权限**: GUEST+

### 8.4 更新项目

**接口**: `PUT /projects/{projectId}`  
**权限**: ENGINEER+

### 8.5 删除项目

**接口**: `DELETE /projects/{projectId}`  
**权限**: ADMIN

### 8.6 导出项目

**接口**: `GET /projects/{projectId}/export`  
**权限**: ENGINEER+  
**描述**: 导出项目配置文件（JSON 格式）

**响应**: 文件下载

### 8.7 导入项目

**接口**: `POST /projects/import`  
**权限**: ENGINEER+  
**描述**: 从 JSON 文件导入项目

**请求体**: FormData，包含项目 JSON 文件

---

## 9. 错误码说明

### 9.1 通用错误码

| 错误码 | 说明             | HTTP 状态码 |
| ------ | ---------------- | ----------- |
| 200    | 成功             | 200         |
| 40000  | 请求参数错误     | 400         |
| 40001  | 缺少必需参数     | 400         |
| 40002  | 参数格式错误     | 400         |
| 40100  | 未认证           | 401         |
| 40101  | Token 无效或过期 | 401         |
| 40300  | 权限不足         | 403         |
| 40400  | 资源不存在       | 404         |
| 40401  | 设备不存在       | 404         |
| 40402  | 变量不存在       | 404         |
| 40403  | 项目不存在       | 404         |
| 40900  | 资源冲突         | 409         |
| 40901  | 设备名称已存在   | 409         |
| 42200  | 数据验证失败     | 422         |
| 42900  | 请求频率超限     | 429         |
| 50000  | 服务器内部错误   | 500         |
| 50200  | 设备通信失败     | 502         |
| 50300  | 服务不可用       | 503         |
| 50400  | 设备响应超时     | 504         |

### 9.2 设备相关错误码

| 错误码 | 说明               |
| ------ | ------------------ |
| 50201  | 设备离线           |
| 50202  | 设备连接超时       |
| 50203  | 通信协议错误       |
| 50204  | 设备忙，请稍后重试 |
| 50205  | 变量地址无效       |
| 50206  | 写入权限不足       |
| 50207  | 数据类型不匹配     |
| 50208  | 值超出范围         |

### 9.3 错误响应示例

```json
{
  "code": 50201,
  "data": null,
  "message": "设备离线，请检查网络连接",
  "timestamp": 1712649600000,
  "details": {
    "deviceId": "inst-001",
    "lastSeenAt": "2024-04-08T20:15:00.000Z"
  }
}
```

---

## 附录

### A. 数据类型映射表

| PLC 数据类型 | JavaScript 类型 | 说明                 |
| ------------ | --------------- | -------------------- |
| BOOL         | boolean         | 布尔值               |
| INT          | number          | 16位整数             |
| DINT         | number          | 32位整数             |
| REAL         | number          | 32位浮点数           |
| LREAL        | number          | 64位浮点数           |
| STRING       | string          | 字符串               |
| TIME         | number          | 时间（毫秒）         |
| DATE         | string          | 日期（ISO 8601）     |
| DATETIME     | string          | 日期时间（ISO 8601） |

### B. 通信协议支持

| 协议          | 说明                         | 适用设备             |
| ------------- | ---------------------------- | -------------------- |
| Modbus TCP    | 标准 Modbus over TCP         | 大多数 PLC           |
| Siemens S7    | 西门子 S7 协议               | Siemens S7 系列      |
| Mitsubishi MC | 三菱 MC 协议                 | Mitsubishi FX/Q 系列 |
| Omron FINS    | 欧姆龙 FINS 协议             | Omron CJ/CP 系列     |
| OPC UA        | OPC Unified Architecture     | 高端 PLC             |
| EtherNet/IP   | Ethernet Industrial Protocol | Rockwell, Omron      |

### C. 速率限制

| 接口类型       | 限制               |
| -------------- | ------------------ |
| 读取操作       | 100 次/分钟        |
| 写入操作       | 50 次/分钟         |
| 程序上传/下载  | 10 次/小时         |
| WebSocket 订阅 | 最多 10 个并发连接 |

### D. 最佳实践

1. **批量操作**: 优先使用批量接口减少请求次数
2. **缓存策略**: 设备型号、变量定义等静态数据建议客户端缓存
3. **错误重试**: 对于网络错误实现指数退避重试
4. **心跳检测**: WebSocket 连接每 30 秒发送心跳
5. **数据压缩**: 大数据量传输启用 Gzip 压缩
6. **安全传输**: 生产环境必须使用 HTTPS/WSS

### E. 版本历史

| 版本 | 日期       | 变更说明 |
| ---- | ---------- | -------- |
| v1.0 | 2024-04-09 | 初始版本 |

---

## 联系与支持

如有问题或建议，请联系技术支持团队：

- Email: api-support@your-hmi-app.com
- 文档更新: https://docs.your-hmi-app.com/api
