// src/composables/useToast.ts - Composable for toast notifications

import { inject } from 'vue'
import type { ToastType } from '@/services/toast-service'

export interface UseToastReturn {
  showMessage: (message: string, type?: ToastType, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showToast: (message: string, options?: { type?: ToastType; duration?: number; title?: string }) => void
}

/**
 * Composable for using toast notifications in components
 * Provides convenient methods for showing different types of messages
 */
export function useToast(): UseToastReturn {
  // Try to inject toast service from provide/inject
  const toastService = inject<any>('toastService', null)

  // Fallback to direct import if not provided
  const getToastService = () => {
    if (toastService) {
      return toastService
    }
    // Lazy import to avoid circular dependencies
    return import('@/services/toast-service').then(m => m.toastService)
  }

  const showMessage = async (message: string, type: ToastType = 'info', duration?: number) => {
    const service = await getToastService()
    service.show({ message, type, duration })
  }

  const showInfo = async (message: string, duration?: number) => {
    const service = await getToastService()
    service.info(message, duration)
  }

  const showSuccess = async (message: string, duration?: number) => {
    const service = await getToastService()
    service.success(message, duration)
  }

  const showWarning = async (message: string, duration?: number) => {
    const service = await getToastService()
    service.warning(message, duration)
  }

  const showError = async (message: string, duration?: number) => {
    const service = await getToastService()
    service.error(message, duration)
  }

  const showToast = async (
    message: string,
    options?: { type?: ToastType; duration?: number; title?: string }
  ) => {
    const service = await getToastService()
    service.show({ message, ...options })
  }

  return {
    showMessage,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showToast
  }
}
