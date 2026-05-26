// src/services/expression-engine.ts - 表达式引擎 (AST-based)

type ExpressionNode =
  | { type: 'literal'; value: any }
  | { type: 'variable'; name: string }
  | { type: 'binary'; operator: string; left: ExpressionNode; right: ExpressionNode }
  | { type: 'unary'; operator: string; operand: ExpressionNode }
  | { type: 'conditional'; condition: ExpressionNode; consequent: ExpressionNode; alternate: ExpressionNode }

class ExpressionEngine {
  private cache = new Map<string, ExpressionNode>()

  /**
   * Evaluate expression with context
   */
  evaluate(expression: string, context: Record<string, any>): any {
    try {
      // Check cache
      let ast = this.cache.get(expression)
      if (!ast) {
        ast = this.parse(expression)
        this.cache.set(expression, ast)
      }

      return this.evaluateNode(ast, context)
    } catch (error) {
      console.error('[ExpressionEngine] Evaluation error:', error)
      return null
    }
  }

  /**
   * Parse expression string to AST
   */
  private parse(expression: string): ExpressionNode {
    const tokens = this.tokenize(expression)
    let pos = 0

    const parseExpression = (): ExpressionNode => {
      let node = parseLogicalOr()

      if (pos < tokens.length && tokens[pos] === '?') {
        pos++
        const consequent = parseExpression()
        expect(':')
        const alternate = parseExpression()
        node = { type: 'conditional', condition: node, consequent, alternate }
      }

      return node
    }

    const parseLogicalOr = (): ExpressionNode => {
      let node = parseLogicalAnd()

      while (pos < tokens.length && tokens[pos] === '||') {
        pos++
        const right = parseLogicalAnd()
        node = { type: 'binary', operator: '||', left: node, right }
      }

      return node
    }

    const parseLogicalAnd = (): ExpressionNode => {
      let node = parseComparison()

      while (pos < tokens.length && tokens[pos] === '&&') {
        pos++
        const right = parseComparison()
        node = { type: 'binary', operator: '&&', left: node, right }
      }

      return node
    }

    const parseComparison = (): ExpressionNode => {
      let node = parseAddition()

      const operators = ['==', '!=', '>', '<', '>=', '<=']
      while (pos < tokens.length && operators.includes(tokens[pos])) {
        const op = tokens[pos++]
        const right = parseAddition()
        node = { type: 'binary', operator: op, left: node, right }
      }

      return node
    }

    const parseAddition = (): ExpressionNode => {
      let node = parseMultiplication()

      while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
        const op = tokens[pos++]
        const right = parseMultiplication()
        node = { type: 'binary', operator: op, left: node, right }
      }

      return node
    }

    const parseMultiplication = (): ExpressionNode => {
      let node = parseUnary()

      while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
        const op = tokens[pos++]
        const right = parseUnary()
        node = { type: 'binary', operator: op, left: node, right }
      }

      return node
    }

    const parseUnary = (): ExpressionNode => {
      if (pos < tokens.length && tokens[pos] === '-') {
        pos++
        const operand = parsePrimary()
        return { type: 'unary', operator: '-', operand }
      }
      return parsePrimary()
    }

    const parsePrimary = (): ExpressionNode => {
      const token = tokens[pos]

      // Number literal
      if (/^\d+(\.\d+)?$/.test(token)) {
        pos++
        return { type: 'literal', value: parseFloat(token) }
      }

      // String literal
      if ((token.startsWith('"') && token.endsWith('"')) ||
          (token.startsWith("'") && token.endsWith("'"))) {
        pos++
        return { type: 'literal', value: token.slice(1, -1) }
      }

      // Boolean literal
      if (token === 'true' || token === 'false') {
        pos++
        return { type: 'literal', value: token === 'true' }
      }

      // Variable reference (${varName})
      if (token.startsWith('${') && token.endsWith('}')) {
        pos++
        const varName = token.slice(2, -1)
        return { type: 'variable', name: varName }
      }

      // Parenthesized expression
      if (token === '(') {
        pos++
        const node = parseExpression()
        expect(')')
        return node
      }

      throw new Error(`Unexpected token: ${token}`)
    }

    const expect = (expected: string) => {
      if (pos >= tokens.length || tokens[pos] !== expected) {
        throw new Error(`Expected '${expected}' but got '${tokens[pos]}'`)
      }
      pos++
    }

    const ast = parseExpression()

    if (pos < tokens.length) {
      throw new Error(`Unexpected token: ${tokens[pos]}`)
    }

    return ast
  }

  /**
   * Tokenize expression
   */
  private tokenize(expression: string): string[] {
    const tokens: string[] = []
    let current = ''

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i]

      // Whitespace
      if (/\s/.test(char)) {
        if (current) {
          tokens.push(current)
          current = ''
        }
        continue
      }

      // Operators and delimiters
      if (['+', '-', '*', '/', '(', ')', '?', ':'].includes(char)) {
        if (current) {
          tokens.push(current)
          current = ''
        }
        tokens.push(char)
        continue
      }

      // Multi-character operators
      if (char === '=' || char === '!' || char === '>' || char === '<') {
        if (current) {
          tokens.push(current)
          current = ''
        }

        if (i + 1 < expression.length && expression[i + 1] === '=') {
          tokens.push(char + '=')
          i++
        } else {
          tokens.push(char)
        }
        continue
      }

      // Logical operators
      if (char === '|' && expression[i + 1] === '|') {
        if (current) {
          tokens.push(current)
          current = ''
        }
        tokens.push('||')
        i++
        continue
      }

      if (char === '&' && expression[i + 1] === '&') {
        if (current) {
          tokens.push(current)
          current = ''
        }
        tokens.push('&&')
        i++
        continue
      }

      // Variable reference ${...}
      if (char === '$' && expression[i + 1] === '{') {
        if (current) {
          tokens.push(current)
          current = ''
        }

        let varRef = '${'
        i += 2
        while (i < expression.length && expression[i] !== '}') {
          varRef += expression[i]
          i++
        }
        varRef += '}'
        tokens.push(varRef)
        continue
      }

      // Accumulate characters
      current += char
    }

    if (current) {
      tokens.push(current)
    }

    return tokens
  }

  /**
   * Evaluate AST node
   */
  private evaluateNode(node: ExpressionNode, context: Record<string, any>): any {
    switch (node.type) {
      case 'literal':
        return node.value

      case 'variable':
        return context[node.name] ?? null

      case 'unary':
        const operand = this.evaluateNode(node.operand, context)
        if (node.operator === '-') return -operand
        throw new Error(`Unknown unary operator: ${node.operator}`)

      case 'binary':
        const left = this.evaluateNode(node.left, context)
        const right = this.evaluateNode(node.right, context)

        switch (node.operator) {
          case '+': return toNumber(left) + toNumber(right)
          case '-': return toNumber(left) - toNumber(right)
          case '*': return toNumber(left) * toNumber(right)
          case '/': return toNumber(left) / toNumber(right)
          case '==': return left == right
          case '!=': return left != right
          case '>': return toNumber(left) > toNumber(right)
          case '<': return toNumber(left) < toNumber(right)
          case '>=': return toNumber(left) >= toNumber(right)
          case '<=': return toNumber(left) <= toNumber(right)
          case '&&': return toBoolean(left) && toBoolean(right)
          case '||': return toBoolean(left) || toBoolean(right)
          default:
            throw new Error(`Unknown binary operator: ${node.operator}`)
        }

      case 'conditional':
        const condition = toBoolean(this.evaluateNode(node.condition, context))
        return condition
          ? this.evaluateNode(node.consequent, context)
          : this.evaluateNode(node.alternate, context)

      default:
        throw new Error(`Unknown node type: ${(node as any).type}`)
    }
  }

  /**
   * Extract variable dependencies from expression
   */
  extractDependencies(expression: string): string[] {
    const dependencies: string[] = []
    const regex = /\$\{([^}]+)\}/g
    let match

    while ((match = regex.exec(expression)) !== null) {
      dependencies.push(match[1])
    }

    return [...new Set(dependencies)]
  }
}

// Helper functions
function toNumber(value: any): number {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

function toBoolean(value: any): boolean {
  return Boolean(value)
}

// Singleton instance
export const expressionEngine = new ExpressionEngine()
