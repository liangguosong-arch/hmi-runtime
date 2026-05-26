// test-debug-string2.mjs - Debug string method calls

import { scriptEngine } from './src/services/script-engine.ts'

const mockContext = {
  $project: { id: 'test', name: 'Test', version: '1.0.0', resolution: { width: 800, height: 600 }, getVariable: () => null, setVariable: () => {}, getResource: () => null },
  $page: { id: 'page1', name: 'Test Page', pageType: 'normal', getProperty: () => null, setProperty: () => {}, getComponent: () => null, getComponents: () => [] },
  $component: null,
  $device: { read: () => null, write: async () => {}, readBatch: () => ({}), writeBatch: async () => {} },
  $http: { get: async () => ({}), post: async () => ({}), put: async () => ({}), delete: async () => ({}) },
  $timer: {},
  $navigation: { openPage: () => {}, closePage: () => {}, back: () => {}, reload: () => {}, getParams: () => ({}) },
  console: { log: (...args) => console.log('[Script]', ...args), warn: (...args) => console.warn('[Script]', ...args), error: (...args) => console.error('[Script]', ...args), info: (...args) => console.info('[Script]', ...args) },
  Math, JSON, Date, parseInt, parseFloat, isNaN, Boolean, String, Number, Array, Object
}

async function debug() {
  console.log('=== 调试字符串方法 ===\n')

  // Test direct string literal method call
  const code1 = `
return 'hello'.toUpperCase()
`
  console.log('测试1: 字符串字面量直接调用方法')
  const result1 = await scriptEngine.run(code1, mockContext)
  if (result1.success) {
    console.log('✅ 成功，返回值:', result1.returnValue)
  } else {
    console.log('❌ 失败:', result1.error)
  }
  console.log()

  // Test with variable
  const code2 = `
let str = 'hello'
return str.toUpperCase()
`
  console.log('测试2: 通过变量调用方法')
  const result2 = await scriptEngine.run(code2, mockContext)
  if (result2.success) {
    console.log('✅ 成功，返回值:', result2.returnValue)
  } else {
    console.log('❌ 失败:', result2.error)
  }
  console.log()

  // Test what value we get
  const code3 = `
let str = 'hello'
console.log('Value:', str)
return str
`
  console.log('测试3: 输出变量值')
  const result3 = await scriptEngine.run(code3, mockContext)
  if (result3.success) {
    console.log('返回值:', JSON.stringify(result3.returnValue))
  }
}

debug().catch(console.error)
