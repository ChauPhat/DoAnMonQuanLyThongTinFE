<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = withDefaults(
  defineProps<{
    title?: string
    sql: string
    note?: string
  }>(),
  {
    title: 'SQL',
    note: '',
  }
)

const canCopy = computed(() => typeof navigator !== 'undefined' && !!navigator.clipboard?.writeText)

async function onCopy() {
  try {
    if (!canCopy.value) {
      ElMessage.warning('Trình duyệt không hỗ trợ copy clipboard')
      return
    }
    await navigator.clipboard.writeText(props.sql)
    ElMessage.success('Đã copy SQL')
  } catch {
    ElMessage.error('Copy thất bại')
  }
}
</script>

<template>
  <div class="sql-preview">
    <div class="sql-preview__header">
      <div class="sql-preview__title">{{ props.title }}</div>
      <div class="sql-preview__actions">
        <span v-if="props.note" class="muted">{{ props.note }}</span>
        <el-button size="small" @click="onCopy">Copy</el-button>
      </div>
    </div>

    <pre class="sql-preview__code"><code>{{ props.sql }}</code></pre>
  </div>
</template>

<style scoped>
.sql-preview {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.02);
  overflow: hidden;
  margin: 12px 0;
}

.sql-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.sql-preview__title {
  font-weight: 600;
}

.sql-preview__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sql-preview__code {
  margin: 0;
  padding: 12px;
  white-space: pre;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.45;
}
</style>
