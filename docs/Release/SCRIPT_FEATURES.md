# 脚本引擎功能说明

## 类型转换

### 强制类型转换函数

```javascript
// 转换为字符串
let num = 123
let str = String(num)  // "123"

// 转换为数字
let str = '456'
let num = Number(str)  // 456

// 转换为布尔值
let bool = Boolean(1)  // true
let bool2 = Boolean(0) // false
```

### 解析函数

```javascript
// 解析整数
let num = parseInt('789')     // 789
let hex = parseInt('0xFF', 16) // 255

// 解析浮点数
let pi = parseFloat('3.14')   // 3.14
```

## 字符串操作

### 大小写转换

```javascript
let str = 'Hello World'

// 转大写
let upper = str.toUpperCase()  // "HELLO WORLD"

// 转小写
let lower = str.toLowerCase()  // "hello world"
```

### 字符串修剪

```javascript
let str = '  Hello  '
let trimmed = str.trim()        // "Hello"
let leftTrimmed = str.trimStart() // "Hello  "
let rightTrimmed = str.trimEnd()  // "  Hello"
```

### 子串操作

```javascript
let str = 'Hello World'

// 截取子串
let sub1 = str.substring(0, 5)  // "Hello"
let sub2 = str.slice(6, 11)     // "World"

// 获取字符
let char = str.charAt(0)        // "H"
let charCode = str.charCodeAt(0) // 72
```

### 查找和替换

```javascript
let str = 'Hello World'

// 查找索引
let index = str.indexOf('World')    // 6
let lastIndex = str.lastIndexOf('o') // 7

// 检查包含
let hasWorld = str.includes('World')  // true
let startsWithHello = str.startsWith('Hello') // true
let endsWithWorld = str.endsWith('World')     // true
```

### 字符串替换

```javascript
let str = 'Hello World'
let replaced = str.replace('World', 'JavaScript')
// "Hello JavaScript"

// 全局替换（需要正则表达式）
let str2 = 'aaa'
let replacedAll = str2.replace(/a/g, 'b') // "bbb"
```

### 分割和连接

```javascript
// 分割字符串
let csv = 'apple,banana,orange'
let arr = csv.split(',')  // ["apple", "banana", "orange"]

// 连接字符串
let str1 = 'Hello'
let str2 = 'World'
let joined = str1.concat(' ', str2) // "Hello World"

// 或使用 + 运算符
let message = 'Hello' + ' ' + 'World' // "Hello World"
```

### 填充和重复

```javascript
// 左侧填充
let num = String(5)
let padded = num.padStart(3, '0')  // "005"

// 右侧填充
let paddedRight = num.padEnd(3, '0') // "500"

// 重复字符串
let str = 'abc'
let repeated = str.repeat(3)  // "abcabcabc"
```

### 字符串属性

```javascript
let str = 'Hello World'
let length = str.length  // 11
```

## 实际应用示例

### 设备状态显示

```javascript
let deviceName = 'plc-device-01'
let status = 'connected'

// 格式化输出
let message = 'Device: ' + deviceName.toUpperCase() +
              ' Status: ' + status.toUpperCase()

console.log(message)
// "Device: PLC-DEVICE-01 Status: CONNECTED"
```

### 数据格式化

```javascript
// 格式化数字为固定宽度
let count = 5
let formatted = String(count).padStart(4, '0')
// "0005"

// 创建 CSV 行
let name = 'Alice'
let age = 25
let city = 'Beijing'
let csvLine = [name, String(age), city].join(',')
// "Alice,25,Beijing"
```

### 字符串处理链

```javascript
let input = '  Hello World  '

// 链式调用
let result = input.trim().toLowerCase().replace('world', 'JavaScript')
// "hello javascript"
```

### 条件判断

```javascript
let status = 'CONNECTED'

if (status.toUpperCase() === 'CONNECTED') {
  console.log('设备已连接')
} else if (status.toUpperCase() === 'ERROR') {
  console.log('设备错误')
}
```

## 数值运算

### 基本算术

```javascript
let a = 10
let b = 3

let sum = a + b        // 13
let diff = a - b       // 7
let product = a * b    // 30
let quotient = a / b   // 3.333...
let remainder = a % b  // 1
```

### 复合赋值

```javascript
let x = 10
x += 5   // x = 15
x -= 3   // x = 12
x *= 2   // x = 24
x /= 4   // x = 6
```

### 自增自减

```javascript
let count = 0
count++  // 后置递增
++count  // 前置递增
count--  // 后置递减
--count  // 前置递减
```

## Math 对象

```javascript
// 常用方法
let max = Math.max(1, 2, 3)      // 3
let min = Math.min(1, 2, 3)      // 1
let abs = Math.abs(-5)           // 5
let round = Math.round(3.6)      // 4
let floor = Math.floor(3.6)      // 3
let ceil = Math.ceil(3.2)        // 4
let pow = Math.pow(2, 3)         // 8
let sqrt = Math.sqrt(16)         // 4
let random = Math.random()       // 0-1 之间的随机数

// 三角函数
let sin = Math.sin(Math.PI / 2)  // 1
let cos = Math.cos(0)            // 1

// 常数
let pi = Math.PI                 // 3.14159...
let e = Math.E                   // 2.718...
```

## 数组操作

```javascript
// 创建数组
let arr = [1, 2, 3, 4, 5]

// 访问元素
let first = arr[0]      // 1
let last = arr[arr.length - 1]  // 5

// 常用方法
arr.push(6)             // 添加元素
arr.pop()               // 移除最后一个元素
arr.unshift(0)          // 在开头添加
arr.shift()             // 移除第一个元素

let sliced = arr.slice(1, 3)  // [2, 3]
let joined = arr.join(',')    // "1,2,3,4,5"
let reversed = arr.reverse()  // 反转数组

// 查找
let index = arr.indexOf(3)    // 2
let includes = arr.includes(3) // true

// 遍历
arr.forEach(item => console.log(item))
let doubled = arr.map(x => x * 2)
let filtered = arr.filter(x => x > 2)
```

## 对象操作

```javascript
// 创建对象
let obj = {
  name: 'Alice',
  age: 25,
  city: 'Beijing'
}

// 访问属性
let name = obj.name
let age = obj['age']

// 修改属性
obj.age = 26

// 添加属性
obj.email = 'alice@example.com'

// 获取键名
let keys = Object.keys(obj)  // ['name', 'age', 'city', 'email']

// 获取值
let values = Object.values(obj)
```

## JSON 处理

```javascript
// 对象转 JSON 字符串
let obj = { name: 'Alice', age: 25 }
let jsonStr = JSON.stringify(obj)
// '{"name":"Alice","age":25}'

// JSON 字符串转对象
let parsed = JSON.parse(jsonStr)
// { name: 'Alice', age: 25 }
```

## 日期时间

```javascript
// 创建日期
let now = new Date()
let specific = new Date('2024-01-01')

// 获取时间信息
let year = now.getFullYear()
let month = now.getMonth() + 1  // 0-11，需要+1
let day = now.getDate()
let hours = now.getHours()
let minutes = now.getMinutes()
let seconds = now.getSeconds()

// 时间戳
let timestamp = now.getTime()  // 毫秒数

// 格式化
let dateStr = now.toISOString()
let localeStr = now.toLocaleString()
```

## 控制台输出

```javascript
// 日志输出
console.log('普通消息')
console.warn('警告消息')
console.error('错误消息')
console.info('信息消息')

// 多个参数
console.log('设备:', deviceName, '状态:', status)

// 字符串拼接
let count = 42
console.log('点击次数: ' + count)
```

## 控制流

### 条件语句

```javascript
let value = 10

if (value > 10) {
  console.log('大于10')
} else if (value === 10) {
  console.log('等于10')
} else {
  console.log('小于10')
}
```

### 循环语句

```javascript
// for 循环
for (let i = 0; i < 5; i++) {
  console.log(i)
}

// while 循环
let count = 0
while (count < 5) {
  console.log(count)
  count++
}
```

### 函数

```javascript
// 定义函数
function add(a, b) {
  return a + b
}

// 调用函数
let result = add(5, 3)  // 8

// 匿名函数
let multiply = function(a, b) {
  return a * b
}
```

### 异常处理

```javascript
try {
  // 可能出错的代码
  let result = someOperation()
  console.log('成功:', result)
} catch (error) {
  // 错误处理
  console.error('失败:', error)
} finally {
  // 总是执行
  console.log('清理工作')
}
```

## 注意事项

1. **变量声明**: 使用 `let` 或 `const` 声明变量
2. **字符串拼接**: 使用 `+` 运算符，会自动处理类型转换
3. **方法调用**: 所有 JavaScript 原生方法都可以正常使用
4. **作用域**: 支持全局作用域和函数作用域
5. **异步**: 当前版本不支持 async/await
