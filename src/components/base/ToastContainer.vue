<!-- src/components/base/ToastContainer.vue - Toast notification container -->

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-${toast.type}`"
        @click="removeToast(toast.id)"
      >
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M12 8V14M12 18H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="toast-content">
          <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" @click.stop="removeToast(toast.id)">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <!-- Progress bar for auto-close -->
        <div
          v-if="toast.duration && toast.duration > 0"
          class="toast-progress"
          :style="{ animationDuration: `${toast.duration}ms` }"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { ToastItem } from '@/services/toast-service'
import { toastService } from '@/services/toast-service'

const toasts = ref<ToastItem[]>([])

let unsubscribe: (() => void) | null = null

onMounted(() => {
  // Subscribe to toast changes
  unsubscribe = toastService.subscribe((newToasts) => {
    toasts.value = newToasts
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

function removeToast(id: string) {
  toastService.remove(id)
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  min-width: 300px;
}

.toast-item:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Type-specific styles */
.toast-success {
  border-left: 4px solid #10b981;
}

.toast-success .toast-icon {
  color: #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-error .toast-icon {
  color: #ef4444;
}

.toast-warning {
  border-left: 4px solid #f59e0b;
}

.toast-warning .toast-icon {
  color: #f59e0b;
}

.toast-info {
  border-left: 4px solid #3b82f6;
}

.toast-info .toast-icon {
  color: #3b82f6;
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.toast-icon svg {
  width: 100%;
  height: 100%;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  color: #0f172a;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  word-wrap: break-word;
}

.toast-close {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  padding: 0;
}

.toast-close:hover {
  background-color: #f1f5f9;
  color: #475569;
}

.toast-close svg {
  width: 16px;
  height: 16px;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background-color: currentColor;
  opacity: 0.3;
  animation: toast-progress linear forwards;
}

@keyframes toast-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Transition animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .toast-item {
    background-color: #1e293b;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .toast-title {
    color: #f1f5f9;
  }

  .toast-message {
    color: #cbd5e1;
  }

  .toast-close:hover {
    background-color: #334155;
    color: #e2e8f0;
  }
}
</style>
