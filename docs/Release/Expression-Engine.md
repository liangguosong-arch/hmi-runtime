# HMI 表达式引擎使用指南

## 概述

HMI 表达式引擎是一个基于 AST（抽象语法树）的表达式解析和求值系统，支持在运行时动态计算表达式。它提供了丰富的运算符支持和变量引用功能，适用于各种数据绑定和条件判断场景。

---

## 基本语法

### 1. 变量引用

使用 `${variableName}` 语法引用上下文中的变量：

```javascript
// 引用单个变量
${temperature}

// 在表达式中使用
${temperature} > 100

// 多个变量组合
${pressure} * ${volume}
```

**注意：** 变量名不能包含空格或特殊字符（除了下划线）。

---

### 2. 字面量

#### 数字字面量
```javascript
42          // 整数
3.14        // 浮点数
-10         // 负数
```

#### 字符串字面量
```javascript
"Hello"     // 双引号字符串
'World'     // 单引号字符串
```

#### 布尔字面量
```javascript
true
false
```

---

## 运算符

### 算术运算符

| 运算符 | 说明 | 示例 | 结果 |
|--------|------|------|------|
| `+` | 加法 | `${a} + ${b}` | 两数之和 |
| `-` | 减法 | `${a} - ${b}` | 两数之差 |
| `*` | 乘法 | `${a} * ${b}` | 两数之积 |
| `/` | 除法 | `${a} / ${b}` | 两数之商 |
| `-` (一元) | 取负 | `-${value}` | 值的相反数 |

**示例：**
```javascript
// 计算温度转换
${celsius} * 9 / 5 + 32

// 计算平均值
(${value1} + ${value2} + ${value3}) / 3
```

---

### 比较运算符

| 运算符 | 说明 | 示例 | 结果类型 |
|--------|------|------|----------|
| `==` | 等于 | `${temp} == 100` | boolean |
| `!=` | 不等于 | `${status} != 0` | boolean |
| `>` | 大于 | `${pressure} > 50` | boolean |
| `<` | 小于 | `${level} < 10` | boolean |
| `>=` | 大于等于 | `${speed} >= 60` | boolean |
| `<=` | 小于等于 | `${count} <= 100` | boolean |

**示例：**
```javascript
// 温度报警判断
${temperature} > 80

// 状态检查
${deviceStatus} == 1

// 范围检查
${value} >= 0 && ${value} <= 100
```

---

### 逻辑运算符

| 运算符 | 说明 | 示例 | 短路求值 |
|--------|------|------|----------|
| `&&` | 逻辑与 | `${a} > 0 && ${b} < 100` | 是 |
| `\|\|` | 逻辑或 | `${error} \|\| ${warning}` | 是 |

**示例：**
```javascript
// 多条件判断
${temperature} > 80 && ${pressure} > 50

// 故障检测
${sensor1Failed} || ${sensor2Failed} || ${sensor3Failed}

// 复合条件
(${age} >= 18 && ${hasLicense}) || ${hasSpecialPermit}
```

---

### 条件运算符（三元运算符）

语法：`condition ? consequent : alternate`

**示例：**
```javascript
// 根据温度显示状态
${temperature} > 100 ? "过热" : "正常"

// 数值映射
${score} >= 60 ? "及格" : "不及格"

// 嵌套条件
${level} == 1 ? "低" : (${level} == 2 ? "中" : "高")

// 结合变量使用
${isAlarm} ? ${alarmMessage} : "系统正常"
```

---

## 运算符优先级

从高到低：

1. **括号** `()`
2. **一元运算符** `-`（取负）
3. **乘除** `*`, `/`
4. **加减** `+`, `-`
5. **比较** `>`, `<`, `>=`, `<=`
6. **相等性** `==`, `!=`
7. **逻辑与** `&&`
8. **逻辑或** `||`
9. **条件运算符** `? :`

**示例：**
```javascript
// 乘法优先于加法
${a} + ${b} * ${c}        // 等价于 ${a} + (${b} * ${c})

// 使用括号改变优先级
(${a} + ${b}) * ${c}

// 逻辑运算符优先级
${a} > 0 && ${b} < 100 || ${c} == 5
// 等价于: ((${a} > 0) && (${b} < 100)) || (${c} == 5)
```

---

## 高级用法

### 1. 复杂表达式

```javascript
// 工业场景：泵控制逻辑
${pressure} > 100 && ${temperature} < 80 && ${valveOpen} ? 1 : 0

// 数据验证
${value} >= ${minLimit} && ${value} <= ${maxLimit} ? "合格" : "不合格"

// 多状态映射
${status} == 0 ? "待机" : (${status} == 1 ? "运行" : (${status} == 2 ? "故障" : "未知"))
```

### 2. 字符串处理

```javascript
// 字符串比较
${deviceName} == "Pump-01"

// 条件文本显示
${alarmActive} ? "⚠ 报警" : "✓ 正常"
```

### 3. 数值计算

```javascript
// 百分比计算
${current} / ${max} * 100

// 单位转换
${distanceKm} * 1000  // km 转 m

// 累积计算
${baseValue} + ${offset} * ${multiplier}
```

---

## 性能优化

### AST 缓存机制

表达式引擎会自动缓存已解析的 AST（抽象语法树），相同表达式只需解析一次：

```javascript
// 第一次：解析 + 求值
evaluate("${temperature} > 100", context)

// 第二次：直接使用缓存的 AST，仅求值
evaluate("${temperature} > 100", context)  // 更快！
```

**建议：**
- 避免动态拼接表达式字符串
- 复用相同的表达式模板
- 不要在循环中创建新表达式

---

## 错误处理

### 常见错误

1. **语法错误**
   ```javascript
   // 错误：缺少右括号
   ${a} + ${b
   
   // 错误：无效的操作符
   ${a} ** ${b}
   ```

2. **变量未定义**
   ```javascript
   // 如果 context 中没有 'undefinedVar'，返回 null
   ${undefinedVar} + 10  // 结果：null
   ```

3. **类型转换**
   ```javascript
   // 非数字值参与算术运算时转换为 0
   ${textValue} + 10  // 如果 textValue 不是数字，结果为 10
   ```

### 调试技巧

```javascript
// 使用依赖提取功能查看表达式引用的变量
const deps = expressionEngine.extractDependencies("${a} + ${b} * ${c}")
// 结果: ['a', 'b', 'c']

// 分步测试复杂表达式
// 先测试子表达式
evaluate("${a} > 0", context)
// 再测试完整表达式
evaluate("${a} > 0 && ${b} < 100", context)
```

---

## 实际应用示例

### 场景 1：报警显示

```javascript
// 可见性控制
${temperature} > 80 || ${pressure} > 100

// 报警文本
${temperature} > 100 ? "严重高温" : (${temperature} > 80 ? "高温警告" : "")

// 颜色控制
${temperature} > 100 ? "red" : (${temperature} > 80 ? "orange" : "green")
```

### 场景 2：进度条

```javascript
// 进度百分比
${currentStep} / ${totalSteps} * 100

// 进度文本
"进度: " + ${currentStep} + "/" + ${totalSteps}
```

### 场景 3：设备状态

```javascript
// 状态文本映射
${statusCode} == 0 ? "离线" : (${statusCode} == 1 ? "在线" : "故障")

// 启用/禁用控制
${maintenanceMode} == false && ${emergencyStop} == false
```

### 场景 4：数据格式化

```javascript
// 条件单位显示
${value} >= 1000 ? ${value} / 1000 + "k" : ${value}

// 正负号显示
${value} > 0 ? "+" + ${value} : ${value}
```

---

## 最佳实践

### ✅ 推荐做法

1. **使用括号提高可读性**
   ```javascript
   // 好
   (${a} + ${b}) * (${c} - ${d})
   
   // 不好
   ${a} + ${b} * ${c} - ${d}
   ```

2. **避免过深的嵌套**
   ```javascript
   // 好：拆分为多个简单表达式
   isVisible: ${temperature} > 80
   textColor: ${temperature} > 100 ? "red" : "orange"
   
   // 不好：三层嵌套
   ${a} ? (${b} ? (${c} ? "X" : "Y") : "Z") : "W"
   ```

3. **合理使用变量命名**
   ```javascript
   // 好：语义清晰
   ${motorTemperature} > ${maxTemperature}
   
   // 不好：含义不明
   ${t1} > ${t2}
   ```

4. **利用缓存机制**
   ```javascript
   // 好：固定表达式
   binding: "${value} * 100"
   
   // 不好：动态拼接（无法缓存）
   binding: `"${varName}" + " * 100"`
   ```

### ❌ 避免的做法

1. **不要依赖隐式类型转换**
   ```javascript
   // 不明确
   ${stringValue} + 10
   
   // 明确
   toNumber(${stringValue}) + 10  // 需要额外函数支持
   ```

2. **不要在表达式中执行副作用**
   ```javascript
   // 表达式应该只用于计算，不应用于修改状态
   ```

3. **避免超长表达式**
   ```javascript
   // 超过 100 字符的表达式应考虑拆分
   ```

---

## API 参考

### ExpressionEngine

```typescript
class ExpressionEngine {
  /**
   * 计算表达式的值
   * @param expression - 表达式字符串
   * @param context - 变量上下文对象
   * @returns 计算结果
   */
  evaluate(expression: string, context: Record<string, any>): any
  
  /**
   * 提取表达式中的变量依赖
   * @param expression - 表达式字符串
   * @returns 变量名数组（去重）
   */
  extractDependencies(expression: string): string[]
}
```

### 使用示例

```typescript
import { expressionEngine } from '@/services/expression-engine'

// 计算表达式
const result = expressionEngine.evaluate(
  "${temperature} > 100 ? '危险' : '安全'",
  { temperature: 85 }
)
// 结果: "安全"

// 提取依赖
const deps = expressionEngine.extractDependencies(
  "${a} + ${b} * ${c}"
)
// 结果: ['a', 'b', 'c']
```

---

## 限制与注意事项

1. **不支持的功能**
   - 函数调用
   - 数组/对象访问
   - 正则表达式
   - 位运算符
   - 自增/自减运算符

2. **类型安全**
   - 所有非数字值在算术运算中转换为 0
   - 所有值都可以转换为布尔值进行逻辑运算
   - 未定义的变量返回 `null`

3. **性能考虑**
   - AST 缓存无上限，长期运行需注意内存
   - 极复杂表达式（>50 个节点）可能影响性能
   - 建议在关键路径上预编译常用表达式

---

## 版本信息

- **引擎版本**: 1.0
- **解析方式**: 递归下降解析器
- **求值方式**: AST 遍历
- **缓存策略**: 基于表达式字符串的 Map 缓存

---

## 常见问题 (FAQ)

**Q: 如何调试表达式？**  
A: 使用 `extractDependencies` 查看变量依赖，逐步测试子表达式。

**Q: 表达式支持哪些数据类型？**  
A: 数字、字符串、布尔值。其他类型会被转换或返回 null。

**Q: 可以自定义函数吗？**  
A: 当前版本不支持，后续版本可能添加内置函数支持。

**Q: 表达式有长度限制吗？**  
A: 没有硬性限制，但建议保持简洁以提高可维护性。

**Q: 如何处理除零错误？**  
A: 除法结果为 `Infinity` 或 `-Infinity`，建议在表达式中添加保护：
```javascript
${divisor} != 0 ? ${numerator} / ${divisor} : 0
```
