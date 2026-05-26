<!-- src/components/DebugPanel.vue - Debug information panel -->

<template>
  <div class="debug-panel">
    <div class="debug-header">
      <h3>Debug Panel</h3>
      <button @click="$emit('close')" class="close-button">×</button>
    </div>

    <div class="debug-content">
      <!-- System Info -->
      <section class="debug-section">
        <h4>System Info</h4>
        <div class="debug-row">
          <span class="label">FPS:</span>
          <span class="value">{{ fps }}</span>
        </div>
        <div class="debug-row">
          <span class="label">Memory:</span>
          <span class="value">{{ memoryUsage }} MB</span>
        </div>
      </section>

      <!-- Device Info -->
      <section class="debug-section">
        <h4>Device</h4>
        <div class="debug-row">
          <span class="label">Status:</span>
          <span class="value" :class="deviceStore.connectionStatus">
            {{ deviceStore.connectionStatus }}
          </span>
        </div>
        <div v-if="deviceStore.connectedDevice" class="debug-row">
          <span class="label">Device:</span>
          <span class="value">{{ deviceStore.connectedDevice.name }}</span>
        </div>
      </section>

      <!-- Variable Scheduler -->
      <section class="debug-section">
        <h4>Variables</h4>
        <div class="debug-row">
          <span class="label">Subscribed:</span>
          <span class="value">{{ schedulerStats.subscribedVariables }}</span>
        </div>
        <div class="debug-row">
          <span class="label">Cached:</span>
          <span class="value">{{ schedulerStats.cachedVariables }}</span>
        </div>
        <div class="debug-row">
          <span class="label">Pending Writes:</span>
          <span class="value">{{ schedulerStats.pendingWrites }}</span>
        </div>
      </section>

      <!-- Project Info -->
      <section class="debug-section">
        <h4>Project</h4>
        <div v-if="projectStore.currentProject" class="debug-row">
          <span class="label">Name:</span>
          <span class="value">{{ projectStore.currentProject.name }}</span>
        </div>
        <div v-if="projectStore.currentProject" class="debug-row">
          <span class="label">Version:</span>
          <span class="value">{{ projectStore.currentProject.version }}</span>
        </div>
        <div class="debug-row">
          <span class="label">Page:</span>
          <span class="value">{{ projectStore.currentPage?.name || 'N/A' }}</span>
        </div>
        <div class="debug-row">
          <span class="label">Components:</span>
          <span class="value">{{ projectStore.components.length }}</span>
        </div>
      </section>

      <!-- Recent Logs -->
      <section class="debug-section">
        <h4>Recent Logs</h4>
        <div class="log-list">
          <div v-for="(log, index) in recentLogs" :key="index" class="log-entry">
            <span class="log-time">{{ log.time }}</span>
            <span :class="['log-level', log.level]">{{ log.level }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div v-if="recentLogs.length === 0" class="no-logs">No recent logs</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useDeviceStore } from '@/stores/device'
import { variableScheduler } from '@/services/variable-scheduler'

const projectStore = useProjectStore()
const deviceStore = useDeviceStore()

const fps = ref(60)
const memoryUsage = ref(0)
const schedulerStats = ref({
  subscribedVariables: 0,
  cachedVariables: 0,
  pendingWrites: 0
})
const recentLogs = ref<Array<{ time: string; level: string; message: string }>>([])

let updateInterval: number | null = null

const updateStats = () => {
  // Update scheduler stats
  schedulerStats.value = variableScheduler.getStats()

  // Update memory (if available)
  if ((performance as any).memory) {
    memoryUsage.value = Math.round(
      ((performance as any).memory.usedJSHeapSize / 1024 / 1024) * 100
    ) / 100
  }
}

onMounted(() => {
  updateStats()
  updateInterval = window.setInterval(updateStats, 1000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 350px;
  max-height: 80vh;
  background-color: rgba(0, 0, 0, 0.9);
  color: #e5e5e5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  overflow: hidden;
  font-family: monospace;
  font-size: 0.85rem;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #1a1a1a;
  border-bottom: 1px solid #333;
}

.debug-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #3b82f6;
}

.close-button {
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  line-height: 1;
}

.close-button:hover {
  color: #fff;
}

.debug-content {
  overflow-y: auto;
  max-height: calc(80vh - 50px);
  padding: 1rem;
}

.debug-section {
  margin-bottom: 1.5rem;
}

.debug-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #60a5fa;
  border-bottom: 1px solid #333;
  padding-bottom: 0.25rem;
}

.debug-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.debug-row .label {
  color: #9ca3af;
}

.debug-row .value {
  color: #e5e5e5;
  font-weight: bold;
}

.debug-row .value.connected {
  color: #10b981;
}

.debug-row .value.disconnected {
  color: #ef4444;
}

.debug-row .value.connecting {
  color: #f59e0b;
}

.log-list {
  background-color: #1a1a1a;
  border-radius: 4px;
  padding: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.75rem;
}

.log-time {
  color: #6b7280;
  min-width: 60px;
}

.log-level {
  min-width: 50px;
  font-weight: bold;
}

.log-level.info {
  color: #3b82f6;
}

.log-level.warn {
  color: #f59e0b;
}

.log-level.error {
  color: #ef4444;
}

.log-message {
  color: #d1d5db;
  flex: 1;
  word-break: break-word;
}

.no-logs {
  color: #6b7280;
  text-align: center;
  padding: 1rem;
}
</style>
