// test-debug-string.mjs - Debug string method calls

import { scriptEngine } from './src/services/script-engine.ts'

const mockContext = {
  $project: {
    id: 'test', name: 'Test', version: '1.0.0',
    resolution: { width: 800, height: 600 },
    getVariable: () => null, setVariable: () => {}, getResource: () => null
  },
  $page: {
    id: 'page1', name: 'Test Page', pageType: 'normal',
    getProperty: () => null, setProperty: () => {},
    getComponent: () => null, getComponents: () => []
  },
  $component: null,
  $device: { read: () => null, write: async () => {}, readBatch: () => ({}), writeBatch: async () => {} },
  $http: { get: async () => ({}), post: async () => ({}), put: async () => ({}), delete: async () => ({}) },
  $timer: {},
  $navigation: { openPage: () => {}, closePage: () => {}, back: () => {}, reload: () => {}, getParams: () => ({}) },
  console: {
    log: (...args) => console.log('[Script]', ...args),
    warn: (...args) => console.warn('[Script]', ...args),
    error: (...args) => console.error('[Script]', ...args),
    info: (...args) => console.info('[Script]', ...args)
  },
  Math, JSON, Date, parseInt, parseFloat, isNaN, Boolean, String, Number, Array, Object
}

async function debug() {
  console.log('=== 调试字符串方法 ===\n')

  // Test what we get when accessing a string variable
  const code1 = `
let str = 'hello'
console.log('str value:', str)
console.log('typeof str:', typeof str)
return str
`
  console.log('测试1: 检查字符串变量')
  const result1 = await scriptEngine.run(code1, mockContext)
  console.log('返回值:', JSON.stringify(result1.returnValue))
  console.log()

  // Test direct string literal method call
  const code2 = `
return 'hello'.toUpperCase()
`
  console.log('测试2: 字符串字面量直接调用方法')
  const result2 = await scriptEngine.run(code2, mockContext)
  if (result2.success) {
    console.log('✅ 成功，返回值:', result2.returnValue)
  } else {
    console.log('❌ 失败:', result2.error)
  }
  console.log()

  // Test with variable
  const code3 = `
let str = 'hello'
return str.toUpperCase()
`
  console.log('测试3: 通过变量调用方法')
  const result3 = await scriptEngine.run(code3, mockContext)
  if (result3.success) {
    console.log('✅ 成功，返回值:', result3.returnValue)
  } else {
    console.log('❌ 失败:', result3.error)
  }
}

debug().catch(console.error)
