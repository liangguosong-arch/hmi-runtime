// src/services/script-engine.ts - Script engine implementation (Lexer + Parser + Interpreter)

import type {
  ASTNode,
  ProgramNode,
  StatementNode,
  ExpressionNode,
  ScriptContext,
  ScriptExecutionResult,
  ScriptConfig,
  CompiledScript
} from '@plc/hmi-types/script'

/**
 * Token types for lexer
 */
export type TokenType =
  | 'Number'
  | 'String'
  | 'Boolean'
  | 'Null'
  | 'Undefined'
  | 'Identifier'
  | 'Keyword'
  | 'Operator'
  | 'Punctuator'
  | 'Template'
  | 'Regex'
  | 'EOF'

export interface Token {
  type: TokenType
  value: any
  raw?: string
  line: number
  column: number
}

/**
 * Lexer - Tokenizes source code into tokens
 */
class Lexer {
  private code: string
  private pos: number
  private line: number
  private column: number
  private tokens: Token[]

  private keywords = new Set([
    'let', 'const', 'var', 'if', 'else', 'for', 'while', 'do',
    'break', 'continue', 'return', 'function', 'new', 'this',
    'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
    'in', 'of', 'try', 'catch', 'finally', 'throw', 'delete',
    'void', 'async', 'await'
  ])

  constructor(code: string) {
    this.code = code
    this.pos = 0
    this.line = 1
    this.column = 0
    this.tokens = []
  }

  tokenize(): Token[] {
    while (this.pos < this.code.length) {
      const char = this.code[this.pos]

      // Skip whitespace
      if (/\s/.test(char)) {
        if (char === '\n') {
          this.line++
          this.column = 0
        } else {
          this.column++
        }
        this.pos++
        continue
      }

      // Skip single-line comments
      if (char === '/' && this.code[this.pos + 1] === '/') {
        this.skipSingleLineComment()
        continue
      }

      // Skip multi-line comments
      if (char === '/' && this.code[this.pos + 1] === '*') {
        this.skipMultiLineComment()
        continue
      }

      // Numbers
      if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(this.code[this.pos + 1]))) {
        this.readNumber()
        continue
      }

      // Strings
      if (char === '"' || char === "'" || char === '`') {
        this.readString()
        continue
      }

      // Identifiers and keywords
      if (/[a-zA-Z_$]/.test(char)) {
        this.readIdentifier()
        continue
      }

      // Operators and punctuators
      if (this.isOperatorStart(char)) {
        this.readOperator()
        continue
      }

      // Single character punctuators
      if (['(', ')', '{', '}', '[', ']', ',', ';', ':', '.'].includes(char)) {
        this.tokens.push({
          type: 'Punctuator',
          value: char,
          line: this.line,
          column: this.column
        })
        this.pos++
        this.column++
        continue
      }

      throw new SyntaxError(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`)
    }

    // Add EOF token
    this.tokens.push({
      type: 'EOF',
      value: null,
      line: this.line,
      column: this.column
    })

    return this.tokens
  }

  private skipSingleLineComment() {
    while (this.pos < this.code.length && this.code[this.pos] !== '\n') {
      this.pos++
      this.column++
    }
  }

  private skipMultiLineComment() {
    this.pos += 2
    this.column += 2
    while (this.pos < this.code.length - 1) {
      if (this.code[this.pos] === '\n') {
        this.line++
        this.column = 0
      }
      if (this.code[this.pos] === '*' && this.code[this.pos + 1] === '/') {
        this.pos += 2
        this.column += 2
        return
      }
      this.pos++
      this.column++
    }
    throw new SyntaxError('Unterminated multi-line comment')
  }

  private readNumber() {
    let num = ''
    let isFloat = false

    while (this.pos < this.code.length && (/[0-9]/.test(this.code[this.pos]) || this.code[this.pos] === '.')) {
      if (this.code[this.pos] === '.') {
        if (isFloat) break
        isFloat = true
      }
      num += this.code[this.pos]
      this.pos++
      this.column++
    }

    const value = isFloat ? parseFloat(num) : parseInt(num, 10)
    this.tokens.push({
      type: 'Number',
      value,
      raw: num,
      line: this.line,
      column: this.column
    })
  }

  private readString() {
    const quote = this.code[this.pos]
    this.pos++
    this.column++

    let str = ''
    while (this.pos < this.code.length) {
      const char = this.code[this.pos]

      if (char === '\\') {
        this.pos++
        this.column++
        const next = this.code[this.pos]
        switch (next) {
          case 'n': str += '\n'; break
          case 't': str += '\t'; break
          case 'r': str += '\r'; break
          case '"': str += '"'; break
          case "'": str += "'"; break
          case '\\': str += '\\'; break
          default: str += next
        }
        this.pos++
        this.column++
      } else if (char === quote) {
        this.pos++
        this.column++
        break
      } else {
        str += char
        this.pos++
        this.column++
      }
    }

    this.tokens.push({
      type: 'String',
      value: str,
      line: this.line,
      column: this.column
    })
  }

  private readIdentifier() {
    let id = ''
    while (this.pos < this.code.length && /[a-zA-Z0-9_$]/.test(this.code[this.pos])) {
      id += this.code[this.pos]
      this.pos++
      this.column++
    }

    if (this.keywords.has(id)) {
      this.tokens.push({
        type: 'Keyword',
        value: id,
        line: this.line,
        column: this.column
      })
    } else {
      this.tokens.push({
        type: 'Identifier',
        value: id,
        line: this.line,
        column: this.column
      })
    }
  }

  private isOperatorStart(char: string): boolean {
    return ['+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '^', '~'].includes(char)
  }

  private readOperator() {
    let op = this.code[this.pos]
    this.pos++
    this.column++

    // Check for two-character operators
    if (this.pos < this.code.length) {
      const twoChar = op + this.code[this.pos]
      if (['==', '!=', '>=', '<=', '&&', '||', '+=', '-=', '*=', '/=', '++', '--'].includes(twoChar)) {
        op = twoChar
        this.pos++
        this.column++
      }

      // Check for three-character operators
      if (this.pos < this.code.length) {
        const threeChar = op + this.code[this.pos]
        if (['===', '!=='].includes(threeChar)) {
          op = threeChar
          this.pos++
          this.column++
        }
      }
    }

    this.tokens.push({
      type: 'Operator',
      value: op,
      line: this.line,
      column: this.column
    })
  }
}

/**
 * Parser - Converts tokens to AST
 */
class Parser {
  private tokens: Token[]
  private pos: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
  }

  parse(): ProgramNode {
    const program: ProgramNode = {
      type: 'Program',
      body: []
    }

    while (!this.isEOF()) {
      const statement = this.parseStatement()
      //console.log('Adding statement to program:', statement)
      if (statement) {
        program.body.push(statement)
      }
    }

    return program
  }

  private currentToken(): Token {
    return this.tokens[this.pos]
  }

  private peekToken(): Token {
    return this.tokens[this.pos + 1]
  }

  private consume(expectedType?: TokenType, expectedValue?: any): Token {
    const token = this.currentToken()

    if (expectedType && token.type !== expectedType) {
      throw new SyntaxError(
        `Expected token type '${expectedType}' but got '${token.type}' at line ${token.line}`
      )
    }

    if (expectedValue && token.value !== expectedValue) {
      throw new SyntaxError(
        `Expected token value '${expectedValue}' but got '${token.value}' at line ${token.line}`
      )
    }

    this.pos++
    return token
  }

  private isEOF(): boolean {
    return this.currentToken().type === 'EOF'
  }

  private match(type: TokenType, value?: any): boolean {
    const token = this.currentToken()
    return token.type === type && (!value || token.value === value)
  }

  private parseStatement(): StatementNode | null {
    const token = this.currentToken()

    // Skip standalone semicolons (empty statements)
    if (token.type === 'Punctuator' && token.value === ';') {
      this.consume()
      return null
    }

    let statement: StatementNode | null = null

    // Variable declaration
    if (token.type === 'Keyword' && (token.value === 'let' || token.value === 'const')) {
      statement = this.parseVariableDeclaration()
    }
    // If statement
    else if (token.type === 'Keyword' && token.value === 'if') {
      statement = this.parseIfStatement()
    }
    // While loop
    else if (token.type === 'Keyword' && token.value === 'while') {
      statement = this.parseWhileStatement()
    }
    // For loop
    else if (token.type === 'Keyword' && token.value === 'for') {
      statement = this.parseForStatement()
    }
    // Break
    else if (token.type === 'Keyword' && token.value === 'break') {
      this.consume()
      statement = { type: 'BreakStatement' }
    }
    // Continue
    else if (token.type === 'Keyword' && token.value === 'continue') {
      this.consume()
      statement = { type: 'ContinueStatement' }
    }
    // Return
    else if (token.type === 'Keyword' && token.value === 'return') {
      statement = this.parseReturnStatement()
    }
    // Function declaration
    else if (token.type === 'Keyword' && token.value === 'function') {
      statement = this.parseFunctionDeclaration()
    }
    // Try-catch
    else if (token.type === 'Keyword' && token.value === 'try') {
      statement = this.parseTryStatement()
    }
    // Throw
    else if (token.type === 'Keyword' && token.value === 'throw') {
      statement = this.parseThrowStatement()
    }
    // Block statement
    else if (token.type === 'Punctuator' && token.value === '{') {
      statement = this.parseBlockStatement()
    }
    // Expression statement
    else {
      const expression = this.parseExpression()
      if (expression) {
        statement = {
          type: 'ExpressionStatement',
          expression
        }
      } else {
        throw new SyntaxError(`Unexpected token '${token.value}' (${token.type}) at line ${token.line}, column ${token.column}. Expected: statement`)
      }
    }

    // Consume optional semicolon after statement (if present)
    if (statement && this.match('Punctuator', ';')) {
      this.consume()
    }

    return statement
  }

  private parseVariableDeclaration(): StatementNode {
    const keyword = this.consume('Keyword')
    const kind = keyword.value as 'let' | 'const'

    const declarations = []
    do {
      const id = this.consume('Identifier')
      let init = undefined

      if (this.match('Operator', '=')) {
        this.consume()
        init = this.parseExpression()
      }

      declarations.push({
        type: 'VariableDeclarator' as const,
        id: { type: 'Identifier' as const, name: id.value },
        init
      })
    } while (this.match('Punctuator', ','))

    return {
      type: 'VariableDeclaration' as const,
      kind,
      declarations
    }
  }

  private parseIfStatement(): StatementNode {
    this.consume('Keyword', 'if')
    this.consume('Punctuator', '(')
    const test = this.parseExpression()
    this.consume('Punctuator', ')')

    const consequent = this.parseStatement()!
    let alternate = undefined

    if (this.match('Keyword', 'else')) {
      this.consume()
      alternate = this.parseStatement()
    }

    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate
    }
  }

  private parseWhileStatement(): StatementNode {
    this.consume('Keyword', 'while')
    this.consume('Punctuator', '(')
    const test = this.parseExpression()
    this.consume('Punctuator', ')')

    const body = this.parseStatement()!

    return {
      type: 'WhileStatement',
      test,
      body
    }
  }

  private parseForStatement(): StatementNode {
    this.consume('Keyword', 'for')
    this.consume('Punctuator', '(')

    let init = undefined
    if (!this.match('Punctuator', ';')) {
      if (this.match('Keyword', 'let') || this.match('Keyword', 'const')) {
        init = this.parseVariableDeclaration()
      } else {
        init = this.parseExpression()
      }
    }
    this.consume('Punctuator', ';')

    let test = undefined
    if (!this.match('Punctuator', ';')) {
      test = this.parseExpression()
    }
    this.consume('Punctuator', ';')

    let update = undefined
    if (!this.match('Punctuator', ')')) {
      update = this.parseExpression()
    }
    this.consume('Punctuator', ')')

    const body = this.parseStatement()!

    return {
      type: 'ForStatement',
      init,
      test,
      update,
      body
    }
  }

  private parseReturnStatement(): StatementNode {
    this.consume('Keyword', 'return')

    let argument = undefined
    if (!this.match('Punctuator', ';') && !this.match('Punctuator', '}') && !this.isEOF()) {
      argument = this.parseExpression()
    }

    return {
      type: 'ReturnStatement',
      argument
    }
  }

  private parseFunctionDeclaration(): StatementNode {
    this.consume('Keyword', 'function')
    const id = this.consume('Identifier')

    this.consume('Punctuator', '(')
    const params = []
    if (!this.match('Punctuator', ')')) {
      do {
        const param = this.consume('Identifier')
        params.push({ type: 'Identifier', name: param.value })
      } while (this.match('Punctuator', ','))
    }
    this.consume('Punctuator', ')')

    const body = this.parseBlockStatement()

    return {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: id.value },
      params,
      body
    }
  }

  private parseTryStatement(): StatementNode {
    this.consume('Keyword', 'try')
    const block = this.parseBlockStatement()

    let handler = undefined
    if (this.match('Keyword', 'catch')) {
      this.consume()
      this.consume('Punctuator', '(')
      const param = this.consume('Identifier')
      this.consume('Punctuator', ')')
      const catchBody = this.parseBlockStatement()
      handler = {
        type: 'CatchClause',
        param: { type: 'Identifier', name: param.value },
        body: catchBody
      }
    }

    let finalizer = undefined
    if (this.match('Keyword', 'finally')) {
      this.consume()
      finalizer = this.parseBlockStatement()
    }

    return {
      type: 'TryStatement',
      block,
      handler,
      finalizer
    }
  }

  private parseThrowStatement(): StatementNode {
    this.consume('Keyword', 'throw')
    const argument = this.parseExpression()

    return {
      type: 'ThrowStatement',
      argument
    }
  }

  private parseBlockStatement(): StatementNode {
    this.consume('Punctuator', '{')
    const body = []

    while (!this.match('Punctuator', '}') && !this.isEOF()) {
      const stmt = this.parseStatement()
      if (stmt) {
        body.push(stmt)
      }
    }

    this.consume('Punctuator', '}')

    return {
      type: 'BlockStatement',
      body
    }
  }

  private parseExpression(): ExpressionNode {
    return this.parseAssignment()
  }

  private parseAssignment(): ExpressionNode {
    let left = this.parseLogicalOr()

    if (this.match('Operator') && ['=', '+=', '-=', '*=', '/='].includes(this.currentToken().value)) {
      const operator = this.consume('Operator').value
      const right = this.parseAssignment()

      return {
        type: 'AssignmentExpression',
        operator,
        left,
        right
      }
    }

    return left
  }

  private parseLogicalOr(): ExpressionNode {
    let left = this.parseLogicalAnd()

    while (this.match('Operator', '||')) {
      const operator = this.consume('Operator').value
      const right = this.parseLogicalAnd()
      left = {
        type: 'LogicalExpression',
        operator,
        left,
        right
      }
    }

    return left
  }

  private parseLogicalAnd(): ExpressionNode {
    let left = this.parseEquality()

    while (this.match('Operator', '&&')) {
      const operator = this.consume('Operator').value
      const right = this.parseEquality()
      left = {
        type: 'LogicalExpression',
        operator,
        left,
        right
      }
    }

    return left
  }

  private parseEquality(): ExpressionNode {
    let left = this.parseComparison()

    while (this.match('Operator') && ['==', '!=', '===', '!=='].includes(this.currentToken().value)) {
      const operator = this.consume('Operator').value
      const right = this.parseComparison()
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      }
    }

    return left
  }

  private parseComparison(): ExpressionNode {
    let left = this.parseAddition()

    while (this.match('Operator') && ['<', '>', '<=', '>='].includes(this.currentToken().value)) {
      const operator = this.consume('Operator').value
      const right = this.parseAddition()
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      }
    }

    return left
  }

  private parseAddition(): ExpressionNode {
    let left = this.parseMultiplication()

    while (this.match('Operator') && ['+', '-'].includes(this.currentToken().value)) {
      const operator = this.consume('Operator').value
      const right = this.parseMultiplication()
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      }
    }

    return left
  }

  private parseMultiplication(): ExpressionNode {
    let left = this.parseUnary()

    while (this.match('Operator') && ['*', '/', '%'].includes(this.currentToken().value)) {
      const operator = this.consume('Operator').value
      const right = this.parseUnary()
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      }
    }

    return left
  }

  private parseUnary(): ExpressionNode {
    if (this.match('Operator') && ['-', '!', 'typeof', 'void', 'delete'].includes(this.currentToken().value)) {
      const operator = this.consume('Operator').value
      const argument = this.parseMemberExpression()

      return {
        type: 'UnaryExpression',
        operator,
        argument,
        prefix: true
      }
    }

    return this.parseMemberExpression()
  }

  private parsePrimary(): ExpressionNode {
    const token = this.currentToken()

    // Debug logging for troubleshooting
    // console.log('[Parser] parsePrimary - current token:', token)

    // Literal values
    if (token.type === 'Number' || token.type === 'String') {
      this.consume()
      return {
        type: 'Literal',
        value: token.value,
        raw: token.raw
      }
    }

    // Boolean literals
    if (token.type === 'Keyword' && (token.value === 'true' || token.value === 'false')) {
      this.consume()
      return {
        type: 'Literal',
        value: token.value === 'true'
      }
    }

    // Null literal
    if (token.type === 'Keyword' && token.value === 'null') {
      this.consume()
      return {
        type: 'Literal',
        value: null
      }
    }

    // Undefined literal
    if (token.type === 'Keyword' && token.value === 'undefined') {
      this.consume()
      return {
        type: 'Literal',
        value: undefined
      }
    }

    // Identifier
    if (token.type === 'Identifier') {
      this.consume()
      return {
        type: 'Identifier',
        name: token.value
      }
    }

    // This expression
    if (token.type === 'Keyword' && token.value === 'this') {
      this.consume()
      return {
        type: 'ThisExpression'
      }
    }

    // Array expression
    if (token.type === 'Punctuator' && token.value === '[') {
      return this.parseArrayExpression()
    }

    // Object expression
    if (token.type === 'Punctuator' && token.value === '{') {
      return this.parseObjectExpression()
    }

    if(token.type==='Punctuator' && token.value===',') {
      this.consume()
      return this.parseExpression()
    }

    // Function expression
    if (token.type === 'Keyword' && token.value === 'function') {
      return this.parseFunctionExpression()
    }

    // New expression
    if (token.type === 'Keyword' && token.value === 'new') {
      return this.parseNewExpression()
    }

    // Parenthesized expression or function call
    if (token.type === 'Punctuator' && token.value === '(') {
      this.consume()
      const expr = this.parseExpression()
      this.consume('Punctuator', ')')
      return expr
    }

    throw new SyntaxError(`Unexpected token '${token.value}' (${token.type}) at line ${token.line}, column ${token.column}`)
  }

  private parseArrayExpression(): ExpressionNode {
    this.consume('Punctuator', '[')
    const elements = []

    if (!this.match('Punctuator', ']')) {
      do {
        elements.push(this.parseExpression())
      } while (this.match('Punctuator', ','))
    }

    this.consume('Punctuator', ']')

    return {
      type: 'ArrayExpression',
      elements
    }
  }

  private parseObjectExpression(): ExpressionNode {
    this.consume('Punctuator', '{')
    const properties = []

    if (!this.match('Punctuator', '}')) {
      do {
        const key = this.consume('Identifier')
        this.consume('Punctuator', ':')
        const value = this.parseExpression()

        properties.push({
          type: 'Property',
          key: { type: 'Identifier', name: key.value },
          value,
          kind: 'init'
        })
      } while (this.match('Punctuator', ','))
    }

    this.consume('Punctuator', '}')

    return {
      type: 'ObjectExpression',
      properties
    }
  }

  private parseFunctionExpression(): ExpressionNode {
    this.consume('Keyword', 'function')

    let id = undefined
    if (this.match('Identifier')) {
      const idToken = this.consume('Identifier')
      id = { type: 'Identifier', name: idToken.value }
    }

    this.consume('Punctuator', '(')
    const params = []
    if (!this.match('Punctuator', ')')) {
      do {
        const param = this.consume('Identifier')
        params.push({ type: 'Identifier', name: param.value })
      } while (this.match('Punctuator', ','))
    }
    this.consume('Punctuator', ')')

    const body = this.parseBlockStatement()

    return {
      type: 'FunctionExpression',
      id,
      params,
      body
    }
  }

  private parseNewExpression(): ExpressionNode {
    this.consume('Keyword', 'new')
    const callee = this.parseMemberExpression()

    this.consume('Punctuator', '(')
    const args = []
    if (!this.match('Punctuator', ')')) {
      do {
        args.push(this.parseExpression())
      } while (this.match('Punctuator', ','))
    }
    this.consume('Punctuator', ')')

    return {
      type: 'NewExpression',
      callee,
      arguments: args
    }
  }

  // Postfix expressions (member access, function calls, increment/decrement)
  private parseMemberExpression(): ExpressionNode {
    let expr = this.parsePrimary()

    while (
      this.match('Punctuator', '.') ||
      this.match('Punctuator', '[') ||
      this.match('Punctuator', '(') ||
      (this.match('Operator') && ['++', '--'].includes(this.currentToken().value))
    ) {
      // Member access with dot
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
      // Member access with bracket
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
      // Function call
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
      // Postfix increment/decrement (count++, count--)
      else if (this.match('Operator') && ['++', '--'].includes(this.currentToken().value)) {
        const operator = this.consume('Operator').value
        expr = {
          type: 'UpdateExpression',
          operator,
          argument: expr,
          prefix: false
        }
      }
    }

    return expr
  }
}

/**
 * Scope management for variable storage
 */
class Scope {
  private variables = new Map<string, any>()
  private parent: Scope | null = null
  private _isFunctionScope: boolean

  constructor(parent?: Scope | null, isFunctionScope = false) {
    this.parent = parent || null
    this._isFunctionScope = isFunctionScope
  }

  set(name: string, value: any, kind: 'let' | 'const' = 'let'): void {
    this.variables.set(name, { value, kind })
  }

  get(name: string): any {
    if (this.variables.has(name)) {
      return this.variables.get(name)!.value
    }
    if (this.parent) {
      return this.parent.get(name)
    }
    throw new ReferenceError(`Undefined variable: ${name}`)
  }

  has(name: string): boolean {
    return this.variables.has(name) || (this.parent?.has(name) ?? false)
  }

  update(name: string, value: any): void {
    if (this.variables.has(name)) {
      const varInfo = this.variables.get(name)!
      if (varInfo.kind === 'const') {
        throw new TypeError(`Assignment to constant variable: ${name}`)
      }
      varInfo.value = value
    } else if (this.parent) {
      this.parent.update(name, value)
    } else {
      throw new ReferenceError(`Cannot update undefined variable: ${name}`)
    }
  }
}

/**
 * Interpreter - Executes AST nodes
 */
class Interpreter {
  private context: ScriptContext
  private globalScope: Scope
  private stepCount: number
  private maxSteps: number
  private timeout: number
  private startTime: number
  private timers: Map<number, any>
  private timerIdCounter: number

  constructor(context: ScriptContext, options: { timeout?: number; maxSteps?: number } = {}) {
    this.context = context
    this.globalScope = new Scope(null, false)
    this.stepCount = 0
    this.maxSteps = options.maxSteps || 100000
    this.timeout = options.timeout || 5000
    this.startTime = Date.now()
    this.timers = new Map()
    this.timerIdCounter = 1

    // Initialize built-in objects in global scope
    this.initializeBuiltIns()
  }

  private initializeBuiltIns() {
    // Add Math, JSON, Date, etc. to global scope
    this.globalScope.set('Math', this.context.Math, 'const')
    this.globalScope.set('JSON', this.context.JSON, 'const')
    this.globalScope.set('Date', this.context.Date, 'const')
    this.globalScope.set('parseInt', this.context.parseInt, 'const')
    this.globalScope.set('parseFloat', this.context.parseFloat, 'const')
    this.globalScope.set('isNaN', this.context.isNaN, 'const')
    this.globalScope.set('Boolean', this.context.Boolean, 'const')
    this.globalScope.set('String', this.context.String, 'const')
    this.globalScope.set('Number', this.context.Number, 'const')
    this.globalScope.set('Array', this.context.Array, 'const')
    this.globalScope.set('Object', this.context.Object, 'const')

    // Add API objects
    this.globalScope.set('$project', this.context.$project, 'const')
    this.globalScope.set('$page', this.context.$page, 'const')
    this.globalScope.set('$component', this.context.$component, 'const')
    this.globalScope.set('$device', this.context.$device, 'const')
    this.globalScope.set('$http', this.context.$http, 'const')
    this.globalScope.set('$timer', this.createTimerProxy(), 'const')
    this.globalScope.set('$navigation', this.context.$navigation, 'const')
    this.globalScope.set('console', this.context.console, 'const')
  }

  private createTimerProxy() {
    return {
      setTimeout: (callback: () => void, delay: number) => {
        const id = this.timerIdCounter++
        const timerId = window.setTimeout(() => {
          callback()
          this.timers.delete(id)
        }, delay)
        this.timers.set(id, timerId)
        return id
      },
      clearTimeout: (id: number) => {
        const timerId = this.timers.get(id)
        if (timerId !== undefined) {
          window.clearTimeout(timerId)
          this.timers.delete(id)
        }
      },
      setInterval: (callback: () => void, interval: number) => {
        const id = this.timerIdCounter++
        const timerId = window.setInterval(callback, interval)
        this.timers.set(id, timerId)
        return id
      },
      clearInterval: (id: number) => {
        const timerId = this.timers.get(id)
        if (timerId !== undefined) {
          window.clearInterval(timerId)
          this.timers.delete(id)
        }
      }
    }
  }

  private checkLimits() {
    this.stepCount++
    if (this.stepCount > this.maxSteps) {
      throw new Error(`Script execution exceeded maximum steps (${this.maxSteps})`)
    }

    const elapsed = Date.now() - this.startTime
    if (elapsed > this.timeout) {
      throw new Error(`Script execution timed out after ${this.timeout}ms`)
    }
  }

  async execute(program: ProgramNode): Promise<any> {
    let returnValue = undefined

    for (const statement of program.body) {
      this.checkLimits()
      //console.log('Executing statement:', statement)
      const result = await this.executeStatement(statement)

      if (result && result.__type === 'return') {
        returnValue = result.value
        break
      }

      if (result && result.__type === 'break') {
        break
      }

      if (result && result.__type === 'continue') {
        continue
      }
    }

    return returnValue
  }

  private async executeStatement(node: StatementNode): Promise<any> {
    this.checkLimits()

    switch (node.type) {
      case 'BlockStatement':
        return this.executeBlockStatement(node)

      case 'ExpressionStatement':
        return await this.evaluateExpression(node.expression)

      case 'VariableDeclaration':
        return await this.executeVariableDeclaration(node)

      case 'IfStatement':
        return await this.executeIfStatement(node)

      case 'WhileStatement':
        return await this.executeWhileStatement(node)

      case 'ForStatement':
        return await this.executeForStatement(node)

      case 'BreakStatement':
        return { __type: 'break' }

      case 'ContinueStatement':
        return { __type: 'continue' }

      case 'ReturnStatement':
        const value = node.argument ? await this.evaluateExpression(node.argument) : undefined
        return { __type: 'return', value }

      case 'FunctionDeclaration':
        return this.executeFunctionDeclaration(node)

      case 'TryStatement':
        return await this.executeTryStatement(node)

      case 'ThrowStatement':
        const error = await this.evaluateExpression(node.argument)
        throw error

      default:
        throw new Error(`Unknown statement type: ${(node as any).type}`)
    }
  }

  private async executeBlockStatement(node: any, parentScope?: Scope): Promise<any> {
    // Use provided scope or current global scope
    const _scope = parentScope || this.globalScope
    let result = undefined

    for (const stmt of node.body) {
      result = await this.executeStatement(stmt)
      if (result && (result.__type === 'return' || result.__type === 'break' || result.__type === 'continue')) {
        return result
      }
    }

    return result
  }

  private async executeVariableDeclaration(node: any): Promise<void> {
    const { kind, declarations } = node

    for (const decl of declarations) {
      const name = decl.id.name
      let value = undefined

      if (decl.init) {
        value = await this.evaluateExpression(decl.init)
      }

      this.globalScope.set(name, value, kind)
    }
  }

  private async executeIfStatement(node: any): Promise<any> {
    const test = toBoolean(await this.evaluateExpression(node.test))

    if (test) {
      return await this.executeStatement(node.consequent)
    } else if (node.alternate) {
      return await this.executeStatement(node.alternate)
    }

    return undefined
  }

  private async executeWhileStatement(node: any): Promise<any> {
    while (toBoolean(await this.evaluateExpression(node.test))) {
      this.checkLimits()
      const result = await this.executeStatement(node.body)

      if (result && result.__type === 'break') {
        break
      }

      if (result && result.__type === 'return') {
        return result
      }
    }

    return undefined
  }

  private async executeForStatement(node: any): Promise<any> {
    // Execute initialization
    if (node.init) {
      if (node.init.type === 'VariableDeclaration') {
        await this.executeVariableDeclaration(node.init)
      } else {
        await this.evaluateExpression(node.init)
      }
    }

    // Loop
    while (true) {
      this.checkLimits()

      // Check condition
      if (node.test) {
        const test = toBoolean(await this.evaluateExpression(node.test))
        if (!test) break
      }

      // Execute body
      const result = await this.executeStatement(node.body)

      if (result && result.__type === 'break') {
        break
      }

      if (result && result.__type === 'return') {
        return result
      }

      // Execute update
      if (node.update) {
        await this.evaluateExpression(node.update)
      }
    }

    return undefined
  }

  private executeFunctionDeclaration(node: any): void {
    const name = node.id.name
    const func = this.createFunction(node.params, node.body, this.globalScope)
    this.globalScope.set(name, func, 'const')
  }

  private async executeTryStatement(node: any): Promise<any> {
    try {
      return await this.executeBlockStatement(node.block)
    } catch (error) {
      if (node.handler) {
        const catchScope = new Scope(this.globalScope, true)
        catchScope.set(node.handler.param.name, error, 'let')

        // Temporarily use catchScope
        const oldScope = this.globalScope
        this.globalScope = catchScope
        try {
          return await this.executeBlockStatement(node.handler.body, catchScope)
        } finally {
          this.globalScope = oldScope
        }
      }
      throw error
    } finally {
      if (node.finalizer) {
        await this.executeBlockStatement(node.finalizer)
      }
    }
  }

  private async evaluateExpression(node: ExpressionNode): Promise<any> {
    this.checkLimits()

    switch (node.type) {
      case 'Literal':
        return node.value

      case 'Identifier':
        return this.globalScope.get(node.name)

      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node)

      case 'UnaryExpression':
        return this.evaluateUnaryExpression(node)

      case 'UpdateExpression':
        return this.evaluateUpdateExpression(node)

      case 'LogicalExpression':
        return this.evaluateLogicalExpression(node)

      case 'AssignmentExpression':
        return this.evaluateAssignmentExpression(node)

      case 'CallExpression':
        return await this.evaluateCallExpression(node)

      case 'MemberExpression':
        const memberExpression = await this.evaluateMemberExpression(node)

        return memberExpression

      case 'ConditionalExpression':
        const test = toBoolean(await this.evaluateExpression(node.test))
        return test
          ? await this.evaluateExpression(node.consequent)
          : await this.evaluateExpression(node.alternate)

      case 'ArrayExpression':
        const arr = []
        for (const elem of node.elements) {
          arr.push(await this.evaluateExpression(elem))
        }
        return arr

      case 'ObjectExpression':
        const obj: any = {}
        for (const prop of node.properties) {
          const key = prop.key.name || prop.key.value
          obj[key] = await this.evaluateExpression(prop.value)
        }
        return obj

      case 'FunctionExpression':
        return this.createFunction(node.params, node.body, this.globalScope)

      case 'ThisExpression':
        return this.context.$component || this.context

      case 'NewExpression':
        return this.evaluateNewExpression(node)

      default:
        throw new Error(`Unknown expression type: ${(node as any).type}`)
    }
  }

  private evaluateExpressionSync(node: ExpressionNode): any {
    // Synchronous version for simple expressions
    switch (node.type) {
      case 'Literal':
        return node.value

      case 'Identifier':
        return this.globalScope.get(node.name)

      case 'BinaryExpression':
        const left = this.evaluateExpressionSync(node.left)
        const right = this.evaluateExpressionSync(node.right)
        return this.applyBinaryOperator(node.operator, left, right)

      case 'UnaryExpression':
        const operand = this.evaluateExpressionSync(node.argument)
        return this.applyUnaryOperator(node.operator, operand)

      case 'LogicalExpression':
        const l = this.evaluateExpressionSync(node.left)
        const r = this.evaluateExpressionSync(node.right)
        return node.operator === '&&' ? (toBoolean(l) && r) : (toBoolean(l) || r)

      case 'ConditionalExpression':
        const test = toBoolean(this.evaluateExpressionSync(node.test))
        return test ? this.evaluateExpressionSync(node.consequent) : this.evaluateExpressionSync(node.alternate)

      case 'ArrayExpression':
        return node.elements.map(elem => this.evaluateExpressionSync(elem))

      case 'ObjectExpression':
        const obj: any = {}
        for (const prop of node.properties) {
          const key = prop.key.name || prop.key.value
          obj[key] = this.evaluateExpressionSync(prop.value)
        }
        return obj

      default:
        throw new Error(`Expression type ${(node as any).type} not supported in sync evaluation`)
    }
  }

  private async evaluateBinaryExpression(node: any): Promise<any> {
    const left = await this.evaluateExpression(node.left)
    const right = await this.evaluateExpression(node.right)
    return this.applyBinaryOperator(node.operator, left, right)
  }

  private applyBinaryOperator(operator: string, left: any, right: any): any {
    switch (operator) {
      case '+':
        // String concatenation if either operand is a string
        if (typeof left === 'string' || typeof right === 'string') {
          return String(left) + String(right)
        }
        // Otherwise numeric addition
        return toNumber(left) + toNumber(right)
      case '-': return toNumber(left) - toNumber(right)
      case '*': return toNumber(left) * toNumber(right)
      case '/': return toNumber(left) / toNumber(right)
      case '%': return toNumber(left) % toNumber(right)
      case '==': return left == right
      case '!=': return left != right
      case '===': return left === right
      case '!==': return left !== right
      case '>': return toNumber(left) > toNumber(right)
      case '<': return toNumber(left) < toNumber(right)
      case '>=': return toNumber(left) >= toNumber(right)
      case '<=': return toNumber(left) <= toNumber(right)
      default:
        throw new Error(`Unknown binary operator: ${operator}`)
    }
  }

  private async evaluateUnaryExpression(node: any): Promise<any> {
    const argument = await this.evaluateExpression(node.argument)
    return this.applyUnaryOperator(node.operator, argument)
  }

  private applyUnaryOperator(operator: string, operand: any): any {
    switch (operator) {
      case '-': return -toNumber(operand)
      case '!': return !toBoolean(operand)
      case 'typeof': return typeof operand
      case 'void': return undefined
      case 'delete': return true
      default:
        throw new Error(`Unknown unary operator: ${operator}`)
    }
  }

  private async evaluateLogicalExpression(node: any): Promise<any> {
    const left = await this.evaluateExpression(node.left)

    if (node.operator === '&&') {
      return toBoolean(left) ? await this.evaluateExpression(node.right) : left
    } else {
      return toBoolean(left) ? left : await this.evaluateExpression(node.right)
    }
  }

  private async evaluateAssignmentExpression(node: any): Promise<any> {
    let right = await this.evaluateExpression(node.right)

    if (node.left.type === 'Identifier') {
      const name = node.left.name

      if (node.operator === '=') {
        this.globalScope.update(name, right)
      } else {
        const current = this.globalScope.get(name)
        let newValue = current

        switch (node.operator) {
          case '+=': newValue = toNumber(current) + toNumber(right); break
          case '-=': newValue = toNumber(current) - toNumber(right); break
          case '*=': newValue = toNumber(current) * toNumber(right); break
          case '/=': newValue = toNumber(current) / toNumber(right); break
        }

        this.globalScope.update(name, newValue)
        right = newValue
      }

      return right
    }

    throw new Error('Invalid assignment target')
  }

  private evaluateUpdateExpression(node: any): any {
    const { operator, argument, prefix } = node

    // Only support Identifier for now
    if (argument.type !== 'Identifier') {
      throw new Error('Update expression only supports identifiers')
    }

    const name = argument.name
    const currentValue = this.globalScope.get(name)

    if (typeof currentValue !== 'number') {
      throw new TypeError(`Cannot ${operator} a non-number value`)
    }

    let newValue = currentValue
    if (operator === '++') {
      newValue = currentValue + 1
    } else if (operator === '--') {
      newValue = currentValue - 1
    }

    this.globalScope.update(name, newValue)

    // For postfix (count++), return the old value
    // For prefix (++count), return the new value
    return prefix ? newValue : currentValue
  }

  private async evaluateCallExpression(node: any): Promise<any> {
    // If callee is a member expression, we need to preserve the object context for 'this' binding
    let thisArg = null
    let calleeExpr = node.callee

    if (node.callee.type === 'MemberExpression') {
      const objectValue = await this.evaluateExpression(node.callee.object)
      // Unwrap if needed
      thisArg = (objectValue && typeof objectValue === 'object' && 'value' in objectValue && 'kind' in objectValue)
        ? objectValue.value
        : objectValue

      const propertyName = node.callee.property.name || await this.evaluateExpression(node.callee.property)
      calleeExpr = { type: 'Identifier', name: '_method_' } // Placeholder
      // Get the method from the object
      const method = thisArg[propertyName]

      const args = []
      for (const arg of node.arguments) {
        args.push(await this.evaluateExpression(arg))
      }

      if (typeof method === 'function') {
        return await method.call(thisArg, ...args)
      }

      throw new TypeError(`${propertyName} is not a function`)
    }

    // Normal function call
    const callee = await this.evaluateExpression(calleeExpr)

    // Unwrap if it's a scope variable wrapper
    const actualCallee = (callee && typeof callee === 'object' && 'value' in callee && 'kind' in callee)
      ? callee.value
      : callee

    const args = []
    for (const arg of node.arguments) {
      args.push(await this.evaluateExpression(arg))
    }

    if (typeof actualCallee === 'function') {
      return await actualCallee(...args)
    }

    throw new TypeError('Callee is not a function')
  }

  private async evaluateMemberExpression(node: any): Promise<any> {
    const object = await this.evaluateExpression(node.object)

    // If object is a scope variable wrapper { value, kind }, unwrap it
    const actualObject = (object && typeof object === 'object' && 'value' in object && 'kind' in object)
      ? object.value
      : object

    if (node.computed) {
      const property = await this.evaluateExpression(node.property)
      return actualObject[property]
    } else {
      const propertyName = node.property.name
      return actualObject[propertyName]
    }
  }

  private async evaluateNewExpression(node: any): Promise<any> {
    const callee = await this.evaluateExpression(node.callee)
    const args = []
    
    for (const arg of node.arguments) {
      args.push(await this.evaluateExpression(arg))
    }

    if (typeof callee === 'function') {
      return new callee(...args)
    }

    throw new TypeError('Callee is not a constructor')
  }

  private createFunction(params: any[], body: any, scope: Scope): Function {
    return async (...args: any[]) => {
      const funcScope = new Scope(scope, true)

      // Bind parameters
      for (let i = 0; i < params.length; i++) {
        const paramName = params[i].name
        const paramValue = i < args.length ? args[i] : undefined
        funcScope.set(paramName, paramValue, 'let')
      }

      // Execute function body
      let result = undefined
      for (const stmt of body.body) {
        result = await this.executeStatement(stmt)
        if (result && result.__type === 'return') {
          return result.value
        }
      }

      return result
    }
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

/**
 * Script Engine - Main entry point
 */
export class ScriptEngine {
  private astCache = new Map<string, ProgramNode>()

  /**
   * Compile script code to AST
   */
  compile(code: string): CompiledScript {
    // Check cache
    const hash = this.hashCode(code)
    if (this.astCache.has(hash)) {
      return {
        code,
        ast: this.astCache.get(hash)!,
        hash
      }
    }

    // Lexical analysis
    const lexer = new Lexer(code)
    const tokens = lexer.tokenize()

    // Parsing
    const parser = new Parser(tokens)
    const ast = parser.parse()
    // Cache AST
    this.astCache.set(hash, ast)

    return {
      code,
      ast,
      hash
    }
  }

  /**
   * Execute compiled script
   */
  async execute(compiled: CompiledScript, context: ScriptContext): Promise<ScriptExecutionResult> {
    const startTime = performance.now()

    try {
      const interpreter = new Interpreter(context, {
        timeout: 5000,
        maxSteps: 100000
      })

      const returnValue = await interpreter.execute(compiled.ast as ProgramNode)
      const executionTime = performance.now() - startTime

      return {
        success: true,
        returnValue,
        executionTime
      }
    } catch (error: any) {
      const executionTime = performance.now() - startTime

      return {
        success: false,
        error: error.message,
        errorLine: error.line,
        executionTime
      }
    }
  }

  /**
   * Run script code directly
   */
  async run(code: string, context: ScriptContext): Promise<ScriptExecutionResult> {
    const compiled = this.compile(code)

    return this.execute(compiled, context)
  }

  /**
   * Clear AST cache
   */
  clearCache(): void {
    this.astCache.clear()
  }

  /**
   * Generate hash code for caching
   */
  private hashCode(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }
}

// Singleton instance
export const scriptEngine = new ScriptEngine()
