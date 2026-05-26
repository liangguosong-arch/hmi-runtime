# 脚本引擎修复记录

## 修复1: 成员访问解析 (parseMemberExpression)

**问题**: `console.log('hello')` 解析失败，报错 "Unexpected token '.'"

**原因**: `parseUnary()` 调用 `parsePrimary()`，后者解析完标识符后直接返回，没有检查后续的成员访问。

**修复**: 
- 修改 `parseUnary()` 调用 `parseMemberExpression()` 而不是 `parsePrimary()`
- 修改 `parseNewExpression()` 同样调用 `parseMemberExpression()`

**文件**: `src/services/script-engine.ts`
- Line 774-788
- Line 952-969

---

## 修复2: 成员表达式异步执行

**问题**: AST 正确但执行时报错 "Callee is not a function"

**原因**: `evaluateMemberExpression()` 使用同步的 `evaluateExpressionSync()`，后者不支持所有表达式类型（特别是 Identifier）。

**修复**: 
- 将 `evaluateMemberExpression()` 改为异步方法
- 将 `evaluateNewExpression()` 改为异步方法
- 在 `evaluateExpression()` 中添加 `await`

**文件**: `src/services/script-engine.ts`
- Line 1396: 添加 await
- Line 1426: 已有 await
- Line 1573-1583: 改为异步
- Line 1585-1594: 改为异步

---

## 修复3: 增强错误消息

**目的**: 更好地诊断解析错误

**修改**:
- `parsePrimary()`: 显示 token 类型和列号
- `parseStatement()`: 显示期望的内容

**文件**: `src/services/script-engine.ts`
- Line 875: 增强错误消息
- Line 446: 增强错误消息

---

## 已知问题

### 问题: "Unexpected token ',' at line 5"

**状态**: 正在调查中

**可能原因**:
1. JSON 字符串中的 `\n` 没有被正确解析
2. Tokenizer 边界情况
3. Parser 多语句解析问题

**调试步骤**:
1. 启动开发服务器
2. 查看控制台的完整错误消息
3. 添加 Tokenizer 和 Parser 的调试日志
4. 简化脚本逐步测试

---

## 支持的语法

✅ 变量声明 (`let`, `const`)
✅ 赋值表达式
✅ 条件语句 (`if/else`)
✅ 循环语句 (`for`, `while`)
✅ 函数定义和调用
✅ 成员访问 (`obj.prop`, `obj[prop]`)
✅ 链式调用 (`a.b.c()`)
✅ 多参数函数调用 (`func(a, b, c)`)
✅ 数组和对象字面量
✅ try-catch-finally
✅ 一元运算符 (`-`, `!`, `typeof`)

❌ async/await (HTTP 需要使用 `.then()`)
❌ 箭头函数
❌ 解构赋值
❌ 模板字符串
❌ 正则表达式

---

## 测试脚本

以下脚本应该能正常工作：

```javascript
// 基本输出
console.log('hello')

// 变量和运算
let a = 10
let b = 20
let c = a + b
console.log('result:', c)

// 条件
if (c > 25) {
  console.log('greater')
} else {
  console.log('less')
}

// 循环
for (let i = 0; i < 5; i++) {
  console.log(i)
}

// 函数
function add(x, y) {
  return x + y
}
let result = add(3, 4)

// 组件操作
let comp = $page.getComponent('btn1')
if (comp) {
  comp.setText('Hello')
  comp.setColor('#ff0000')
}

// 多参数函数调用
$project.setVariable('count', 0)
$navigation.openPage('page1', { id: 123 })
```

---

## 下一步改进

1. 添加更详细的调试日志
2. 支持 async/await 语法
3. 支持更多 JavaScript 特性
4. 实现断点调试功能
5. 添加单元测试覆盖
