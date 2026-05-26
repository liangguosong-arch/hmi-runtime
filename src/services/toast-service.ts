// src/services/toast-service.ts - Global toast notification service

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number // milliseconds, 0 means no auto-close
  title?: string
}

export interface ToastItem extends ToastOptions {
  id: string
  createdAt: number
}

class ToastService {
  private toasts: ToastItem[] = []
  private listeners: Array<(toasts: ToastItem[]) => void> = []
  private nextId = 0

  /**
   * Subscribe to toast changes
   */
  subscribe(callback: (toasts: ToastItem[]) => void): () => void {
    this.listeners.push(callback)
    // Immediately notify with current state
    callback(this.toasts)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Show a toast notification
   */
  show(options: ToastOptions | string): string {
    const opts: ToastOptions = typeof options === 'string'
      ? { message: options, type: 'info' }
      : options

    const toast: ToastItem = {
      id: `toast-${++this.nextId}`,
      message: opts.message,
      type: opts.type || 'info',
      duration: opts.duration ?? 3000,
      title: opts.title,
      createdAt: Date.now()
    }

    this.toasts.push(toast)
    this.notifyListeners()

    // Auto-remove after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.remove(toast.id)
      }, toast.duration)
    }

    return toast.id
  }

  /**
   * Show info message
   */
  info(message: string, duration?: number): string {
    return this.show({ message, type: 'info', duration })
  }

  /**
   * Show success message
   */
  success(message: string, duration?: number): string {
    return this.show({ message, type: 'success', duration })
  }

  /**
   * Show warning message
   */
  warning(message: string, duration?: number): string {
    return this.show({ message, type: 'warning', duration })
  }

  /**
   * Show error message
   */
  error(message: string, duration?: number): string {
    return this.show({ message, type: 'error', duration })
  }

  /**
   * Remove a toast by ID
   */
  remove(id: string): void {
    const index = this.toasts.findIndex(t => t.id === id)
    if (index > -1) {
      this.toasts.splice(index, 1)
      this.notifyListeners()
    }
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toasts = []
    this.notifyListeners()
  }

  /**
   * Get current toasts
   */
  getToasts(): ToastItem[] {
    return [...this.toasts]
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }
}

// Singleton instance
export const toastService = new ToastService()
