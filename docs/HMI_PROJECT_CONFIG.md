# HMI 项目文件配置指南

## 📁 .hmi 文件格式

`.hmi` 文件是 HMI Runtime 的项目文件格式,采用 JSON 格式存储项目配置。

### 文件位置

默认情况下,HMI Runtime 会从以下位置加载项目文件:

```
public/test_runtime.hmi
```

### 配置文件路径

可以通过修改 `src/config.ts` 中的 `hmiProjectPath` 来更改项目文件路径:

```typescript
export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  hmiProjectPath: '/test_runtime.hmi',  // 修改为你的 .hmi 文件路径
  // ...
}
```

路径可以是:
- **相对路径**: 相对于 `public` 文件夹,例如 `/projects/my_project.hmi`
- **绝对URL**: 完整的 URL,例如 `http://example.com/project.hmi`
- **空字符串**: 显示"未加载触摸屏程序"提示

## 📄 .hmi 文件结构

```json
{
  "id": "unique-project-id",
  "name": "项目名称",
  "version": "1.0.0",
  "resolution": {
    "width": 800,
    "height": 480
  },
  "pages": [
    {
      "id": "page_1",
      "name": "主画面",
      "pageType": "home",
      "components": [
        {
          "id": "TextDisplay_1",
          "type": "TextDisplay",
          "name": "文本显示_1",
          "x": 144,
          "y": 144,
          "width": 120,
          "height": 40,
          "properties": {
            "variable": "X0",
            "fontSize": 14,
            "color": {
              "useTheme": true,
              "themeColorKey": "textPrimary"
            }
          },
          "zIndex": 0,
          "visible": true,
          "display": true,
          "isContainer": false,
          "resizable": true
        }
      ],
      "properties": {
        "backgroundColor": {
          "useTheme": true,
          "themeColorKey": "white"
        },
        "backgroundRepeat": "no-repeat",
        "backgroundSize": "cover",
        "gridVisible": true,
        "snapToGrid": true
      },
      "status": "CLEAN"
    }
  ],
  "currentPageId": "page_1",
  "updatedAt": 1776252194243,
  "plcManufacturerName": "...",
  "plcSeriesName": "...",
  "plcDeviceModel": "Siemens S7-1200",
  "hmiManufacturerName": "...",
  "hmiDeviceModel": "Siemens KTP900",
  "themeId": "default-light",
  "metadata": {
    "author": "",
    "description": ""
  },
  "status": "CLEAN"
}
```

## 🔧 主要字段说明

### Project 级别字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 项目唯一标识符 |
| name | string | ✅ | 项目名称 |
| version | string | ✅ | 版本号 |
| resolution | object | ✅ | 分辨率 {width, height} |
| pages | array | ✅ | 页面数组 |
| currentPageId | string | ✅ | 当前显示的页面ID |
| themeId | string | ❌ | 主题ID (default: 'default-light') |
| plcDeviceModel | string | ❌ | PLC设备型号 |
| hmiDeviceModel | string | ❌ | HMI设备型号 |
| metadata | object | ❌ | 元数据 {author, description} |

### Page 级别字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 页面唯一标识符 |
| name | string | ✅ | 页面名称 |
| pageType | string | ✅ | 页面类型: 'home' 或 'normal' |
| components | array | ✅ | 组件数组 |
| properties | object | ✅ | 页面属性(背景色等) |

### Component 级别字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 组件唯一标识符 |
| type | string | ✅ | 组件类型 (如 TextDisplay, NumericDisplay) |
| name | string | ✅ | 组件名称 |
| x | number | ✅ | X坐标(像素) |
| y | number | ✅ | Y坐标(像素) |
| width | number | ✅ | 宽度(像素) |
| height | number | ✅ | 高度(像素) |
| properties | object | ✅ | 组件属性 |
| zIndex | number | ❌ | 层级顺序 |
| visible | boolean | ❌ | 运行时是否可见 (default: true) |

## 🎨 支持的组件类型

目前已实现的组件类型:

1. **TextDisplay** - 文本显示
   ```json
   {
     "type": "TextDisplay",
     "properties": {
       "variable": "X0",
       "fontSize": 14,
       "color": {"useTheme": true, "themeColorKey": "textPrimary"}
     }
   }
   ```

2. **NumericDisplay** - 数值显示
   ```json
   {
     "type": "NumericDisplay",
     "properties": {
       "variable": "X1",
       "decimalPlaces": 2,
       "thousandsSeparator": false
     }
   }
   ```

3. **ProgressBar** - 进度条
   ```json
   {
     "type": "ProgressBar",
     "properties": {
       "variable": "X2",
       "min": 0,
       "max": 100,
       "orientation": "horizontal"
     }
   }
   ```

## 🚀 使用步骤

### 1. 准备 .hmi 文件

将你的 `.hmi` 项目文件复制到 `public` 目录下。

### 2. 配置路径 (可选)

如果需要从其他位置加载,编辑 `src/config.ts`:

```typescript
export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  hmiProjectPath: '/my-project.hmi',  // 你的文件名
  // ...
}
```

### 3. 启动应用

```bash
npm run dev
```

访问 http://localhost:3002

### 4. 查看效果

- 如果文件存在且格式正确,会显示项目首页
- 如果文件不存在,会显示"未加载触摸屏程序"提示

## 🔄 重新加载项目

在运行时,可以通过以下方式重新加载:

1. **点击"重新加载"按钮** (在错误页面上)
2. **刷新浏览器** (F5)
3. **调用API** (未来功能):
   ```javascript
   POST /api/publish
   Body: { project: ProjectFileDTO }
   ```

## 📝 创建新的 .hmi 文件

你可以手动创建 `.hmi` 文件,或使用编辑器导出。确保:

1. JSON 格式正确
2. 包含所有必填字段
3. 组件类型已实现
4. 分辨率适合目标设备

## 🐛 常见问题

### Q: 显示"未加载触摸屏程序"

**A**: 检查以下几点:
1. `.hmi` 文件是否在 `public` 目录下
2. 文件名是否与配置一致
3. 浏览器控制台是否有404错误

### Q: 组件不显示

**A**: 检查:
1. 组件 `type` 是否正确
2. 组件类型是否已注册
3. 组件的 `visible` 属性是否为 `true`
4. 组件坐标和尺寸是否合理

### Q: 变量绑定不工作

**A**: 确保:
1. 变量地址格式正确
2. 设备连接正常
3. 变量调度器正在运行

## 📖 示例文件

参考 `docs/test_runtime.hmi` 或 `public/test_runtime.hmi` 查看完整示例。

---

**更新日期**: 2026-04-15
**版本**: 1.0.0
