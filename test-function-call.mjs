import { scriptEngine } from './src/services/script-engine.js'
import { buildScriptContext } from './src/services/script-context.js'

// 模拟数据
const mockProject = {
  id: 'test',
  name: 'Test',
  version: '1.0.0',
  resolution: { width: 1024, height: 768 },
  pages: [{
    id: 'page1',
    name: 'Page1',
    pageType: 'normal',
    components: [{
      id: 'txt_status',
      type: 'TextDisplay',
      name: 'StatusText',
      x: 0, y: 0, width: 100, height: 30,
      properties: { text: 'Hello' },
      visible: true
    }],
    properties: { backgroundColor: { useTheme: true, themeColorKey: 'white' } },
    status: 'CLEAN'
  }],
  currentPageId: 'page1',
  status: 'CLEAN'
}

const mockPage = mockProject.pages[0]

async function test() {
  console.log('=== 测试函数调用参数解析 ===\n')
  
  const scripts = [
    "console.log('hello')",
    "$project.setVariable('clickCount', 0)",
    `$project.setVariable('clickCount', 0);`,
    `let x = 0;`,
    `if (true) { console.log('test'); }`
  ]
  
  for (const script of scripts) {
    console.log(`测试: ${script}`)
    try {
      const context = buildScriptContext(mockProject, mockPage)
      const result = await scriptEngine.run(script, context)
      if (result.success) {
        console.log('✓ 成功')
      } else {
        console.log('✗ 失败:', result.error)
      }
    } catch (error) {
      console.log('✗ 异常:', error.message)
    }
    console.log()
  }
}

test().catch(console.error)
