# Runtime 脚本系统使用示例

本文档提供脚本系统的使用示例和 API 说明。

## 目录
- [基础语法](#基础语法)
- [页面事件脚本](#页面事件脚本)
- [组件事件脚本](#组件事件脚本)
- [API 参考](#api-参考)

---

## 基础语法

### 变量声明
```javascript
let count = 0
const MAX_VALUE = 100
let name = "设备A"
```

### 条件语句
```javascript
let temperature = $device.read('D100')

if (temperature > 80) {
  console.log("温度过高！")
} else if (temperature > 60) {
  console.log("温度偏高")
} else {
  console.log("温度正常")
}
```

### 循环语句
```javascript
// for 循环
for (let i = 0; i < 10; i++) {
  console.log("计数:", i)
}

// while 循环
let retries = 3
while (retries > 0) {
  console.log("重试次数:", retries)
  retries--
}
```

### 函数定义
```javascript
function calculateArea(width, height) {
  return width * height
}

let area = calculateArea(100, 200)
console.log("面积:", area)
```

---

## 页面事件脚本

### onOpen - 页面打开时执行

```javascript
// 初始化页面数据
console.log("页面打开，初始化...")

// 读取 PLC 变量并显示
let temperature = $device.read('D100')
let pressure = $device.read('D101')

// 更新组件显示
let tempDisplay = $page.getComponent('tempDisplay')
if (tempDisplay) {
  tempDisplay.setText(temperature.toFixed(1) + '°C')
}

let pressDisplay = $page.getComponent('pressDisplay')
if (pressDisplay) {
  pressDisplay.setText(pressure.toFixed(2) + ' MPa')
}

// 设置全局变量
$project.setVariable('startTime', Date.now())
```

### onClose - 页面关闭时执行

```javascript
// 清理工作
console.log("页面关闭，保存状态...")

// 保存当前数据
let currentValue = $device.read('D200')
$project.setVariable('lastValue', currentValue)

// 写入 PLC 标记
$device.write('M10', 1)
```

---

## 组件事件脚本

### onClick - 按钮点击事件

```javascript
// 切换组件可见性
let panel = $page.getComponent('controlPanel')
if (panel) {
  panel.visible = !panel.visible
}

// 写入 PLC
$device.write('M0', 1)

// 导航到详细页面
$navigation.openPage('detailPage', { deviceId: 123 })
```

### onChange - 值变化事件

```javascript
// 获取新值
let newValue = $component.getValue()

// 根据值改变颜色
if (newValue > 80) {
  $component.setColor('#ff0000')  // 红色
} else if (newValue > 60) {
  $component.setColor('#ffff00')  // 黄色
} else {
  $component.setColor('#00ff00')  // 绿色
}

console.log("值已改变:", newValue)
```

---

## HTTP 请求示例

### GET 请求
```javascript
async function fetchWeather() {
  try {
    let response = await $http.get('https://api.weather.com/current?city=Beijing')
    let data = await response.json()

    let tempComp = $page.getComponent('outdoorTemp')
    if (tempComp) {
      tempComp.setText(data.temperature + '°C')
    }

    console.log("天气数据更新成功")
  } catch (error) {
    console.error("获取天气失败:", error)
  }
}

fetchWeather()
```

### POST 请求
```javascript
async function submitData() {
  let data = {
    deviceId: 123,
    value: $device.read('D100'),
    timestamp: Date.now()
  }

  try {
    let response = await $http.post('https://api.example.com/data', data, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    })

    console.log("数据提交成功:", response.status)
  } catch (error) {
    console.error("数据提交失败:", error)
  }
}

submitData()
```

---

## 定时器示例

### setTimeout - 延时执行
```javascript
console.log("开始延时...")

$timer.setTimeout(function() {
  console.log("3秒后执行")
  let comp = $page.getComponent('indicator')
  if (comp) {
    comp.setColor('#00ff00')
  }
}, 3000)
```

### setInterval - 周期性执行
```javascript
let refreshCount = 0

function refreshData() {
  let value = $device.read('D200')
  let display = $page.getComponent('valueDisplay')
  if (display) {
    display.setValue(value)
  }

  refreshCount++
  console.log("刷新次数:", refreshCount)

  // 刷新 100 次后停止
  if (refreshCount >= 100) {
    $timer.clearInterval(timerId)
    console.log("停止刷新")
  }
}

let timerId = $timer.setInterval(refreshData, 1000)
```

---

## 页面导航示例

### 打开页面并传递参数
```javascript
// 打开详细页面
$navigation.openPage('detailPage', {
  deviceId: 123,
  mode: 'edit'
})
```

### 返回上一页
```javascript
// 返回
$navigation.back()

// 或者关闭当前页面
$navigation.closePage()
```

### 获取页面参数
```javascript
let params = $navigation.getParams()
console.log("设备ID:", params.deviceId)
console.log("模式:", params.mode)
```

---

## 组件操作示例

### 读写组件属性
```javascript
let comp = $page.getComponent('myComponent')

if (comp) {
  // 基本属性
  comp.visible = true
  comp.x = 100
  comp.y = 200

  // 文本操作
  comp.setText("Hello World")
  let text = comp.getText()

  // 颜色操作
  comp.setColor("#ff0000")
  comp.setBackgroundColor("#ffffff")

  // 值操作
  comp.setValue(42)
  let value = comp.getValue()

  // 自定义属性
  comp.setProperty('customKey', 'customValue')
  let custom = comp.getProperty('customKey')
}
```

### 遍历所有组件
```javascript
let components = $page.getComponents()

for (let i = 0; i < components.length; i++) {
  let comp = components[i]
  console.log("组件", i, ":", comp.name, comp.type)

  // 隐藏所有组件
  comp.visible = false
}
```

---

## 数学运算示例

```javascript
// 使用 Math 对象
let pi = Math.PI
let random = Math.random()
let max = Math.max(10, 20, 30)
let min = Math.min(10, 20, 30)
let abs = Math.abs(-42)
let sqrt = Math.sqrt(144)
let round = Math.round(3.7)

// 三角函数
let sin = Math.sin(Math.PI / 2)
let cos = Math.cos(0)

console.log("计算结果:", { pi, random, max, min, abs, sqrt, round })
```

---

## 错误处理示例

```javascript
try {
  // 可能出错的代码
  let value = $device.read('D999')

  if (value === null) {
    throw new Error("读取失败")
  }

  console.log("读取成功:", value)
} catch (error) {
  console.error("发生错误:", error)

  // 设置默认值
  let comp = $page.getComponent('display')
  if (comp) {
    comp.setText("N/A")
  }
} finally {
  console.log("清理工作")
}
```

---

## API 参考

### $project - 项目 API
- `id` - 项目 ID
- `name` - 项目名称
- `version` - 项目版本
- `resolution` - 分辨率 `{width, height}`
- `getVariable(name)` - 获取全局变量
- `setVariable(name, value)` - 设置全局变量
- `getResource(name)` - 获取资源

### $page - 页面 API
- `id` - 页面 ID
- `name` - 页面名称
- `pageType` - 页面类型 ('home' | 'normal')
- `getProperty(key)` - 获取页面属性
- `setProperty(key, value)` - 设置页面属性
- `getComponent(componentId)` - 获取组件代理
- `getComponents()` - 获取所有组件代理

### $component - 当前组件 API（仅在组件事件中可用）
- `id` - 组件 ID
- `type` - 组件类型
- `name` - 组件名称
- `visible` - 可见性
- `x, y` - 位置
- `width, height` - 尺寸
- `getValue()` - 获取值
- `setValue(value)` - 设置值
- `getText()` - 获取文本
- `setText(text)` - 设置文本
- `getColor()` - 获取颜色
- `setColor(color)` - 设置颜色
- `getBackgroundColor()` - 获取背景色
- `setBackgroundColor(color)` - 设置背景色
- `getProperty(key)` - 获取自定义属性
- `setProperty(key, value)` - 设置自定义属性

### $device - 设备/PLC API
- `read(address)` - 读取 PLC 变量
- `write(address, value)` - 写入 PLC 变量
- `readBatch(addresses)` - 批量读取
- `writeBatch(writes)` - 批量写入

### $http - HTTP API
- `get(url, options)` - GET 请求
- `post(url, data, options)` - POST 请求
- `put(url, data, options)` - PUT 请求
- `delete(url, options)` - DELETE 请求

### $timer - 定时器 API
- `setTimeout(callback, delay)` - 延时执行
- `clearTimeout(timerId)` - 清除延时
- `setInterval(callback, interval)` - 周期执行
- `clearInterval(timerId)` - 清除周期

### $navigation - 导航 API
- `openPage(pageId, params)` - 打开页面
- `closePage()` - 关闭当前页面
- `back()` - 返回上一页
- `reload()` - 刷新当前页面
- `getParams()` - 获取页面参数

### console - 日志 API
- `log(...args)` - 普通日志
- `warn(...args)` - 警告日志
- `error(...args)` - 错误日志
- `info(...args)` - 信息日志

### 内置对象
- `Math` - 数学对象
- `JSON` - JSON 对象
- `Date` - 日期对象
- `parseInt(str)` - 解析整数
- `parseFloat(str)` - 解析浮点数
- `isNaN(value)` - 判断是否 NaN
- `Boolean(value)` - 转换为布尔值
- `String(value)` - 转换为字符串
- `Number(value)` - 转换为数字
- `Array` - 数组构造函数
- `Object` - 对象构造函数

---

## 注意事项

1. **异步支持**：HTTP 请求需要使用 `async/await`
2. **执行超时**：脚本默认 5 秒超时
3. **步数限制**：最多执行 100,000 步，防止死循环
4. **错误处理**：建议使用 try-catch 包裹可能出错的代码
5. **性能考虑**：避免在循环中频繁读写 PLC 变量
