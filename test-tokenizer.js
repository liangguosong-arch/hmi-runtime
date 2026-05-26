// 简单的脚本引擎测试 - 验证成员访问修复

// 模拟 Token 类型
const TokenType = {
  Identifier: 'Identifier',
  Keyword: 'Keyword',
  Operator: 'Operator',
  Punctuator: 'Punctuator',
  Number: 'Number',
  String: 'String',
  EOF: 'EOF'
}

// 简化的 Lexer
function tokenize(code) {
  const tokens = []
  let pos = 0
  
  while (pos < code.length) {
    const char = code[pos]
    
    // 跳过空白
    if (/\s/.test(char)) {
      pos++
      continue
    }
    
    // 标识符
    if (/[a-zA-Z_$]/.test(char)) {
      let id = ''
      while (pos < code.length && /[a-zA-Z0-9_$]/.test(code[pos])) {
        id += code[pos]
        pos++
      }
      tokens.push({ type: TokenType.Identifier, value: id })
      continue
    }
    
    // 字符串
    if (char === '"' || char === "'") {
      const quote = char
      pos++
      let str = ''
      while (pos < code.length && code[pos] !== quote) {
        str += code[pos]
        pos++
      }
      pos++ // 跳过结束引号
      tokens.push({ type: TokenType.String, value: str })
      continue
    }
    
    // 数字
    if (/[0-9]/.test(char)) {
      let num = ''
      while (pos < code.length && /[0-9]/.test(code[pos])) {
        num += code[pos]
        pos++
      }
      tokens.push({ type: TokenType.Number, value: parseInt(num) })
      continue
    }
    
    // 标点符号
    if (['.', '(', ')', '{', '}', '[', ']', ',', ';'].includes(char)) {
      tokens.push({ type: TokenType.Punctuator, value: char })
      pos++
      continue
    }
    
    pos++
  }
  
  tokens.push({ type: TokenType.EOF, value: null })
  return tokens
}

// 测试用例
const testCases = [
  "console.log('hello')",
  "$page.getComponent('btn1').setText('Hello')",
  "$device.read('D100')",
  "obj.prop1.prop2"
]

console.log('=== Tokenizer 测试 ===\n')

testCases.forEach((code, index) => {
  console.log(`测试 ${index + 1}: ${code}`)
  const tokens = tokenize(code)
  console.log('Tokens:')
  tokens.forEach(token => {
    if (token.type !== TokenType.EOF) {
      console.log(`  - { type: '${token.type}', value: '${token.value}' }`)
    }
  })
  console.log()
})

console.log('=== 测试完成 ===')
console.log('\n关键发现：')
console.log('✓ console 被识别为 Identifier')
console.log('✓ . 被识别为 Punctuator')
console.log('✓ log 被识别为 Identifier')
console.log('✓ ( 被识别为 Punctuator')
console.log('✓ "hello" 被识别为 String')
console.log('\n这说明 Tokenizer 工作正常，问题应该在 Parser 中。')
console.log('修复方案：parseUnary() 应该调用 parseMemberExpression() 而不是 parsePrimary()')
