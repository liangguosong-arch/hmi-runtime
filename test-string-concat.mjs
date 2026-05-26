// test-string-concat.mjs - Test string concatenation in script engine

import { scriptEngine } from './src/services/script-engine.ts'

// Mock context
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

async function runTests() {
  console.log('=== 字符串拼接测试 ===\n')

  // Test 1: String + Number
  console.log('测试1: 字符串 + 数字')
  const code1 = `
let count = 5
let message = 'clickCount: ' + count
message
`
  const result1 = await scriptEngine.run(code1, mockContext)
  console.log('代码:', code1.trim())
  console.log('结果:', result1.success ? '✅ 成功' : '❌ 失败')
  if (result1.success) {
    console.log('返回值:', result1.returnValue)
    console.log('期望值: "clickCount: 5"')
    console.log('匹配:', result1.returnValue === 'clickCount: 5' ? '✅' : '❌')
  } else {
    console.log('错误:', result1.error)
  }
  console.log()

  // Test 2: Number + String
  console.log('测试2: 数字 + 字符串')
  const code2 = `
let count = 10
let message = count + ' items'
message
`
  const result2 = await scriptEngine.run(code2, mockContext)
  console.log('代码:', code2.trim())
  console.log('结果:', result2.success ? '✅ 成功' : '❌ 失败')
  if (result2.success) {
    console.log('返回值:', result2.returnValue)
    console.log('期望值: "10 items"')
    console.log('匹配:', result2.returnValue === '10 items' ? '✅' : '❌')
  } else {
    console.log('错误:', result2.error)
  }
  console.log()

  // Test 3: Multiple concatenations
  console.log('测试3: 多个拼接')
  const code3 = `
let name = 'Alice'
let age = 25
let message = 'Name: ' + name + ', Age: ' + age + ' years'
message
`
  const result3 = await scriptEngine.run(code3, mockContext)
  console.log('代码:', code3.trim())
  console.log('结果:', result3.success ? '✅ 成功' : '❌ 失败')
  if (result3.success) {
    console.log('返回值:', result3.returnValue)
    console.log('期望值: "Name: Alice, Age: 25 years"')
    console.log('匹配:', result3.returnValue === 'Name: Alice, Age: 25 years' ? '✅' : '❌')
  } else {
    console.log('错误:', result3.error)
  }
  console.log()

  // Test 4: console.log with concatenation
  console.log('测试4: console.log 输出')
  const code4 = `
let count = 42
console.log('clickCount: ' + count)
`
  const result4 = await scriptEngine.run(code4, mockContext)
  console.log('代码:', code4.trim())
  console.log('结果:', result4.success ? '✅ 成功' : '❌ 失败')
  if (result4.success) {
    console.log('执行时间:', result4.executionTime?.toFixed(2), 'ms')
  } else {
    console.log('错误:', result4.error)
  }
  console.log()

  // Test 5: Numeric addition still works
  console.log('测试5: 纯数字相加（确保没有被破坏）')
  const code5 = `
let x = 5
let y = 10
let sum = x + y
sum
`
  const result5 = await scriptEngine.run(code5, mockContext)
  console.log('代码:', code5.trim())
  console.log('结果:', result5.success ? '✅ 成功' : '❌ 失败')
  if (result5.success) {
    console.log('返回值:', result5.returnValue)
    console.log('期望值: 15')
    console.log('匹配:', result5.returnValue === 15 ? '✅' : '❌')
  } else {
    console.log('错误:', result5.error)
  }
  console.log()

  // Test 6: Parenthesized numeric addition in string context
  console.log('测试6: 括号内的数字相加在字符串中')
  const code6 = `
let x = 5
let y = 10
let message = 'Sum: ' + (x + y)
message
`
  const result6 = await scriptEngine.run(code6, mockContext)
  console.log('代码:', code6.trim())
  console.log('结果:', result6.success ? '✅ 成功' : '❌ 失败')
  if (result6.success) {
    console.log('返回值:', result6.returnValue)
    console.log('期望值: "Sum: 15"')
    console.log('匹配:', result6.returnValue === 'Sum: 15' ? '✅' : '❌')
  } else {
    console.log('错误:', result6.error)
  }
  console.log()

  console.log('\n=== 测试完成 ===')
}

runTests().catch(console.error)
