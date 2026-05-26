<!-- src/views/ErrorView.vue - Error display view -->

<template>
  <div class="error-view">
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <h1 class="error-title">System Error</h1>

      <div class="error-details">
        <p class="error-message">{{ errorMessage }}</p>

        <div v-if="errorDetails" class="error-stack">
          <pre>{{ errorDetails }}</pre>
        </div>

        <div class="error-info">
          <p><strong>Config Version:</strong> {{ configVersion || 'N/A' }}</p>
          <p><strong>Timestamp:</strong> {{ timestamp }}</p>
          <p v-if="rollbackStatus"><strong>Rollback:</strong> {{ rollbackStatus }}</p>
        </div>
      </div>

      <div class="error-actions">
        <button @click="handleRetry" class="action-button primary">
          Retry
        </button>
        <button @click="handleRollback" class="action-button secondary">
          Rollback to Previous Version
        </button>
        <button @click="handleExportLogs" class="action-button">
          Export Logs
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const errorMessage = ref(route.query.message as string || 'An unknown error occurred')
const errorDetails = ref(route.query.details as string || '')
const configVersion = ref(route.query.version as string || '')
const rollbackStatus = ref(route.query.rollback as string || '')
const timestamp = ref(new Date().toLocaleString())

const handleRetry = () => {
  console.log('[ErrorView] Retrying...')
  router.push('/')
}

const handleRollback = () => {
  console.log('[ErrorView] Rolling back...')
  // Implement rollback logic
  alert('Rollback functionality not yet implemented')
}

const handleExportLogs = () => {
  console.log('[ErrorView] Exporting logs...')
  // Implement log export
  alert('Log export functionality not yet implemented')
}

onMounted(() => {
  console.error('[ErrorView] Error view mounted:', {
    message: errorMessage.value,
    details: errorDetails.value,
    version: configVersion.value
  })
})
</script>

<style scoped>
.error-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #1a1a1a;
  color: #e5e5e5;
  padding: 2rem;
}

.error-container {
  max-width: 800px;
  width: 100%;
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.error-icon {
  font-size: 4rem;
  text-align: center;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 2rem;
  color: #ef4444;
  text-align: center;
  margin-bottom: 2rem;
}

.error-details {
  margin-bottom: 2rem;
}

.error-message {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #fca5a5;
}

.error-stack {
  background-color: #1a1a1a;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
}

.error-stack pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #fbbf24;
}

.error-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #404040;
  font-size: 0.9rem;
  color: #a3a3a3;
}

.error-info p {
  margin: 0.5rem 0;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border: 1px solid #404040;
  background-color: #333;
  color: #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: #404040;
}

.action-button.primary {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.action-button.primary:hover {
  background-color: #2563eb;
}

.action-button.secondary {
  background-color: #f59e0b;
  border-color: #f59e0b;
  color: white;
}

.action-button.secondary:hover {
  background-color: #d97706;
}
</style>
