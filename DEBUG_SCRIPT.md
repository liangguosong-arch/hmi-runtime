# 脚本引擎调试指南

## 如何调试脚本解析错误

当遇到 "Unexpected token" 错误时，请按照以下步骤进行调试：

### 1. 查看完整的错误消息

新的错误消息格式：
```
Unexpected token ',' (Punctuator) at line 5, column 30. Expected: statement
```

这告诉我们：
- Token 值：`,`
- Token 类型：`Punctuator`
- 位置：第 5 行，第 30 列
- 期望的内容：statement（语句）

### 2. 检查脚本内容

在 PageRenderer.vue 或 BaseComponent.vue 中添加日志：

```typescript
console.log('[Debug] Script code:', script)
console.log('[Debug] Script length:', script.length)
```

### 3. 检查 Token 序列

在 script-engine.ts 的 `tokenize()` 方法末尾添加：

```typescript
console.log('[Lexer] Tokens:')
this.tokens.forEach((t, i) => {
  console.log(`  ${i}: { type: '${t.type}', value: '${t.value}', line: ${t.line}, col: ${t.column} }`)
})
```

### 4. 检查 Parser 状态

在 `parseStatement()` 开头添加：

```typescript
console.log('[Parser] parseStatement - current token:', this.currentToken())
```

### 5. 简化脚本测试

从最简单的脚本开始：
```javascript
console.log('hello')
```

如果这个能工作，逐步增加复杂度：
```javascript
console.log('hello');
let x = 0;
$project.setVariable('key', 0);
$project.setVariable('key', x);
```

### 6. 常见问题排查

#### 问题：注释后的代码不被执行
**原因**：`\n` 没有被正确解析为换行符
**解决**：确保 `.hmi` 文件是有效的 JSON，JSON.parse 会自动处理 `\n`

#### 问题：多参数函数调用失败
**原因**：参数解析逻辑有误
**解决**：检查 `parseMemberExpression()` 中的参数解析循环

#### 问题：分号导致错误
**原因**：分号没有被正确消费
**解决**：检查 `parseStatement()` 中的分号处理

### 7. 报告问题时提供的信息

当您报告脚本解析问题时，请提供：
1. 完整的脚本内容
2. 完整的错误消息（包括行号和列号）
3. `.hmi` 文件中的脚本字段（JSON 格式）
4. 控制台的调试输出（如果有）
