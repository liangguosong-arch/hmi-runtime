// src/composables/useExpression.ts - Expression evaluation composable

import { ref, computed, watch, onUnmounted } from 'vue'
import { expressionEngine } from '@/services/expression-engine'
import { variableScheduler } from '@/services/variable-scheduler'
import type { Subscription } from '@plc/hmi-types'

/**
 * Composable for evaluating expressions with variable dependencies
 * Automatically tracks dependencies and re-evaluates when variables change
 */
export function useExpression(expression: string | undefined) {
  const result = ref<any>(null)
  const error = ref<string | null>(null)
  const subscriptions: Subscription[] = []

  // Extract dependencies from expression
  const dependencies = expression
    ? expressionEngine.extractDependencies(expression)
    : []

  // Evaluate expression with current context
  const evaluate = () => {
    if (!expression) {
      result.value = null
      error.value = null
      return
    }

    try {
      // Build context from current variable values
      const context: Record<string, any> = {}
      dependencies.forEach(dep => {
        context[dep] = variableScheduler.getValue(dep)
      })

      // Evaluate expression
      result.value = expressionEngine.evaluate(expression, context)
      error.value = null
    } catch (err: any) {
      console.error('[useExpression] Evaluation error:', err)
      error.value = err.message
      result.value = null
    }
  }

  // Subscribe to all dependencies
  if (dependencies.length > 0) {
    dependencies.forEach(dep => {
      const subscription = variableScheduler.subscribe(dep, () => {
        // Re-evaluate when any dependency changes
        evaluate()
      })
      subscriptions.push(subscription)
    })

    // Initial evaluation
    evaluate()
  }

  // Cleanup subscriptions
  onUnmounted(() => {
    subscriptions.forEach(sub => sub.unsubscribe())
    subscriptions.length = 0
  })

  return {
    result,
    error,
    dependencies
  }
}

/**
 * Composable for conditional styling based on expression
 */
export function useConditionalStyle(
  expression: string | undefined,
  trueStyle: Record<string, string>,
  falseStyle: Record<string, string>
) {
  const { result } = useExpression(expression)

  const style = computed(() => {
    return result.value ? trueStyle : falseStyle
  })

  return style
}

/**
 * Composable for conditional class names based on expression
 */
export function useConditionalClass(
  expression: string | undefined,
  trueClass: string,
  falseClass: string
) {
  const { result } = useExpression(expression)

  const className = computed(() => {
    return result.value ? trueClass : falseClass
  })

  return className
}
