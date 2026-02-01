<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import SqlPreview from '../components/SqlPreview.vue'

const loadingSecurity = ref(false)
const loadingImportExport = ref(false)
const loadingBackupRestore = ref(false)

const sqlSecurity = ref<string>('')
const sqlImportExport = ref<string>('')
const sqlBackupRestore = ref<string>('')

async function loadSqlFile(path: string): Promise<string> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

async function loadAll() {
  loadingSecurity.value = true
  loadingImportExport.value = true
  loadingBackupRestore.value = true
  try {
    const [security, impExp, backupRestore] = await Promise.all([
      loadSqlFile('/sql/02_security.sql'),
      loadSqlFile('/sql/05_import_export.sql'),
      loadSqlFile('/sql/03_backup_restore.sql'),
    ])
    sqlSecurity.value = security
    sqlImportExport.value = impExp
    sqlBackupRestore.value = backupRestore
  } catch (e) {
    ElMessage.error(`Không tải được file SQL an toàn thông tin: ${(e as any)?.message ?? 'lỗi'}`)
  } finally {
    loadingSecurity.value = false
    loadingImportExport.value = false
    loadingBackupRestore.value = false
  }
}

onMounted(() => {
  void loadAll()
})
</script>

<template>
  <div class="page-card">
    <h2 style="margin: 0 0 8px">An toàn thông tin</h2>
    <div class="muted" style="margin-bottom: 12px">
      Mục này trình bày trực tiếp các câu lệnh SQL (đọc từ thư mục <b>/public/sql/</b>) để demo ngay trên web.
    </div>

    <div class="page-actions" style="border-bottom: none; padding: 0 0 12px">
      <div class="actions-left" />
      <div class="actions-right">
        <el-button size="small" @click="loadAll">Reload</el-button>
      </div>
    </div>

    <el-tabs type="border-card">
      <el-tab-pane label="Xác thực + Phân quyền">
        <div v-loading="loadingSecurity" style="min-height: 120px">
          <SqlPreview v-if="sqlSecurity" title="02_security.sql" :sql="sqlSecurity" />
          <el-empty v-else description="Chưa có nội dung" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Import / Export">
        <div v-loading="loadingImportExport" style="min-height: 120px">
          <SqlPreview v-if="sqlImportExport" title="05_import_export.sql" :sql="sqlImportExport" />
          <el-empty v-else description="Chưa có nội dung" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Backup / Restore">
        <div v-loading="loadingBackupRestore" style="min-height: 120px">
          <SqlPreview v-if="sqlBackupRestore" title="03_backup_restore.sql" :sql="sqlBackupRestore" />
          <el-empty v-else description="Chưa có nội dung" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
