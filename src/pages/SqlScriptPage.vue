<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import SqlPreview from '../components/SqlPreview.vue'

const loading = ref(false)
const sql = ref<string>('')

const sqlFiles = [
  { label: '01) ql_dat_phong.sql (full schema + data + objects)', path: '/sql/ql_dat_phong.sql' },
  { label: '02) 02_security.sql (xác thực/phân quyền)', path: '/sql/02_security.sql' },
  { label: '03) 03_backup_restore.sql (backup/restore)', path: '/sql/03_backup_restore.sql' },
  { label: '04) 04_reports.sql (report queries)', path: '/sql/04_reports.sql' },
  { label: '05) 05_import_export.sql (import/export)', path: '/sql/05_import_export.sql' },
]

const selectedPath = ref<string>(sqlFiles[0].path)
const selectedLabel = computed(() => sqlFiles.find((f) => f.path === selectedPath.value)?.label ?? selectedPath.value)

async function loadSql() {
  loading.value = true
  try {
    const res = await fetch(selectedPath.value, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    sql.value = await res.text()
  } catch (e) {
    ElMessage.error(`Không tải được file SQL (${selectedPath.value}): ${(e as any)?.message ?? 'lỗi'}`)
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
        <el-select v-model="selectedPath" :disabled="loading" style="width: 420px" @change="loadSql">
          <el-option v-for="f in sqlFiles" :key="f.path" :label="f.label" :value="f.path" />
        </el-select>
        <el-button style="margin-left: 8px" :loading="loading" @click="loadSql">Reload</el-button>
      </div>
    </div>

    <div class="muted" style="margin-bottom: 12px">
      File được load trực tiếp từ thư mục <b>/public/sql/</b> để thầy xem ngay trên web.
    </div>

    <div v-loading="loading" style="min-height: 140px">
      <SqlPreview v-if="sql" :title="selectedLabel" :sql="sql" />
      <el-empty v-else description="Chưa có nội dung SQL" />
    </div>
  </div>
</template>
