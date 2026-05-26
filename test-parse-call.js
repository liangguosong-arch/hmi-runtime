// 测试脚本解析
const code = `$project.setVariable('clickCount', 0)`

// 预期的 Token 序列应该是：
// Identifier: $project
// Punctuator: .
// Identifier: setVariable
// Punctuator: (
// String: clickCount
// Punctuator: ,
// Number: 0
// Punctuator: )

console.log('测试代码:', code)
console.log('\n这个脚本应该被解析为：')
console.log('CallExpression {')
console.log('  callee: MemberExpression {')
console.log('    object: Identifier($project)')
console.log('    property: Identifier(setVariable)')
console.log('  }')
console.log('  arguments: [')
console.log('    Literal("clickCount"),')
console.log('    Literal(0)')
console.log('  ]')
console.log('}')
