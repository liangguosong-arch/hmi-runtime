# 脚本引擎修复总结

## 问题1: 成员访问解析错误

### 症状
执行 `console.log('hello')` 时报错：
```
Unexpected token '.' at line 1
```

### 原因
`parseUnary()` 调用 `parsePrimary()`，后者解析完标识符后直接返回，没有检查后续的成员访问（`.`）或函数调用（`(`）。

### 修复
修改 `parseUnary()` 和 `parseNewExpression()`，让它们调用 `parseMemberExpression()` 而不是 `parsePrimary()`。

**文件**: `src/services/script-engine.ts`
- 第 774-788 行：`parseUnary()` 
- 第 952-969 行：`parseNewExpression()`

---

## 问题2: 成员表达式执行错误

### 症状
AST 生成正确，但执行时报错：
```
Callee is not a function
```

### 原因
`evaluateMemberExpression()` 是同步方法，使用 `evaluateExpressionSync()` 来解析对象和属性。但 `evaluateExpressionSync()` 不支持所有表达式类型（特别是 `Identifier`），导致无法正确获取 `console` 对象。

例如，对于 `console.log`：
1. `evaluateMemberExpression()` 被调用
2. 它尝试用 `evaluateExpressionSync({ type: 'Identifier', name: 'console' })` 
3. 但 `evaluateExpressionSync()` 没有处理 `Identifier` 的情况
4. 抛出异常或返回 undefined
5. 最终 `console.log` 变成 `undefined.log`，不是函数

### 修复
将 `evaluateMemberExpression()` 和 `evaluateNewExpression()` 改为异步方法，使用 `evaluateExpression()` 而不是 `evaluateExpressionSync()`。

**文件**: `src/services/script-engine.ts`

修改前：
```typescript
private evaluateMemberExpression(node: any): any {
  const object = this.evaluateExpressionSync(node.object)
  // ...
}

private evaluateNewExpression(node: any): any {
  const callee = this.evaluateExpressionSync(node.callee)
  // ...
}
```

修改后：
```typescript
private async evaluateMemberExpression(node: any): Promise<any> {
  const object = await this.evaluateExpression(node.object)
  // ...
}

private async evaluateNewExpression(node: any): Promise<any> {
  const callee = await this.evaluateExpression(node.callee)
  // ...
}
```

同时在 `evaluateExpression()` 中添加 `await`：
```typescript
case 'MemberExpression':
  return await this.evaluateMemberExpression(node)

case 'NewExpression':
  return await this.evaluateNewExpression(node)
```

---

## 测试用例

以下脚本现在应该都能正常工作：

```javascript
// 1. 基本的 console.log
console.log('hello')
console.log('测试页面已打开')

// 2. 链式成员访问
$page.getComponent('btn1').setText('Hello')

// 3. 嵌套调用
$device.read('D100')

// 4. 多重成员访问
obj.prop1.prop2

// 5. 带参数的函数调用
$navigation.openPage('page1', { id: 123 })
```

---

## 关键教训

在实现递归下降解释器时：

1. **表达式解析层次**：必须正确处理从 Primary → MemberExpression → Unary → ... → Expression 的层次
2. **异步一致性**：如果主评估函数是异步的，所有子表达式评估也必须是异步的
3. **避免混用同步/异步**：不要在同一评估路径上混用 `evaluateExpression()` 和 `evaluateExpressionSync()`

---

## 文件修改清单

- `src/services/script-engine.ts`
  - Line 774-788: `parseUnary()` - 改为调用 `parseMemberExpression()`
  - Line 952-969: `parseNewExpression()` - 改为调用 `parseMemberExpression()`
  - Line 1396: `evaluateExpression()` - 添加 `await` 到 `evaluateMemberExpression()`
  - Line 1426: `evaluateExpression()` - 已有 `await` 到 `evaluateNewExpression()`
  - Line 1573-1583: `evaluateMemberExpression()` - 改为异步方法
  - Line 1585-1594: `evaluateNewExpression()` - 改为异步方法
