<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { KhachHangDto } from '../api/models'
import { getErrorMessage } from '../api/http'
import {
  createKhachHang,
  deleteKhachHang,
  listKhachHang,
  updateKhachHang,
  type UpsertKhachHangRequest,
} from '../api/khachHangApi'

const loading = ref(false)
const page = ref(1) // UI 1-based
const size = ref(10)
const total = ref(0)
const rows = ref<KhachHangDto[]>([])

const dialogOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<UpsertKhachHangRequest>({
  hoTen: '',
  cccd: null,
  dienThoai: null,
  email: null,
  diaChi: null,
})

function openCreate() {
  editingId.value = null
  form.hoTen = ''
  form.cccd = null
  form.dienThoai = null
  form.email = null
  form.diaChi = null
  dialogOpen.value = true
}

function openEdit(row: KhachHangDto) {
  editingId.value = row.maKh
  form.hoTen = row.hoTen
  form.cccd = row.cccd ?? null
  form.dienThoai = row.dienThoai ?? null
  form.email = row.email ?? null
  form.diaChi = row.diaChi ?? null
  dialogOpen.value = true
}

async function load() {
  loading.value = true
  try {
    const data = await listKhachHang({ page: page.value - 1, size: size.value })
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
    if (!form.hoTen?.trim()) {
      ElMessage.warning('Họ tên là bắt buộc')
      return
    }

    if (editingId.value == null) {
      await createKhachHang(form)
      ElMessage.success('Tạo khách hàng thành công')
    } else {
      await updateKhachHang(editingId.value, form)
      ElMessage.success('Cập nhật khách hàng thành công')
    }
    dialogOpen.value = false
    await load()
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}

async function remove(row: KhachHangDto) {
  try {
    await ElMessageBox.confirm(`Xóa khách hàng "${row.hoTen}"?`, 'Xác nhận', { type: 'warning' })
    await deleteKhachHang(row.maKh)
    ElMessage.success('Đã xóa')
    await load()
  } catch (e) {
    // cancel is ok
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
        <el-button type="primary" @click="openCreate">Thêm khách hàng</el-button>
      </div>
      <div class="actions-right">
        <el-button @click="load">Tải lại</el-button>
      </div>
    </div>

    <el-table :data="rows" v-loading="loading" border style="width: 100%">
      <el-table-column prop="maKh" label="Mã" width="80" />
      <el-table-column prop="hoTen" label="Họ tên" min-width="200" />
      <el-table-column prop="cccd" label="CCCD" width="140" />
      <el-table-column prop="dienThoai" label="Điện thoại" width="140" />
      <el-table-column prop="email" label="Email" min-width="200" />
      <el-table-column prop="diaChi" label="Địa chỉ" min-width="220" />
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

    <el-dialog v-model="dialogOpen" :title="editingId == null ? 'Thêm khách hàng' : 'Sửa khách hàng'" width="600px">
      <el-form label-width="110px">
        <el-form-item label="Họ tên" required>
          <el-input v-model="form.hoTen" />
        </el-form-item>
        <el-form-item label="CCCD">
          <el-input v-model="form.cccd" />
        </el-form-item>
        <el-form-item label="Điện thoại">
          <el-input v-model="form.dienThoai" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="Địa chỉ">
          <el-input v-model="form.diaChi" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogOpen = false">Hủy</el-button>
        <el-button type="primary" @click="save">Lưu</el-button>
      </template>
    </el-dialog>
  </div>
</template>
