<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import SqlPreview from '../components/SqlPreview.vue'

const loading = ref(false)
const sql = ref<string>('')

async function loadSql() {
  loading.value = true
  try {
    const res = await fetch('/sql/ql_dat_phong.sql', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    sql.value = await res.text()
  } catch (e) {
    ElMessage.error(`Không tải được file SQL: ${(e as any)?.message ?? 'lỗi'}`)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadSql()
})
</script>

<template>
  <div class="page-card">
    <div class="page-actions">
      <div class="actions-left">
        <h2 style="margin: 0">SQL Script (toàn bộ)</h2>
      </div>
      <div class="actions-right">
        <el-button :loading="loading" @click="loadSql">Reload</el-button>
      </div>
    </div>

    <div class="muted" style="margin-bottom: 12px">
      File được load trực tiếp từ <b>/public/sql/ql_dat_phong.sql</b> để thầy xem ngay trên web.
    </div>

    <div v-loading="loading" style="min-height: 140px">
      <SqlPreview v-if="sql" title="ql_dat_phong.sql" :sql="sql" />
      <el-empty v-else description="Chưa có nội dung SQL" />
    </div>
  </div>
</template>
