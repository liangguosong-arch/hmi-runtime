/**
 * 脚本系统测试文件
 * 用于验证脚本引擎的核心功能
 */

// 导入脚本引擎
import { scriptEngine } from './src/services/script-engine.ts'
import { buildScriptContext } from './src/services/script-context.ts'

// 模拟项目数据
const mockProject = {
  id: 'test-project',
  name: 'Test Project',
  version: '1.0.0',
  resolution: { width: 1024, height: 768 },
  pages: [],
  currentPageId: '',
  status: 'CLEAN'
}

// 模拟页面数据
const mockPage = {
  id: 'page-1',
  name: 'Test Page',
  pageType: 'normal',
  components: [
    {
      id: 'comp-1',
      type: 'TextDisplay',
      name: 'TestComponent',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      properties: {
        text: 'Hello',
        value: 42
      },
      visible: true
    }
  ],
  properties: {
    backgroundColor: { useTheme: true, themeColorKey: 'white' }
  },
  status: 'CLEAN'
}

// 测试用例
async function runTests() {
  console.log('=== 脚本系统测试开始 ===\n')

  // 测试 1: 基本变量和运算
  console.log('测试 1: 基本变量和运算')
  const test1 = `
    let a = 10
    let b = 20
    let c = a + b
    console.log('a + b =', c)
    c
  `
  const context1 = buildScriptContext(mockProject, mockPage)
  const result1 = await scriptEngine.run(test1, context1)
  console.log('结果:', result1)
  console.log('期望: 30')
  console.log('通过:', result1.success && result1.returnValue === 30 ? '✓' : '✗')
  console.log()

  // 测试 2: 条件语句
  console.log('测试 2: 条件语句')
  const test2 = `
    let x = 15
    let result = ''
    if (x > 10) {
      result = 'greater'
    } else {
      result = 'less'
    }
    result
  `
  const result2 = await scriptEngine.run(test2, context1)
  console.log('结果:', result2.returnValue)
  console.log('期望: greater')
  console.log('通过:', result2.success && result2.returnValue === 'greater' ? '✓' : '✗')
  console.log()

  // 测试 3: 循环语句
  console.log('测试 3: 循环语句')
  const test3 = `
    let sum = 0
    for (let i = 1; i <= 5; i++) {
      sum = sum + i
    }
    sum
  `
  const result3 = await scriptEngine.run(test3, context1)
  console.log('结果:', result3.returnValue)
  console.log('期望: 15 (1+2+3+4+5)')
  console.log('通过:', result3.success && result3.returnValue === 15 ? '✓' : '✗')
  console.log()

  // 测试 4: 函数定义和调用
  console.log('测试 4: 函数定义和调用')
  const test4 = `
    function add(a, b) {
      return a + b
    }
    let result = add(7, 8)
    result
  `
  const result4 = await scriptEngine.run(test4, context1)
  console.log('结果:', result4.returnValue)
  console.log('期望: 15')
  console.log('通过:', result4.success && result4.returnValue === 15 ? '✓' : '✗')
  console.log()

  // 测试 5: 组件 API
  console.log('测试 5: 组件 API')
  const test5 = `
    let comp = $page.getComponent('comp-1')
    if (comp) {
      let text = comp.getText()
      comp.setText('Updated: ' + text)
      comp.getText()
    } else {
      'Component not found'
    }
  `
  const result5 = await scriptEngine.run(test5, context1)
  console.log('结果:', result5.returnValue)
  console.log('期望: Updated: Hello')
  console.log('通过:', result5.success && result5.returnValue === 'Updated: Hello' ? '✓' : '✗')
  console.log()

  // 测试 6: 错误处理
  console.log('测试 6: 错误处理')
  const test6 = `
    try {
      let x = undefinedVariable
      throw new Error('Test error')
    } catch (e) {
      'Caught error: ' + e
    }
  `
  const result6 = await scriptEngine.run(test6, context1)
  console.log('结果:', result6.success)
  console.log('期望: true (错误被捕获)')
  console.log('通过:', result6.success ? '✓' : '✗')
  console.log()

  console.log('=== 测试完成 ===')
}

// 运行测试
runTests().catch(console.error)
