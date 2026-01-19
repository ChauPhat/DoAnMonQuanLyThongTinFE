<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

import { getErrorMessage } from '../api/http'
import type {
  DatPhongNhanhRequest,
  DoanhThuTheoThangRequest,
  KhachHangDto,
  NhanPhongRequest,
  NhanVienDto,
  PhongDaDatRequest,
  PhongDto,
  TraPhongRequest,
} from '../api/models'
import { listKhachHang } from '../api/khachHangApi'
import { listNhanVien } from '../api/nhanVienApi'
import {
  procDatPhongNhanh,
  procDanhSachDatPhong,
  procDoanhThu,
  procNhanPhong,
  procPhongDaDat,
  procPhongTrong,
  procThongTinDatPhong,
  procTraPhong,
} from '../api/procedureApi'

function toLocalDateTimeString(date: Date): string {
  return dayjs(date).format('YYYY-MM-DDTHH:mm:ss')
}

const loadingKhachHang = ref(false)
const khachHangOptions = ref<KhachHangDto[]>([])

const loadingNhanVien = ref(false)
const nhanVienOptions = ref<NhanVienDto[]>([])

const loadingPhongTrong = ref(false)
const phongTrong = ref<PhongDto[]>([])

const loadingPhongDaDat = ref(false)
const phongDaDat = ref<PhongDto[]>([])

const datPhongForm = reactive<{
  maKh: number | null
  maNv: number | null
  ngayNhan: Date | null
  ngayTra: Date | null
  maPhong: number[]
}>({
  maKh: null,
  maNv: null,
  ngayNhan: null,
  ngayTra: null,
  maPhong: [],
})

const traPhongForm = reactive<{ maDatPhong: number | null }>({
  maDatPhong: null,
})

const nhanPhongForm = reactive<{ maDatPhong: number | null }>({
  maDatPhong: null,
})

const loadingDatPhongOptions = ref(false)
const datPhongOptions = ref<Array<{ maDatPhong: number; raw: unknown }>>([])
const datPhongQuery = ref('')
const datPhongListAvailable = ref(true)

const recentMaDatPhongKey = 'recentMaDatPhong'
const warnedMissingDatPhongList = ref(false)

const showDatPhongDetail = ref(false)
const loadingDatPhongDetail = ref(false)
const datPhongDetail = ref<unknown>(null)

function datPhongOptionLabel(item: { maDatPhong: number; raw: unknown }): string {
  // Keep it robust: only require maDatPhong; show extras if present.
  const raw = item.raw as Record<string, unknown>
  const parts: string[] = [`#${item.maDatPhong}`]
  const kh = raw?.hoTenKh ?? raw?.tenKhachHang ?? raw?.khachHang
  if (typeof kh === 'string' && kh.trim()) parts.push(kh.trim())
  const nn = raw?.ngayNhan
  const nt = raw?.ngayTra
  if (typeof nn === 'string' && typeof nt === 'string') parts.push(`${nn} → ${nt}`)
  return parts.join(' - ')
}

async function loadDatPhongOptions(q?: string) {
  if (!datPhongListAvailable.value) return
  loadingDatPhongOptions.value = true
  try {
    const data = await procDanhSachDatPhong({ limit: 50, q: (q ?? datPhongQuery.value).trim() || null })
    datPhongOptions.value = (data ?? [])
      .map((x: any) => ({ maDatPhong: Number(x?.maDatPhong), raw: x }))
      .filter((x) => Number.isFinite(x.maDatPhong) && x.maDatPhong > 0)
  } catch (e) {
    const status = (e as any)?.response?.status
    if (status === 404) {
      datPhongListAvailable.value = false
      if (!warnedMissingDatPhongList.value) {
        warnedMissingDatPhongList.value = true
        ElMessage.warning('Backend chưa có API /api/proc/danh-sach-dat-phong. Đang dùng danh sách mã gần đây (local).')
      }
      return
    }
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingDatPhongOptions.value = false
  }
}

function onDatPhongRemoteSearch(q: string) {
  datPhongQuery.value = q
  void loadDatPhongOptions(q)
}

function onDatPhongDropdownVisible(visible: boolean) {
  if (!visible) return
  if (!datPhongOptions.value.length) {
    void loadDatPhongOptions('')
  }
}

function addRecentMaDatPhong(id: number) {
  if (!Number.isFinite(id) || id <= 0) return
  const existing = datPhongOptions.value.find((x) => x.maDatPhong === id)
  if (existing) {
    datPhongOptions.value = [existing, ...datPhongOptions.value.filter((x) => x.maDatPhong !== id)]
    try {
      localStorage.setItem(
        recentMaDatPhongKey,
        JSON.stringify(datPhongOptions.value.map((x) => x.maDatPhong).slice(0, 50))
      )
    } catch {
      // ignore
    }
    return
  }
  datPhongOptions.value = [{ maDatPhong: id, raw: { maDatPhong: id } }, ...datPhongOptions.value]
  try {
    localStorage.setItem(
      recentMaDatPhongKey,
      JSON.stringify(datPhongOptions.value.map((x) => x.maDatPhong).slice(0, 50))
    )
  } catch {
    // ignore
  }
}

function loadRecentMaDatPhongFromStorage() {
  try {
    const raw = localStorage.getItem(recentMaDatPhongKey)
    if (!raw) return
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return
    const ids = parsed
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x) && x > 0)
      .slice(0, 50)
    if (!ids.length) return
    if (!datPhongOptions.value.length) {
      datPhongOptions.value = ids.map((id) => ({ maDatPhong: id, raw: { maDatPhong: id } }))
    }
  } catch {
    // ignore
  }
}

function coercePositiveInt(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isFinite(n)) return null
  const i = Math.trunc(n)
  return i > 0 ? i : null
}

const doanhThuForm = reactive<DoanhThuTheoThangRequest>({
  thang: new Date().getMonth() + 1,
  nam: new Date().getFullYear(),
})

const doanhThuValue = ref<number | string | null>(null)
const lastMaDatPhong = ref<number | null>(null)

const phongDaDatForm = reactive<{ tuNgay: Date | null; denNgay: Date | null }>({
  tuNgay: null,
  denNgay: null,
})

function phongLabel(p: PhongDto): string {
  const ten = p.tenPhong ?? 'Phòng'
  const tang = p.tang != null ? `Tầng ${p.tang}` : ''
  return `${ten} (#${p.maPhong})${tang ? ` - ${tang}` : ''}`
}

async function loadKhachHangOptions() {
  loadingKhachHang.value = true
  try {
    const page = await listKhachHang({ page: 0, size: 200 })
    khachHangOptions.value = page.content
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingKhachHang.value = false
  }
}

async function loadNhanVienOptions() {
  loadingNhanVien.value = true
  try {
    const page = await listNhanVien({ page: 0, size: 200 })
    nhanVienOptions.value = page.content
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingNhanVien.value = false
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

async function runDatPhong() {
  try {
    if (!datPhongForm.maKh || !datPhongForm.maNv || !datPhongForm.ngayNhan || !datPhongForm.ngayTra) {
      ElMessage.warning('Chọn khách hàng, nhân viên, ngày nhận, ngày trả')
      return
    }

    if (!(datPhongForm.ngayTra.getTime() > datPhongForm.ngayNhan.getTime())) {
      ElMessage.warning('ngayTra phải lớn hơn ngayNhan')
      return
    }

    if (!datPhongForm.maPhong.length) {
      ElMessage.warning('Chọn ít nhất 1 phòng')
      return
    }

    const body: DatPhongNhanhRequest = {
      maKh: datPhongForm.maKh,
      maNv: datPhongForm.maNv,
      ngayNhan: toLocalDateTimeString(datPhongForm.ngayNhan),
      ngayTra: toLocalDateTimeString(datPhongForm.ngayTra),
      maPhong: datPhongForm.maPhong,
    }

    const maDatPhong = await procDatPhongNhanh(body)
    lastMaDatPhong.value = maDatPhong
    traPhongForm.maDatPhong = maDatPhong
    nhanPhongForm.maDatPhong = maDatPhong
    addRecentMaDatPhong(maDatPhong)
    void loadDatPhongOptions()
    ElMessage.success(`Đặt phòng thành công. Mã đặt phòng: ${maDatPhong}`)
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}

async function runNhanPhong() {
  try {
    const maDatPhong = coercePositiveInt(nhanPhongForm.maDatPhong)
    if (!maDatPhong) {
      ElMessage.warning('Nhập mã đặt phòng')
      return
    }
    const body: NhanPhongRequest = { maDatPhong }
    await procNhanPhong(body)
    addRecentMaDatPhong(maDatPhong)
    ElMessage.success('Gọi procedure nhận phòng thành công')
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}

async function runTraPhong() {
  try {
    const maDatPhong = coercePositiveInt(traPhongForm.maDatPhong)
    if (!maDatPhong) {
      ElMessage.warning('Nhập mã đặt phòng')
      return
    }
    const body: TraPhongRequest = { maDatPhong }
    await procTraPhong(body)
    addRecentMaDatPhong(maDatPhong)
    ElMessage.success('Gọi procedure trả phòng thành công')
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}

async function openDatPhongDetail() {
  const id = coercePositiveInt(nhanPhongForm.maDatPhong ?? traPhongForm.maDatPhong)
  if (!id) {
    ElMessage.warning('Chọn mã đặt phòng để xem')
    return
  }
  showDatPhongDetail.value = true
  loadingDatPhongDetail.value = true
  datPhongDetail.value = null
  try {
    datPhongDetail.value = await procThongTinDatPhong(id)
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingDatPhongDetail.value = false
  }
}

async function runDoanhThu() {
  try {
    doanhThuValue.value = await procDoanhThu(doanhThuForm)
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  }
}

async function runPhongDaDat() {
  try {
    if (!phongDaDatForm.tuNgay || !phongDaDatForm.denNgay) {
      ElMessage.warning('Nhập đủ từ ngày và đến ngày')
      return
    }

    if (!(phongDaDatForm.denNgay.getTime() > phongDaDatForm.tuNgay.getTime())) {
      ElMessage.warning('denNgay phải lớn hơn tuNgay')
      return
    }

    const body: PhongDaDatRequest = {
      tuNgay: toLocalDateTimeString(phongDaDatForm.tuNgay),
      denNgay: toLocalDateTimeString(phongDaDatForm.denNgay),
    }

    loadingPhongDaDat.value = true
    phongDaDat.value = await procPhongDaDat(body)
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingPhongDaDat.value = false
  }
}

onMounted(async () => {
  loadRecentMaDatPhongFromStorage()
  await Promise.all([loadKhachHangOptions(), loadNhanVienOptions(), loadPhongTrong()])
})
</script>

<template>
  <div class="page-card">
    <el-tabs type="border-card">
      <el-tab-pane label="Đặt phòng (PROC)">
        <el-form label-width="160px" style="max-width: 720px">
          <el-form-item label="Khách hàng (maKh)">
            <el-select
              v-model="datPhongForm.maKh"
              filterable
              clearable
              placeholder="Chọn khách hàng"
              :loading="loadingKhachHang"
              style="width: 100%"
            >
              <el-option
                v-for="kh in khachHangOptions"
                :key="kh.maKh"
                :label="`${kh.hoTen} (#${kh.maKh})`"
                :value="kh.maKh"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Nhân viên (maNv)">
            <el-select
              v-model="datPhongForm.maNv"
              filterable
              clearable
              placeholder="Chọn nhân viên"
              :loading="loadingNhanVien"
              style="width: 100%"
            >
              <el-option
                v-for="nv in nhanVienOptions"
                :key="nv.maNv"
                :label="`${nv.tenNv ?? 'Nhân viên'} (#${nv.maNv})`"
                :value="nv.maNv"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Ngày nhận">
            <el-date-picker v-model="datPhongForm.ngayNhan" type="datetime" format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item label="Ngày trả">
            <el-date-picker v-model="datPhongForm.ngayTra" type="datetime" format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>

          <el-form-item label="Chọn phòng (maPhong)" required>
            <div style="width: 100%">
              <el-select
                v-model="datPhongForm.maPhong"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                placeholder="Chọn 1 hoặc nhiều phòng trống"
                :loading="loadingPhongTrong"
                style="width: 100%"
              >
                <el-option v-for="p in phongTrong" :key="p.maPhong" :label="phongLabel(p)" :value="p.maPhong" />
              </el-select>
              <div style="margin-top: 8px">
                <el-button size="small" @click="loadPhongTrong">Reload phòng trống</el-button>
              </div>
              <div class="muted" style="margin-top: 6px">
                Procedure <b>dat-phong-nhanh</b> tự tạo chi tiết đặt phòng + dùng function/trigger.
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="runDatPhong">Gọi procedure</el-button>
            <el-tag v-if="lastMaDatPhong != null" style="margin-left: 10px" type="success" effect="light">
              Mã mới: {{ lastMaDatPhong }}
            </el-tag>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="Nhận phòng (PROC)">
        <el-form label-width="160px" style="max-width: 720px">
          <el-form-item label="Mã đặt phòng (maDatPhong)">
            <el-select
              v-model="nhanPhongForm.maDatPhong"
              filterable
              clearable
              allow-create
              default-first-option
              :remote="datPhongListAvailable"
              :remote-method="onDatPhongRemoteSearch"
              :loading="loadingDatPhongOptions"
              @visible-change="onDatPhongDropdownVisible"
              placeholder="Tìm/chọn hoặc nhập mã đặt phòng"
              style="width: 100%"
            >
              <el-option
                v-for="item in datPhongOptions"
                :key="item.maDatPhong"
                :label="datPhongOptionLabel(item)"
                :value="item.maDatPhong"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="runNhanPhong">Gọi procedure</el-button>
            <el-button @click="openDatPhongDetail">Xem thông tin</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="Trả phòng (PROC)">
        <el-form label-width="160px" style="max-width: 720px">
          <el-form-item label="Mã đặt phòng (maDatPhong)">
            <el-select
              v-model="traPhongForm.maDatPhong"
              filterable
              clearable
              allow-create
              default-first-option
              :remote="datPhongListAvailable"
              :remote-method="onDatPhongRemoteSearch"
              :loading="loadingDatPhongOptions"
              @visible-change="onDatPhongDropdownVisible"
              placeholder="Tìm/chọn hoặc nhập mã đặt phòng"
              style="width: 100%"
            >
              <el-option
                v-for="item in datPhongOptions"
                :key="item.maDatPhong"
                :label="datPhongOptionLabel(item)"
                :value="item.maDatPhong"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="runTraPhong">Gọi procedure</el-button>
            <el-button @click="openDatPhongDetail">Xem thông tin</el-button>
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

      <el-tab-pane label="Phòng đã đặt (PROC)">
        <el-form label-width="160px" style="max-width: 720px">
          <el-form-item label="Từ ngày (tuNgay)" required>
            <el-date-picker v-model="phongDaDatForm.tuNgay" type="datetime" format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item label="Đến ngày (denNgay)" required>
            <el-date-picker v-model="phongDaDatForm.denNgay" type="datetime" format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="runPhongDaDat">Tải danh sách phòng đã đặt</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="phongDaDat" v-loading="loadingPhongDaDat" border style="width: 100%">
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

    <el-dialog v-model="showDatPhongDetail" title="Thông tin đặt phòng" width="720px">
      <div v-loading="loadingDatPhongDetail" style="min-height: 120px">
        <pre style="white-space: pre-wrap; margin: 0">{{ JSON.stringify(datPhongDetail, null, 2) }}</pre>
      </div>
      <template #footer>
        <el-button @click="showDatPhongDetail = false">Đóng</el-button>
      </template>
    </el-dialog>
  </div>
</template>
