<script setup lang="ts">
import { reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

import { getErrorMessage } from '../api/http'
import type {
  DatPhongRequest,
  DoanhThuTheoThangRequest,
  ThemChiTietDatPhongRequest,
  TraPhongRequest,
  PhongDto,
} from '../api/models'
import { procDatPhong, procDoanhThu, procPhongTrong, procThemChiTiet, procTraPhong } from '../api/procedureApi'

function toLocalDateTimeString(date: Date): string {
  return dayjs(date).format('YYYY-MM-DDTHH:mm:ss')
}

const loadingPhongTrong = ref(false)
const phongTrong = ref<PhongDto[]>([])

const datPhongForm = reactive<{ maKh: number | null; maNv: number | null; ngayNhan: Date | null; ngayTra: Date | null }>({
  maKh: null,
  maNv: null,
  ngayNhan: null,
  ngayTra: null,
})

const themChiTietForm = reactive<ThemChiTietDatPhongRequest>({
  maDatPhong: 0,
  maPhong: 0,
  donGia: 0,
})

const traPhongForm = reactive<TraPhongRequest>({
  maDatPhong: 0,
})

const doanhThuForm = reactive<DoanhThuTheoThangRequest>({
  thang: new Date().getMonth() + 1,
  nam: new Date().getFullYear(),
})

const doanhThuValue = ref<number | string | null>(null)

async function runDatPhong() {
  try {
    if (!datPhongForm.maKh || !datPhongForm.maNv || !datPhongForm.ngayNhan || !datPhongForm.ngayTra) {
      ElMessage.warning('Nhập đủ maKh, maNv, ngày nhận, ngày trả')
      return
    }

    const body: DatPhongRequest = {
      maKh: datPhongForm.maKh,
      maNv: datPhongForm.maNv,
      ngayNhan: toLocalDateTimeString(datPhongForm.ngayNhan),
      ngayTra: toLocalDateTimeString(datPhongForm.ngayTra),
    }

    await procDatPhong(body)
    ElMessage.success('Gọi procedure đặt phòng thành công')
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}

async function runThemChiTiet() {
  try {
    if (!themChiTietForm.maDatPhong || !themChiTietForm.maPhong || !themChiTietForm.donGia) {
      ElMessage.warning('Nhập đủ mã đặt phòng, mã phòng, đơn giá')
      return
    }
    await procThemChiTiet(themChiTietForm)
    ElMessage.success('Gọi procedure thêm chi tiết thành công')
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}

async function runTraPhong() {
  try {
    if (!traPhongForm.maDatPhong) {
      ElMessage.warning('Nhập mã đặt phòng')
      return
    }
    await procTraPhong(traPhongForm)
    ElMessage.success('Gọi procedure trả phòng thành công')
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}

async function loadPhongTrong() {
  loadingPhongTrong.value = true
  try {
    phongTrong.value = await procPhongTrong()
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingPhongTrong.value = false
  }
}

async function runDoanhThu() {
  try {
    doanhThuValue.value = await procDoanhThu(doanhThuForm)
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}
</script>

<template>
  <div class="page-card">
    <el-tabs type="border-card">
      <el-tab-pane label="Đặt phòng (PROC)">
        <el-form label-width="160px" style="max-width: 720px">
          <el-form-item label="Mã khách hàng (maKh)">
            <el-input-number v-model="datPhongForm.maKh" :min="1" />
          </el-form-item>
          <el-form-item label="Mã nhân viên (maNv)">
            <el-input-number v-model="datPhongForm.maNv" :min="1" />
          </el-form-item>
          <el-form-item label="Ngày nhận">
            <el-date-picker v-model="datPhongForm.ngayNhan" type="datetime" format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item label="Ngày trả">
            <el-date-picker v-model="datPhongForm.ngayTra" type="datetime" format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="runDatPhong">Gọi procedure</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="Thêm chi tiết (PROC)">
        <el-form label-width="160px" style="max-width: 720px">
          <el-form-item label="Mã đặt phòng (maDatPhong)">
            <el-input-number v-model="themChiTietForm.maDatPhong" :min="1" />
          </el-form-item>
          <el-form-item label="Mã phòng (maPhong)">
            <el-input-number v-model="themChiTietForm.maPhong" :min="1" />
          </el-form-item>
          <el-form-item label="Đơn giá">
            <el-input-number v-model="themChiTietForm.donGia" :min="0" :step="10000" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="runThemChiTiet">Gọi procedure</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="Trả phòng (PROC)">
        <el-form label-width="160px" style="max-width: 720px">
          <el-form-item label="Mã đặt phòng (maDatPhong)">
            <el-input-number v-model="traPhongForm.maDatPhong" :min="1" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="runTraPhong">Gọi procedure</el-button>
            <span class="muted" style="margin-left: 8px">Sau khi trả phòng, qua màn Phòng để kiểm tra trạng thái (trigger).</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="Phòng trống (PROC)">
        <div style="margin-bottom: 8px">
          <el-button type="primary" @click="loadPhongTrong">Tải danh sách phòng trống</el-button>
        </div>
        <el-table :data="phongTrong" v-loading="loadingPhongTrong" border style="width: 100%">
          <el-table-column prop="maPhong" label="Mã" width="80" />
          <el-table-column prop="maLoaiPhong" label="Mã loại" width="100" />
          <el-table-column prop="tenPhong" label="Tên" min-width="200" />
          <el-table-column prop="tang" label="Tầng" width="90" />
          <el-table-column prop="trangThai" label="Trạng thái" width="140" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Doanh thu (FUNC/PROC)">
        <el-form label-width="160px" style="max-width: 720px">
          <el-form-item label="Tháng">
            <el-input-number v-model="doanhThuForm.thang" :min="1" :max="12" />
          </el-form-item>
          <el-form-item label="Năm">
            <el-input-number v-model="doanhThuForm.nam" :min="2000" :max="2100" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="runDoanhThu">Tính doanh thu</el-button>
          </el-form-item>

          <el-form-item v-if="doanhThuValue != null" label="Kết quả">
            <el-tag type="success">{{ doanhThuValue }}</el-tag>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
