// src/composables/useVariable.ts - Variable binding composable

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { variableScheduler } from '@/services/variable-scheduler'
import type { Subscription, VariableConfig } from '@plc/hmi-types'

/**
 * Composable for binding to PLC variables
 * Automatically subscribes/unsubscribes based on component lifecycle
 */
export function useVariable(variable: VariableConfig | undefined) {
  const value = ref<any>(null)
  const quality = ref<string>('uncertain')
  const timestamp = ref<number>(0)
  let subscription: Subscription | null = null

  // Subscribe to variable changes
  onMounted(() => {
    if (!variable) return
    console.log(`[useVariable] Subscribing to `, variable)
    // Get initial value
    value.value = variableScheduler.getValue(variable)

    // Subscribe to updates
    console.log(`[runtime useVariable] Subscribing to `, variable)
    subscription = variableScheduler.subscribe(variable, (newValue: any) => {
      value.value = newValue
      // Note: quality and timestamp would need to be exposed from scheduler
      timestamp.value = Date.now()
      quality.value = 'good'
    })
  })

  // Unsubscribe on cleanup
  onUnmounted(() => {
    if (subscription) {
      subscription.unsubscribe()
      subscription = null
    }
  })

  // Write value to PLC
  const setValue = async (newValue: any) => {
    if (!variable) {
      console.warn('[useVariable] Cannot write: no address specified')
      return
    }

    try {
      await variableScheduler.write(variable, newValue)
    } catch (error) {
      console.error(`[useVariable] Failed to write ${variable.address}:`, error)
      throw error
    }
  }

  // Toggle boolean value
  const toggle = async () => {
    if (!variable) return
    const currentValue = variableScheduler.getValue(variable)
    await setValue(!currentValue)
  }

  return {
    value,
    quality,
    timestamp,
    setValue,
    toggle
  }
}

/**
 * Composable for binding to multiple variables
 */
export function useVariables(variables: VariableConfig[]) {
  const values = ref<Record<string, any>>({})
  const subscriptions: Subscription[] = []

  onMounted(() => {
    variables.forEach(variable => {
      // Get initial value
      values.value[variable.address] = variableScheduler.getValue(variable)

      // Subscribe to updates
      const subscription = variableScheduler.subscribe(variable, (newValue: any) => {
        values.value[variable.address] = newValue
      })

      subscriptions.push(subscription)
    })
  })

  onUnmounted(() => {
    subscriptions.forEach(sub => sub.unsubscribe())
    subscriptions.length = 0
  })

  const setValue = async (variable: VariableConfig, newValue: any) => {
    await variableScheduler.write(variable, newValue)
  }

  return {
    values,
    setValue
  }
}
