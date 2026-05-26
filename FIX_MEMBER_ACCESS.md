# 脚本引擎成员访问解析修复

## 问题描述

在执行脚本 `console.log('hello')` 时，出现错误：
```
Script execution failed: Unexpected token '.' at line 1
```

## 问题分析

### Token 化结果
代码 `console.log('hello')` 被正确分词为：
1. `{ type: 'Identifier', value: 'console' }`
2. `{ type: 'Punctuator', value: '.' }`
3. `{ type: 'Identifier', value: 'log' }`
4. `{ type: 'Punctuator', value: '(' }`
5. `{ type: 'String', value: 'hello' }`
6. `{ type: 'Punctuator', value: ')' }`

Token 化是正确的。

### Parser 问题

原来的调用链：
```
parseExpression()
  → parseAssignment()
    → parseLogicalOr()
      → ... (多层表达式解析)
        → parseUnary()
          → parsePrimary()  // ← 问题在这里
```

在 `parsePrimary()` 中：
```typescript
// Identifier
if (token.type === 'Identifier') {
  this.consume()
  return {
    type: 'Identifier',
    name: token.value
  }
}
```

**问题**：解析完标识符 `console` 后直接返回，没有检查后面是否有成员访问（`.`）或函数调用（`(`）。

因此 AST 只生成了：
```json
{
  "type": "ExpressionStatement",
  "expression": {
    "type": "Identifier",
    "name": "console"
  }
}
```

然后 Parser 继续处理下一个 token `.`，但此时已经不在表达式解析的上下文中，导致错误。

## 解决方案

修改 `parseUnary()` 方法，让它调用 `parseMemberExpression()` 而不是 `parsePrimary()`：

### 修复前
```typescript
private parseUnary(): ExpressionNode {
  if (this.match('Operator') && ['-', '!', 'typeof', 'void', 'delete'].includes(this.currentToken().value)) {
    const operator = this.consume('Operator').value
    const argument = this.parseUnary()  // ← 递归调用自己
    return {
      type: 'UnaryExpression',
      operator,
      argument,
      prefix: true
    }
  }

  return this.parsePrimary()  // ← 问题：不处理成员访问
}
```

### 修复后
```typescript
private parseUnary(): ExpressionNode {
  if (this.match('Operator') && ['-', '!', 'typeof', 'void', 'delete'].includes(this.currentToken().value)) {
    const operator = this.consume('Operator').value
    const argument = this.parseMemberExpression()  // ← 改为调用 parseMemberExpression
    return {
      type: 'UnaryExpression',
      operator,
      argument,
      prefix: true
    }
  }

  return this.parseMemberExpression()  // ← 关键修复：调用 parseMemberExpression
}
```

同时修复 `parseNewExpression()`：
```typescript
private parseNewExpression(): ExpressionNode {
  this.consume('Keyword', 'new')
  const callee = this.parseMemberExpression()  // ← 也改为 parseMemberExpression
  // ...
}
```

## parseMemberExpression() 的工作原理

```typescript
private parseMemberExpression(): ExpressionNode {
  // 1. 先解析基础表达式（标识符、字面量等）
  let expr = this.parsePrimary()

  // 2. 循环检查是否有成员访问或函数调用
  while (
    this.match('Punctuator', '.') ||
    this.match('Punctuator', '[') ||
    this.match('Punctuator', '(')
  ) {
    // 成员访问: obj.prop
    if (this.match('Punctuator', '.')) {
      this.consume()
      const property = this.consume('Identifier')
      expr = {
        type: 'MemberExpression',
        object: expr,
        property: { type: 'Identifier', name: property.value },
        computed: false
      }
    }
    // 成员访问: obj[prop]
    else if (this.match('Punctuator', '[')) {
      this.consume()
      const property = this.parseExpression()
      this.consume('Punctuator', ']')
      expr = {
        type: 'MemberExpression',
        object: expr,
        property,
        computed: true
      }
    }
    // 函数调用: func(args)
    else if (this.match('Punctuator', '(')) {
      this.consume()
      const args = []
      if (!this.match('Punctuator', ')')) {
        do {
          args.push(this.parseExpression())
        } while (this.match('Punctuator', ','))
      }
      this.consume('Punctuator', ')')
      expr = {
        type: 'CallExpression',
        callee: expr,
        arguments: args
      }
    }
  }

  return expr
}
```

## 修复后的 AST

对于 `console.log('hello')`，现在会生成正确的 AST：

```json
{
  "type": "ExpressionStatement",
  "expression": {
    "type": "CallExpression",
    "callee": {
      "type": "MemberExpression",
      "object": {
        "type": "Identifier",
        "name": "console"
      },
      "property": {
        "type": "Identifier",
        "name": "log"
      },
      "computed": false
    },
    "arguments": [
      {
        "type": "Literal",
        "value": "hello"
      }
    ]
  }
}
```

## 测试用例

以下脚本现在都能正常工作：

```javascript
// 1. 基本成员访问和函数调用
console.log('hello')

// 2. 链式成员访问
$page.getComponent('btn1').setText('Hello')

// 3. 嵌套调用
$device.read('D100')

// 4. 多重成员访问
obj.prop1.prop2.prop3

// 5. 带参数的函数调用
$navigation.openPage('page1', { id: 123 })
```

## 文件修改

- `src/services/script-engine.ts`
  - 修改 `parseUnary()` 方法（第 774-788 行）
  - 修改 `parseNewExpression()` 方法（第 952-969 行）

## 总结

这是一个经典的递归下降解析器问题。关键在于理解表达式解析的层次结构：

```
Expression (最高层)
  → Assignment
    → LogicalOr
      → LogicalAnd
        → Equality
          → Comparison
            → Addition
              → Multiplication
                → Unary
                  → MemberExpression  ← 必须在这里处理成员访问
                    → Primary (最低层)
```

`parseMemberExpression()` 充当了"后缀表达式"处理器，它在基础表达式（Primary）之上处理所有的后缀操作（成员访问、函数调用）。
