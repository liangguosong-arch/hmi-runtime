# Runtime 脚本系统

## 概述

Runtime 脚本系统为 HMI 页面和组件提供了强大的脚本执行能力，允许在事件触发时执行自定义逻辑。

## 特性

✅ **类 JavaScript 语法** - 支持变量、条件、循环、函数等标准语法
✅ **事件驱动** - 页面打开/关闭、组件点击等事件触发脚本执行
✅ **丰富的 API** - 提供项目、页面、组件、设备、HTTP、导航等 API
✅ **安全沙箱** - 脚本在隔离环境中执行，无法访问危险 API
✅ **错误处理** - 完善的错误捕获和 UI 显示
✅ **性能保护** - 执行超时和步数限制防止死循环
✅ **AST 缓存** - 编译后的 AST 被缓存以提高性能

## 快速开始

### 1. 在页面中添加事件脚本

在页面的 `events` 属性中定义脚本：

```json
{
  "pages": [
    {
      "id": "page1",
      "name": "页面1",
      "events": {
        "onOpen": "console.log('页面打开');",
        "onClose": "console.log('页面关闭');"
      }
    }
  ]
}
```

### 2. 在组件中添加事件脚本

在组件的 `events` 属性中定义脚本：

```json
{
  "components": [
    {
      "id": "btn1",
      "type": "Button",
      "events": {
        "onClick": "console.log('按钮被点击');"
      }
    }
  ]
}
```

## 测试

运行开发服务器并加载测试项目：

```bash
npm run dev
```

然后在浏览器中打开 `http://localhost:3000`，加载 `public/test-script.hmi` 文件进行测试。

## 文档

- [使用示例](SCRIPT_EXAMPLES.md) - 详细的代码示例
- [API 参考](SCRIPT_EXAMPLES.md#api-参考) - 完整的 API 文档

## 架构

脚本系统由以下模块组成：

1. **Lexer** - 词法分析器，将源代码转换为 Token 流
2. **Parser** - 语法分析器，将 Token 流转换为 AST
3. **Interpreter** - 解释器，执行 AST 节点
4. **Script Context** - 脚本上下文，提供沙箱环境和 API
5. **Navigation Service** - 导航服务，管理页面历史

## 支持的语法

- ✅ 变量声明 (`let`, `const`)
- ✅ 赋值表达式 (`=`, `+=`, `-=`, `*=`, `/=`)
- ✅ 条件语句 (`if/else`)
- ✅ 循环语句 (`for`, `while`)
- ✅ 函数定义和调用
- ✅ 二元运算 (`+`, `-`, `*`, `/`, `%`, `==`, `!=`, `<`, `>`, `<=`, `>=`)
- ✅ 逻辑运算 (`&&`, `||`, `!`)
- ✅ 成员访问 (`obj.prop`, `obj[prop]`)
- ✅ 数组和对象字面量
- ✅ try-catch-finally 错误处理
- ✅ return, break, continue 控制流

## 限制

- ❌ 不支持 `async/await`（HTTP API 返回 Promise，但需要使用 `.then()` 回调）
- ❌ 不支持 ES6+ 新特性（箭头函数、解构赋值等）
- ❌ 不支持正则表达式
- ❌ 不支持模板字符串

## 性能

- AST 缓存：相同代码只编译一次
- 执行超时：默认 5 秒
- 步数限制：默认 100,000 步

## 安全性

脚本系统在沙箱环境中执行：
- 只能访问提供的 API 对象
- 无法访问 `window`、`document` 等全局对象
- 无法执行 `eval`、`Function` 等危险函数
- 执行时间和步数受限

## 调试

脚本错误会在 UI 上显示，同时输出到控制台：

```javascript
console.log("调试信息")  // 输出到控制台
console.error("错误信息") // 输出错误
```

## 未来改进

- [ ] 支持更多 JavaScript 语法特性
- [ ] 添加断点调试功能
- [ ] 支持异步/等待语法
- [ ] 提供脚本编辑器
- [ ] 添加脚本性能分析
- [ ] 支持脚本热重载
