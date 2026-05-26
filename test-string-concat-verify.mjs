// test-string-concat-verify.mjs - Verify string concatenation works correctly

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

async function runTests() {
  console.log('=== 字符串拼接功能验证 ===\n')

  // Test 1: Use return statement
  console.log('测试1: 使用 return 返回字符串拼接结果')
  const code1 = `
let count = 5
return 'clickCount: ' + count
`
  const result1 = await scriptEngine.run(code1, mockContext)
  console.log('代码:', code1.trim())
  console.log('结果:', result1.success ? '✅ 成功' : '❌ 失败')
  if (result1.success) {
    console.log('返回值:', JSON.stringify(result1.returnValue))
    console.log('期望值: "clickCount: 5"')
    console.log('匹配:', result1.returnValue === 'clickCount: 5' ? '✅ 完美!' : '❌')
  } else {
    console.log('错误:', result1.error)
  }
  console.log()

  // Test 2: console.log with concatenation
  console.log('测试2: console.log 输出拼接结果')
  const code2 = `
let count = 42
console.log('clickCount: ' + count)
`
  const result2 = await scriptEngine.run(code2, mockContext)
  console.log('代码:', code2.trim())
  console.log('结果:', result2.success ? '✅ 成功' : '❌ 失败')
  if (result2.success) {
    console.log('✓ 查看上面的 [Script] 输出是否为 "clickCount: 42"')
  }
  console.log()

  // Test 3: Complex concatenation
  console.log('测试3: 复杂拼接')
  const code3 = `
let x = 5
let y = 10
console.log('Sum: ' + (x + y) + ', Product: ' + (x * y))
return 'Result calculated'
`
  const result3 = await scriptEngine.run(code3, mockContext)
  console.log('代码:', code3.trim())
  console.log('结果:', result3.success ? '✅ 成功' : '❌ 失败')
  if (result3.success) {
    console.log('返回值:', result3.returnValue)
    console.log('✓ 查看上面的 [Script] 输出')
  }
  console.log()

  // Test 4: Numeric addition still works
  console.log('测试4: 纯数字相加')
  const code4 = `
let a = 100
let b = 200
return a + b
`
  const result4 = await scriptEngine.run(code4, mockContext)
  console.log('代码:', code4.trim())
  console.log('结果:', result4.success ? '✅ 成功' : '❌ 失败')
  if (result4.success) {
    console.log('返回值:', result4.returnValue)
    console.log('期望值: 300')
    console.log('匹配:', result4.returnValue === 300 ? '✅ 完美!' : '❌')
  }
  console.log()

  // Test 5: Mixed operations
  console.log('测试5: 混合运算')
  const code5 = `
let items = 3
let price = 50
let total = items * price
return 'Total: $' + total
`
  const result5 = await scriptEngine.run(code5, mockContext)
  console.log('代码:', code5.trim())
  console.log('结果:', result5.success ? '✅ 成功' : '❌ 失败')
  if (result5.success) {
    console.log('返回值:', JSON.stringify(result5.returnValue))
    console.log('期望值: "Total: $150"')
    console.log('匹配:', result5.returnValue === 'Total: $150' ? '✅ 完美!' : '❌')
  }
  console.log()

  console.log('\n=== 所有测试完成 ===')
}

runTests().catch(console.error)
