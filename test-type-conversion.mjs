// test-type-conversion.mjs - Test type conversion and string operations

import { scriptEngine } from './src/services/script-engine.ts'

const mockContext = {
  $project: {
    id: 'test',
    name: 'Test Project',
    version: '1.0.0',
    resolution: { width: 800, height: 600 },
    getVariable: (name) => null,
    setVariable: (name, value) => {},
    getResource: (name) => null
  },
  $page: {
    id: 'page1',
    name: 'Test Page',
    pageType: 'normal',
    getProperty: (key) => null,
    setProperty: (key, value) => {},
    getComponent: (id) => null,
    getComponents: () => []
  },
  $component: null,
  $device: {
    read: (addr) => null,
    write: async (addr, value) => {},
    readBatch: (addrs) => ({}),
    writeBatch: async (writes) => {}
  },
  $http: {
    get: async () => ({}),
    post: async () => ({}),
    put: async () => ({}),
    delete: async () => ({})
  },
  $timer: {},
  $navigation: {
    openPage: () => {},
    closePage: () => {},
    back: () => {},
    reload: () => {},
    getParams: () => ({})
  },
  console: {
    log: (...args) => console.log('[Script]', ...args),
    warn: (...args) => console.warn('[Script]', ...args),
    error: (...args) => console.error('[Script]', ...args),
    info: (...args) => console.info('[Script]', ...args)
  },
  Math,
  JSON,
  Date,
  parseInt,
  parseFloat,
  isNaN,
  Boolean,
  String,
  Number,
  Array,
  Object
}

async function runTest(testName, code) {
  console.log(`\n${testName}`)
  console.log('代码:', code.trim())
  const result = await scriptEngine.run(code, mockContext)
  if (result.success) {
    console.log('✅ 成功')
    console.log('返回值:', JSON.stringify(result.returnValue))
  } else {
    console.log('❌ 失败:', result.error)
  }
}

async function runTests() {
  console.log('=== 类型转换和字符串操作测试 ===')

  // Test 1: String() constructor
  await runTest('测试1: String() 强制转换为字符串', `
let num = 123
let str = String(num)
return str
`)

  // Test 2: Number() constructor
  await runTest('测试2: Number() 强制转换为数字', `
let str = '456'
let num = Number(str)
return num
`)

  // Test 3: Boolean() constructor
  await runTest('测试3: Boolean() 强制转换为布尔值', `
let val = Boolean(1)
return val
`)

  // Test 4: parseInt
  await runTest('测试4: parseInt 解析整数', `
let str = '789'
let num = parseInt(str)
return num
`)

  // Test 5: parseFloat
  await runTest('测试5: parseFloat 解析浮点数', `
let str = '3.14'
let num = parseFloat(str)
return num
`)

  // Test 6: toUpperCase
  await runTest('测试6: toUpperCase 转大写', `
let str = 'hello world'
let upper = str.toUpperCase()
return upper
`)

  // Test 7: toLowerCase
  await runTest('测试7: toLowerCase 转小写', `
let str = 'HELLO WORLD'
let lower = str.toLowerCase()
return lower
`)

  // Test 8: String methods chain
  await runTest('测试8: 字符串方法链式调用', `
let str = '  Hello World  '
let result = str.trim().toUpperCase()
return result
`)

  // Test 9: substring
  await runTest('测试9: substring 截取子串', `
let str = 'Hello World'
let sub = str.substring(0, 5)
return sub
`)

  // Test 10: replace
  await runTest('测试10: replace 替换字符串', `
let str = 'Hello World'
let replaced = str.replace('World', 'JavaScript')
return replaced
`)

  // Test 11: split
  await runTest('测试11: split 分割字符串', `
let str = 'apple,banana,orange'
let arr = str.split(',')
return arr
`)

  // Test 12: indexOf
  await runTest('测试12: indexOf 查找索引', `
let str = 'Hello World'
let index = str.indexOf('World')
return index
`)

  // Test 13: includes
  await runTest('测试13: includes 检查包含', `
let str = 'Hello World'
let hasWorld = str.includes('World')
return hasWorld
`)

  // Test 14: startsWith / endsWith
  await runTest('测试14: startsWith / endsWith', `
let str = 'Hello World'
let starts = str.startsWith('Hello')
let ends = str.endsWith('World')
return starts && ends
`)

  // Test 15: concat
  await runTest('测试15: concat 连接字符串', `
let str1 = 'Hello'
let str2 = ' World'
let result = str1.concat(str2)
return result
`)

  // Test 16: padStart / padEnd
  await runTest('测试16: padStart 填充', `
let num = String(5)
let padded = num.padStart(3, '0')
return padded
`)

  // Test 17: repeat
  await runTest('测试17: repeat 重复字符串', `
let str = 'abc'
let repeated = str.repeat(3)
return repeated
`)

  // Test 18: charAt
  await runTest('测试18: charAt 获取字符', `
let str = 'Hello'
let char = str.charAt(0)
return char
`)

  // Test 19: length property
  await runTest('测试19: length 属性', `
let str = 'Hello'
return str.length
`)

  // Test 20: Practical example
  await runTest('测试20: 实际应用示例', `
let deviceName = 'plc-device-01'
let status = 'connected'
let message = 'Device: ' + deviceName.toUpperCase() + ' Status: ' + status.toUpperCase()
console.log(message)
return message
`)

  console.log('\n\n=== 测试完成 ===')
}

runTests().catch(console.error)
