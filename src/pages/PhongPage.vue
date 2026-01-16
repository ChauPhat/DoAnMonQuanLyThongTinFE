<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { PhongDto } from '../api/models'
import { getErrorMessage } from '../api/http'
import { createPhong, deletePhong, listPhong, updatePhong, type UpsertPhongRequest } from '../api/phongApi'

const phongTrangThaiOptions = ['trống', 'đang thuê', 'bảo trì'] as const

const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)
const rows = ref<PhongDto[]>([])

const dialogOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<UpsertPhongRequest>({
  maLoaiPhong: 1,
  tenPhong: null,
  tang: null,
  trangThai: 'trống',
})

function openCreate() {
  editingId.value = null
  form.maLoaiPhong = 1
  form.tenPhong = null
  form.tang = null
  // Khớp với CHECK constraint trong DB
  form.trangThai = 'trống'
  dialogOpen.value = true
}

function openEdit(row: PhongDto) {
  editingId.value = row.maPhong
  form.maLoaiPhong = row.maLoaiPhong ?? 1
  form.tenPhong = row.tenPhong ?? null
  form.tang = row.tang ?? null
  form.trangThai = row.trangThai ?? 'trống'
  dialogOpen.value = true
}

async function load() {
  loading.value = true
  try {
    const data = await listPhong({ page: page.value - 1, size: size.value })
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
    if (!form.maLoaiPhong) {
      ElMessage.warning('Mã loại phòng là bắt buộc')
      return
    }

    if (editingId.value == null) {
      await createPhong(form)
      ElMessage.success('Tạo phòng thành công')
    } else {
      await updatePhong(editingId.value, form)
      ElMessage.success('Cập nhật phòng thành công')
    }
    dialogOpen.value = false
    await load()
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}

async function remove(row: PhongDto) {
  try {
    await ElMessageBox.confirm(`Xóa phòng "${row.tenPhong ?? row.maPhong}"?`, 'Xác nhận', { type: 'warning' })
    await deletePhong(row.maPhong)
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
        <el-button type="primary" @click="openCreate">Thêm phòng</el-button>
      </div>
      <div class="actions-right">
        <el-button @click="load">Tải lại</el-button>
      </div>
    </div>

    <el-table :data="rows" v-loading="loading" border style="width: 100%">
      <el-table-column prop="maPhong" label="Mã" width="80" />
      <el-table-column prop="maLoaiPhong" label="Mã loại" width="100" />
      <el-table-column prop="tenPhong" label="Tên phòng" min-width="220" />
      <el-table-column prop="tang" label="Tầng" width="90" />
      <el-table-column prop="trangThai" label="Trạng thái" width="140" />
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

    <el-dialog v-model="dialogOpen" :title="editingId == null ? 'Thêm phòng' : 'Sửa phòng'" width="600px">
      <el-form label-width="120px">
        <el-form-item label="Mã loại phòng" required>
          <el-input-number v-model="form.maLoaiPhong" :min="1" />
        </el-form-item>
        <el-form-item label="Tên phòng">
          <el-input v-model="form.tenPhong" />
        </el-form-item>
        <el-form-item label="Tầng">
          <el-input-number v-model="form.tang" :min="0" />
        </el-form-item>
        <el-form-item label="Trạng thái">
          <el-select v-model="form.trangThai" placeholder="Chọn trạng thái" style="width: 240px">
            <el-option v-for="s in phongTrangThaiOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogOpen = false">Hủy</el-button>
        <el-button type="primary" @click="save">Lưu</el-button>
      </template>
    </el-dialog>
  </div>
</template>
