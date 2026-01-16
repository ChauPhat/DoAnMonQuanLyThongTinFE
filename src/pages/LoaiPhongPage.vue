<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { LoaiPhongDto } from '../api/models'
import { getErrorMessage } from '../api/http'
import {
  createLoaiPhong,
  deleteLoaiPhong,
  listLoaiPhong,
  updateLoaiPhong,
  type UpsertLoaiPhongRequest,
} from '../api/loaiPhongApi'

const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)
const rows = ref<LoaiPhongDto[]>([])

const dialogOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<UpsertLoaiPhongRequest>({
  tenLoaiPhong: '',
  sucChua: 1,
  giaCoBan: 0,
  moTa: null,
})

function openCreate() {
  editingId.value = null
  form.tenLoaiPhong = ''
  form.sucChua = 1
  form.giaCoBan = 0
  form.moTa = null
  dialogOpen.value = true
}

function openEdit(row: LoaiPhongDto) {
  editingId.value = row.maLoaiPhong
  form.tenLoaiPhong = row.tenLoaiPhong
  form.sucChua = row.sucChua
  form.giaCoBan = row.giaCoBan
  form.moTa = row.moTa ?? null
  dialogOpen.value = true
}

async function load() {
  loading.value = true
  try {
    const data = await listLoaiPhong({ page: page.value - 1, size: size.value })
    rows.value = data.content
    total.value = data.totalElements
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loading.value = false
  }
}

async function save() {
  try {
    if (!form.tenLoaiPhong?.trim()) {
      ElMessage.warning('Tên loại phòng là bắt buộc')
      return
    }

    if (editingId.value == null) {
      await createLoaiPhong(form)
      ElMessage.success('Tạo loại phòng thành công')
    } else {
      await updateLoaiPhong(editingId.value, form)
      ElMessage.success('Cập nhật loại phòng thành công')
    }
    dialogOpen.value = false
    await load()
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}

async function remove(row: LoaiPhongDto) {
  try {
    await ElMessageBox.confirm(`Xóa loại phòng "${row.tenLoaiPhong}"?`, 'Xác nhận', { type: 'warning' })
    await deleteLoaiPhong(row.maLoaiPhong)
    ElMessage.success('Đã xóa')
    await load()
  } catch (e) {
    if (String((e as any)?.message || '').toLowerCase().includes('cancel')) return
    ElMessage.error(getErrorMessage(e))
  }
}

onMounted(load)
</script>

<template>
  <div class="page-card">
    <div class="page-actions">
      <div class="actions-left">
        <el-button type="primary" @click="openCreate">Thêm loại phòng</el-button>
      </div>
      <div class="actions-right">
        <el-button @click="load">Tải lại</el-button>
      </div>
    </div>

    <el-table :data="rows" v-loading="loading" border style="width: 100%">
      <el-table-column prop="maLoaiPhong" label="Mã" width="80" />
      <el-table-column prop="tenLoaiPhong" label="Tên" min-width="220" />
      <el-table-column prop="sucChua" label="Sức chứa" width="110" />
      <el-table-column prop="giaCoBan" label="Giá cơ bản" width="140" />
      <el-table-column prop="moTa" label="Mô tả" min-width="240" />
      <el-table-column label="Hành động" width="180" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openEdit(scope.row)">Sửa</el-button>
          <el-button size="small" type="danger" @click="remove(scope.row)">Xóa</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="display: flex; justify-content: flex-end; margin-top: 12px">
      <el-pagination
        background
        layout="prev, pager, next, sizes, total"
        :total="total"
        :page-size="size"
        :current-page="page"
        @update:current-page="(p:number) => { page = p; load() }"
        @update:page-size="(s:number) => { size = s; page = 1; load() }"
      />
    </div>

    <el-dialog v-model="dialogOpen" :title="editingId == null ? 'Thêm loại phòng' : 'Sửa loại phòng'" width="600px">
      <el-form label-width="120px">
        <el-form-item label="Tên" required>
          <el-input v-model="form.tenLoaiPhong" />
        </el-form-item>
        <el-form-item label="Sức chứa" required>
          <el-input-number v-model="form.sucChua" :min="1" />
        </el-form-item>
        <el-form-item label="Giá cơ bản" required>
          <el-input-number v-model="form.giaCoBan" :min="0" :step="10000" />
        </el-form-item>
        <el-form-item label="Mô tả">
          <el-input v-model="form.moTa" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogOpen = false">Hủy</el-button>
        <el-button type="primary" @click="save">Lưu</el-button>
      </template>
    </el-dialog>
  </div>
</template>
