<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { CreateNhanVienRequest, NhanVienDto, UpdateNhanVienRequest } from '../api/models'
import { getErrorMessage } from '../api/http'
import { createNhanVien, deleteNhanVien, listNhanVien, updateNhanVien } from '../api/nhanVienApi'

const vaiTroOptions = ['admin', 'lễ tân', 'quản lý', 'kế toán']

const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)
const rows = ref<NhanVienDto[]>([])

const dialogOpen = ref(false)
const editingId = ref<number | null>(null)

const createForm = reactive<CreateNhanVienRequest>({
  tenNv: '',
  vaiTro: '',
  username: '',
  password: '',
})

const updateForm = reactive<UpdateNhanVienRequest>({
  tenNv: null,
  vaiTro: null,
  username: '',
  password: null,
})

const tenNvModel = computed({
  get: () => (editingId.value == null ? createForm.tenNv : updateForm.tenNv),
  set: (v: string | null | undefined) => {
    if (editingId.value == null) createForm.tenNv = (v ?? '') as any
    else updateForm.tenNv = (v ?? null) as any
  },
})

const vaiTroModel = computed({
  get: () => (editingId.value == null ? createForm.vaiTro : updateForm.vaiTro),
  set: (v: string | null | undefined) => {
    if (editingId.value == null) createForm.vaiTro = (v ?? '') as any
    else updateForm.vaiTro = (v ?? null) as any
  },
})

const usernameModel = computed({
  get: () => (editingId.value == null ? createForm.username : updateForm.username),
  set: (v: string) => {
    if (editingId.value == null) createForm.username = v
    else updateForm.username = v
  },
})

const passwordModel = computed({
  get: () => (editingId.value == null ? createForm.password : updateForm.password),
  set: (v: string | null | undefined) => {
    if (editingId.value == null) createForm.password = (v ?? '') as any
    else updateForm.password = (v ?? null) as any
  },
})

function openCreate() {
  editingId.value = null
  createForm.tenNv = ''
  createForm.vaiTro = ''
  createForm.username = ''
  createForm.password = ''
  dialogOpen.value = true
}

function openEdit(row: NhanVienDto) {
  editingId.value = row.maNv
  updateForm.tenNv = row.tenNv ?? null
  updateForm.vaiTro = row.vaiTro ?? null
  updateForm.username = row.username ?? ''
  updateForm.password = null
  dialogOpen.value = true
}

async function load() {
  loading.value = true
  try {
    const data = await listNhanVien({ page: page.value - 1, size: size.value })
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
    if (editingId.value == null) {
      if (!createForm.tenNv.trim() || !createForm.vaiTro.trim() || !createForm.username.trim() || !createForm.password.trim()) {
        ElMessage.warning('Tên, vai trò, username và password là bắt buộc')
        return
      }
      await createNhanVien(createForm)
      ElMessage.success('Tạo nhân viên thành công')
    } else {
      if (!updateForm.username.trim()) {
        ElMessage.warning('Username là bắt buộc')
        return
      }
      await updateNhanVien(editingId.value, updateForm)
      ElMessage.success('Cập nhật nhân viên thành công')
    }

    dialogOpen.value = false
    await load()
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}

async function remove(row: NhanVienDto) {
  try {
    await ElMessageBox.confirm(`Xóa nhân viên "${row.username ?? row.maNv}"?`, 'Xác nhận', { type: 'warning' })
    await deleteNhanVien(row.maNv)
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
        <el-button type="primary" @click="openCreate">Thêm nhân viên</el-button>
      </div>
      <div class="actions-right">
        <el-button @click="load">Tải lại</el-button>
      </div>
    </div>

    <el-table :data="rows" v-loading="loading" border style="width: 100%">
      <el-table-column prop="maNv" label="Mã" width="90" />
      <el-table-column prop="tenNv" label="Tên" min-width="200" />
      <el-table-column label="Vai trò" width="160">
        <template #default="scope">
          <el-tag v-if="scope.row.vaiTro" effect="light" type="warning">{{ scope.row.vaiTro }}</el-tag>
          <span v-else class="muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="Username" min-width="200" />
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

    <el-dialog v-model="dialogOpen" :title="editingId == null ? 'Thêm nhân viên' : 'Sửa nhân viên'" width="640px">
      <el-form label-width="130px">
        <el-form-item label="Tên">
          <el-input v-model="tenNvModel" />
        </el-form-item>
        <el-form-item label="Vai trò">
          <el-select v-model="vaiTroModel" filterable allow-create default-first-option placeholder="VD: lễ tân" style="width: 260px">
            <el-option v-for="s in vaiTroOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="Username" required>
          <el-input v-model="usernameModel" />
        </el-form-item>
        <el-form-item :label="editingId == null ? 'Password' : 'Password (tuỳ chọn)'" :required="editingId == null">
          <el-input
            v-model="passwordModel"
            show-password
            type="password"
            placeholder="Để trống khi sửa nếu không đổi"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogOpen = false">Hủy</el-button>
        <el-button type="primary" @click="save">Lưu</el-button>
      </template>
    </el-dialog>
  </div>
</template>
