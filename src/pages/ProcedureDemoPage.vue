<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

import { getErrorMessage } from '../api/http'
import SqlPreview from '../components/SqlPreview.vue'
import type {
  BaoCaoDoanhThuCursorDto,
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
import { listPhong } from '../api/phongApi'
import {
  procBaoCaoDoanhThuCursor,
  procDatPhongNhanh,
  procDanhSachDatPhong,
  procDoanhThu,
  procNhanPhong,
  procPhongDaDat,
  procPhongTrong,
  procThongTinDatPhong,
  procTraPhong,
} from '../api/procedureApi'

function sqlQuoteString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function sqlNullableNumber(value: number | null): string {
  return value == null ? 'NULL' : String(value)
}

function sqlNullableDate(value: Date | null): string {
  return value == null ? 'NULL' : sqlQuoteString(toLocalDateTimeString(value))
}

function sqlNullableCsvNumbers(values: number[]): string {
  const cleaned = (values ?? []).map((x) => Math.trunc(Number(x))).filter((x) => Number.isFinite(x) && x > 0)
  if (!cleaned.length) return 'NULL'
  return `N${sqlQuoteString(cleaned.join(','))}`
}

type SqlObjectKind = 'procedure' | 'trigger' | 'function'

const loadingSqlScript = ref(false)
const sqlScriptText = ref<string | null>(null)
const sqlScriptLoadError = ref<string | null>(null)

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function loadSqlScriptIfNeeded(force = false) {
  if (!force && sqlScriptText.value) return
  loadingSqlScript.value = true
  sqlScriptLoadError.value = null
  try {
    const res = await fetch('/sql/ql_dat_phong.sql', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status} khi tải /sql/ql_dat_phong.sql`)
    sqlScriptText.value = await res.text()
  } catch (e) {
    sqlScriptText.value = null
    sqlScriptLoadError.value = getErrorMessage(e)
  } finally {
    loadingSqlScript.value = false
  }
}

function findSqlBlock(kind: SqlObjectKind, objectName: string): string | null {
  const sql = sqlScriptText.value
  if (!sql) return null

  const name = escapeRegexLiteral(objectName)
  let startRe: RegExp

  if (kind === 'procedure') {
    startRe = new RegExp(`^\\s*create\\s+(?:or\\s+alter\\s+)?procedure\\s+dbo\\.${name}\\b`, 'im')
  } else if (kind === 'function') {
    startRe = new RegExp(`^\\s*create\\s+(?:or\\s+alter\\s+)?function\\s+dbo\\.${name}\\b`, 'im')
  } else {
    // triggers in the script are created without schema prefix
    startRe = new RegExp(`^\\s*create\\s+trigger\\s+${name}\\b`, 'im')
  }

  const startMatch = startRe.exec(sql)
  if (!startMatch || startMatch.index == null) return null
  const startIndex = startMatch.index

  // Find the next GO batch separator after the start.
  const goLineRe = /^\s*go\s*$/gim
  goLineRe.lastIndex = startIndex
  const goMatch = goLineRe.exec(sql)
  if (!goMatch || goMatch.index == null) {
    return sql.slice(startIndex).trim()
  }

  let endIndex = goMatch.index + goMatch[0].length
  while (endIndex < sql.length && (sql[endIndex] === '\r' || sql[endIndex] === '\n')) endIndex++
  return sql.slice(startIndex, endIndex).trim()
}

function getSqlBlock(kind: SqlObjectKind, objectName: string): string {
  if (loadingSqlScript.value) return '-- Đang tải file SQL...'
  if (sqlScriptLoadError.value) {
    return [
      '-- Không tải được file SQL (/sql/ql_dat_phong.sql).',
      `-- Lỗi: ${sqlScriptLoadError.value}`,
      '-- Bạn có thể vào menu "SQL Script" để kiểm tra file có được serve hay không.',
    ].join('\n')
  }
  if (!sqlScriptText.value) {
    return [
      '-- Chưa có nội dung SQL Script trong bộ nhớ.',
      '-- Nhấn nút "Tải code SQL" để load từ /sql/ql_dat_phong.sql.',
    ].join('\n')
  }
  return (
    findSqlBlock(kind, objectName) ??
    `-- Không tìm thấy ${kind} "${objectName}" trong /sql/ql_dat_phong.sql (kiểm tra lại tên trong script).`
  )
}

const sqlDatPhongNhanh = computed(() => {
  const outVar = '@MaDatPhongOut'
  return [
    '-- Truy vấn demo (gọi Stored Procedure)',
    `DECLARE ${outVar} int;`,
    'EXEC dbo.sp_datPhongNhanh',
    `  @MaKH = ${sqlNullableNumber(datPhongForm.maKh)},`,
    `  @MaNV = ${sqlNullableNumber(datPhongForm.maNv)},`,
    `  @NgayNhan = ${sqlNullableDate(datPhongForm.ngayNhan)},`,
    `  @NgayTra = ${sqlNullableDate(datPhongForm.ngayTra)},`,
    `  @DanhSachMaPhong = ${sqlNullableCsvNumbers(datPhongForm.maPhong)},`,
    `  @MaDatPhong = ${outVar} OUTPUT;`,
    `SELECT ${outVar} AS MaDatPhong;`,
    '',
    "-- Ghi chú: @DanhSachMaPhong đang hiển thị dạng danh sách '1,2,3' để demo trực quan.",
  ].join('\n')
})

const sqlNhanPhong = computed(() => {
  const id = coercePositiveInt(nhanPhongForm.maDatPhong)
  return [
    '-- Truy vấn demo (gọi Stored Procedure)',
    'EXEC dbo.sp_nhanPhong',
    `  @MaDatPhong = ${id ? id : 'NULL'};`,
  ].join('\n')
})

const sqlTraPhong = computed(() => {
  const id = coercePositiveInt(traPhongForm.maDatPhong)
  return [
    '-- Truy vấn demo (gọi Stored Procedure)',
    'EXEC dbo.sp_traPhong',
    `  @MaDatPhong = ${id ? id : 'NULL'};`,
  ].join('\n')
})

const sqlPhongTrong = computed(() => {
  return ['-- Truy vấn demo (gọi Stored Procedure)', 'EXEC dbo.sp_phongTrong;'].join('\n')
})

const sqlPhongDaDat = computed(() => {
  return [
    '-- Truy vấn demo (gọi Stored Procedure)',
    'EXEC dbo.sp_phongDaDatTheoKhoangThoiGian',
    `  @TuNgay = ${sqlNullableDate(phongDaDatForm.tuNgay)},`,
    `  @DenNgay = ${sqlNullableDate(phongDaDatForm.denNgay)};`,
  ].join('\n')
})

const sqlDoanhThu = computed(() => {
  return [
    '-- Truy vấn demo (Procedure)',
    'EXEC dbo.sp_tinhDoanhThuTheoThang',
    `  @Thang = ${doanhThuForm.thang},`,
    `  @Nam = ${doanhThuForm.nam};`,
  ].join('\n')
})

const sqlBaoCaoCursor = computed(() => {
  return [
    '-- Truy vấn demo (gọi Stored Procedure có CURSOR + trả result set cho FE)',
    'EXEC dbo.sp_baoCaoDoanhThu_cursor_report;',
  ].join('\n')
})

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

const loadingBaoCaoCursor = ref(false)
const baoCaoCursor = ref<BaoCaoDoanhThuCursorDto[]>([])

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

const showDatPhongDetail = ref(false)
const loadingDatPhongDetail = ref(false)
const datPhongDetail = ref<unknown>(null)

// Snapshot data (B3/B5)
const loadingSnapshots = ref(false)
const phongAllBefore = ref<PhongDto[] | null>(null)
const phongAllAfter = ref<PhongDto[] | null>(null)
const phongTrongBefore = ref<PhongDto[] | null>(null)
const phongTrongAfter = ref<PhongDto[] | null>(null)
const datPhongListBefore = ref<Array<{ maDatPhong: number; raw: unknown }> | null>(null)
const datPhongListAfter = ref<Array<{ maDatPhong: number; raw: unknown }> | null>(null)
const datPhongSelectedBefore = ref<unknown>(null)
const datPhongSelectedAfter = ref<unknown>(null)

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
  loadingDatPhongOptions.value = true
  try {
    const data = await procDanhSachDatPhong({ limit: 50, q: (q ?? datPhongQuery.value).trim() || null })
    datPhongOptions.value = (data ?? [])
      .map((x: any) => ({ maDatPhong: Number(x?.maDatPhong), raw: x }))
      .filter((x) => Number.isFinite(x.maDatPhong) && x.maDatPhong > 0)
  } catch (e) {
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

function promoteMaDatPhongInOptions(id: number) {
  if (!Number.isFinite(id) || id <= 0) return
  const existing = datPhongOptions.value.find((x) => x.maDatPhong === id)
  if (existing) {
    datPhongOptions.value = [existing, ...datPhongOptions.value.filter((x) => x.maDatPhong !== id)]
    return
  }
  datPhongOptions.value = [{ maDatPhong: id, raw: { maDatPhong: id } }, ...datPhongOptions.value]
}

async function snapshotPhongAll(target: typeof phongAllBefore | typeof phongAllAfter) {
  const page = await listPhong({ page: 0, size: 200 })
  target.value = page.content
}

async function snapshotPhongTrong(target: typeof phongTrongBefore | typeof phongTrongAfter) {
  target.value = await procPhongTrong()
}

async function snapshotDatPhongList(target: typeof datPhongListBefore | typeof datPhongListAfter) {
  const data = await procDanhSachDatPhong({ limit: 20, q: null })
  target.value = (data ?? [])
    .map((x: any) => ({ maDatPhong: Number(x?.maDatPhong), raw: x }))
    .filter((x) => Number.isFinite(x.maDatPhong) && x.maDatPhong > 0)
}

async function snapshotDatPhongSelected(maDatPhong: number, target: typeof datPhongSelectedBefore | typeof datPhongSelectedAfter) {
  target.value = await procThongTinDatPhong(maDatPhong)
}

async function snapshotBeforeForDatPhongNhanh() {
  loadingSnapshots.value = true
  try {
    await Promise.all([snapshotPhongTrong(phongTrongBefore), snapshotDatPhongList(datPhongListBefore)])
  } finally {
    loadingSnapshots.value = false
  }
}

async function snapshotAfterForDatPhongNhanh(maDatPhong?: number | null) {
  loadingSnapshots.value = true
  try {
    await Promise.all([snapshotPhongTrong(phongTrongAfter), snapshotDatPhongList(datPhongListAfter)])
    if (maDatPhong) {
      await snapshotDatPhongSelected(maDatPhong, datPhongSelectedAfter)
    }
  } finally {
    loadingSnapshots.value = false
  }
}

async function snapshotBeforeForNhanTraPhong(maDatPhong: number) {
  loadingSnapshots.value = true
  try {
    await Promise.all([snapshotPhongAll(phongAllBefore), snapshotDatPhongSelected(maDatPhong, datPhongSelectedBefore)])
  } finally {
    loadingSnapshots.value = false
  }
}

async function snapshotAfterForNhanTraPhong(maDatPhong: number) {
  loadingSnapshots.value = true
  try {
    await Promise.all([snapshotPhongAll(phongAllAfter), snapshotDatPhongSelected(maDatPhong, datPhongSelectedAfter)])
  } finally {
    loadingSnapshots.value = false
  }
}

async function snapshotBeforeNhanPhong() {
  const id = coercePositiveInt(nhanPhongForm.maDatPhong)
  if (!id) {
    ElMessage.warning('Nhập mã đặt phòng')
    return
  }
  await snapshotBeforeForNhanTraPhong(id)
}

async function snapshotAfterNhanPhong() {
  const id = coercePositiveInt(nhanPhongForm.maDatPhong)
  if (!id) {
    ElMessage.warning('Nhập mã đặt phòng')
    return
  }
  await snapshotAfterForNhanTraPhong(id)
}

async function snapshotBeforeTraPhong() {
  const id = coercePositiveInt(traPhongForm.maDatPhong)
  if (!id) {
    ElMessage.warning('Nhập mã đặt phòng')
    return
  }
  await snapshotBeforeForNhanTraPhong(id)
}

async function snapshotAfterTraPhong() {
  const id = coercePositiveInt(traPhongForm.maDatPhong)
  if (!id) {
    ElMessage.warning('Nhập mã đặt phòng')
    return
  }
  await snapshotAfterForNhanTraPhong(id)
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

function formatLocalDateTime(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  const d = dayjs(value)
  if (!d.isValid()) return value
  return d.format('DD/MM/YYYY HH:mm')
}

function formatVnd(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isFinite(n)) return String(value ?? '')
  return `${new Intl.NumberFormat('vi-VN').format(n)} ₫`
}

function formatNgayDatColumn(_row: unknown, _column: unknown, cellValue: unknown): string {
  return formatLocalDateTime(cellValue)
}

function formatTongTienColumn(_row: unknown, _column: unknown, cellValue: unknown): string {
  return formatVnd(cellValue)
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
    if (!phongTrongBefore.value || !datPhongListBefore.value) {
      await snapshotBeforeForDatPhongNhanh()
    }

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
    promoteMaDatPhongInOptions(maDatPhong)
    await Promise.all([loadDatPhongOptions(), snapshotAfterForDatPhongNhanh(maDatPhong)])
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
    if (!phongAllBefore.value || !datPhongSelectedBefore.value) {
      await snapshotBeforeForNhanTraPhong(maDatPhong)
    }
    const body: NhanPhongRequest = { maDatPhong }
    await procNhanPhong(body)
    promoteMaDatPhongInOptions(maDatPhong)
    await snapshotAfterForNhanTraPhong(maDatPhong)
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
    if (!phongAllBefore.value || !datPhongSelectedBefore.value) {
      await snapshotBeforeForNhanTraPhong(maDatPhong)
    }
    const body: TraPhongRequest = { maDatPhong }
    await procTraPhong(body)
    promoteMaDatPhongInOptions(maDatPhong)
    await snapshotAfterForNhanTraPhong(maDatPhong)
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

async function loadBaoCaoDoanhThuCursor() {
  loadingBaoCaoCursor.value = true
  try {
    baoCaoCursor.value = await procBaoCaoDoanhThuCursor()
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingBaoCaoCursor.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadKhachHangOptions(),
    loadNhanVienOptions(),
    loadPhongTrong(),
    loadDatPhongOptions(''),
    loadSqlScriptIfNeeded(),
  ])
})
</script>

<template>
  <div class="page-card">
    <el-tabs type="border-card">
      <el-tab-pane label="Đặt phòng (PROC)">
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="Xây dựng Procedure đặt phòng nhanh"
          description="Người dùng chọn khách hàng, nhân viên, khoảng ngày và danh sách phòng. Hệ thống tạo 1 đơn đặt phòng + tự sinh chi tiết đặt phòng; đồng thời kiểm tra trùng phòng theo khoảng thời gian (trigger/proc) và tính số ngày (function)."
        />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview
          title="SQL (hiển thị trực tiếp trên web)"
          :sql="sqlDatPhongNhanh"
          note="Copy/paste sang SSMS nếu cần kiểm chứng"
        />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo chức năng (Procedure/Trigger/Function)</el-divider>
        <div class="page-actions" style="border-bottom: none; padding: 0 0 6px">
          <div class="actions-left">
            <span class="muted">Trích trực tiếp từ file /sql/ql_dat_phong.sql</span>
          </div>
          <div class="actions-right">
            <el-button size="small" :loading="loadingSqlScript" @click="loadSqlScriptIfNeeded(true)">Tải code SQL</el-button>
          </div>
        </div>

        <el-collapse>
          <el-collapse-item title="Procedure: dbo.sp_datPhongNhanh">
            <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_datPhongNhanh')" />
          </el-collapse-item>
          <el-collapse-item title="Trigger: trg_tinhThanhTien (tự tính thành tiền chi tiết)">
            <SqlPreview title="Trigger definition" :sql="getSqlBlock('trigger', 'trg_tinhThanhTien')" />
          </el-collapse-item>
          <el-collapse-item title="Trigger: trg_capNhatSoNgayChiTiet (cập nhật số ngày/tiền khi đổi ngày nhận/trả)">
            <SqlPreview title="Trigger definition" :sql="getSqlBlock('trigger', 'trg_capNhatSoNgayChiTiet')" />
          </el-collapse-item>
          <el-collapse-item title="Trigger: trg_chanDatTrungPhong (chặn đặt trùng phòng)">
            <SqlPreview title="Trigger definition" :sql="getSqlBlock('trigger', 'trg_chanDatTrungPhong')" />
          </el-collapse-item>
          <el-collapse-item title="Function: dbo.fn_tinhSoNgayThue (tính số ngày thuê)">
            <SqlPreview title="Function definition" :sql="getSqlBlock('function', 'fn_tinhSoNgayThue')" />
          </el-collapse-item>
          <el-collapse-item title="Function: dbo.fn_tinhTongTienDatPhong (tính tổng tiền theo mã đặt phòng)">
            <SqlPreview title="Function definition" :sql="getSqlBlock('function', 'fn_tinhTongTienDatPhong')" />
          </el-collapse-item>
          <el-collapse-item title="Function: dbo.fn_isPhongTrongTheoKhoang (kiểm tra phòng trống theo khoảng)">
            <SqlPreview title="Function definition" :sql="getSqlBlock('function', 'fn_isPhongTrongTheoKhoang')" />
          </el-collapse-item>
        </el-collapse>

        <el-divider content-position="left">B3/B5 - Bảng dữ liệu liên quan (trước/sau)</el-divider>
        <div class="page-actions" style="border-bottom: none; padding-bottom: 0">
          <div class="actions-left">
            <el-button size="small" :loading="loadingSnapshots" @click="snapshotBeforeForDatPhongNhanh">
              Load dữ liệu trước
            </el-button>
          </div>
          <div class="actions-right">
            <el-button size="small" :loading="loadingSnapshots" @click="snapshotAfterForDatPhongNhanh(lastMaDatPhong)">
              Load dữ liệu sau
            </el-button>
          </div>
        </div>

        <el-row :gutter="12">
          <el-col :span="12">
            <h4 style="margin: 8px 0">Trước</h4>
            <div class="muted" style="margin-bottom: 6px">Bảng liên quan: phong (danh sách phòng trống)</div>
            <el-table :data="phongTrongBefore ?? []" border height="220" style="width: 100%">
              <el-table-column prop="maPhong" label="Mã" width="80" />
              <el-table-column prop="tenPhong" label="Tên" min-width="140" />
              <el-table-column prop="tang" label="Tầng" width="90" />
              <el-table-column prop="trangThai" label="Trạng thái" width="120" />
            </el-table>

            <div class="muted" style="margin: 10px 0 6px">Bảng liên quan: dat_phong (top gần đây)</div>
            <el-table :data="datPhongListBefore ?? []" border height="220" style="width: 100%">
              <el-table-column prop="maDatPhong" label="Mã" width="80" />
              <el-table-column label="Thông tin" min-width="220">
                <template #default="scope">
                  {{ datPhongOptionLabel(scope.row) }}
                </template>
              </el-table-column>
            </el-table>
          </el-col>

          <el-col :span="12">
            <h4 style="margin: 8px 0">Sau</h4>
            <div class="muted" style="margin-bottom: 6px">phong (phòng trống sau khi thao tác)</div>
            <el-table :data="phongTrongAfter ?? []" border height="220" style="width: 100%">
              <el-table-column prop="maPhong" label="Mã" width="80" />
              <el-table-column prop="tenPhong" label="Tên" min-width="140" />
              <el-table-column prop="tang" label="Tầng" width="90" />
              <el-table-column prop="trangThai" label="Trạng thái" width="120" />
            </el-table>

            <div class="muted" style="margin: 10px 0 6px">Output / dat_phong mới tạo</div>
            <pre style="white-space: pre-wrap; margin: 0">{{ JSON.stringify(datPhongSelectedAfter, null, 2) }}</pre>
          </el-col>
        </el-row>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
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
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="Nhận phòng (check-in) + Trigger cập nhật trạng thái phòng"
          description="Gọi sp_nhanPhong để chuyển trạng thái đặt phòng từ 'đã đặt' sang 'đã nhận phòng'. Trigger trg_capNhatTrangThaiPhong sẽ tự cập nhật phòng liên quan từ 'trống' thành 'đang thuê'."
        />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview title="SQL" :sql="sqlNhanPhong" />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo chức năng (Procedure/Trigger)</el-divider>
        <div class="page-actions" style="border-bottom: none; padding: 0 0 6px">
          <div class="actions-left">
            <span class="muted">Trích trực tiếp từ file /sql/ql_dat_phong.sql</span>
          </div>
          <div class="actions-right">
            <el-button size="small" :loading="loadingSqlScript" @click="loadSqlScriptIfNeeded(true)">Tải code SQL</el-button>
          </div>
        </div>
        <el-collapse>
          <el-collapse-item title="Procedure: dbo.sp_nhanPhong">
            <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_nhanPhong')" />
          </el-collapse-item>
          <el-collapse-item title="Trigger: trg_capNhatTrangThaiPhong (đồng bộ trạng thái phòng)">
            <SqlPreview title="Trigger definition" :sql="getSqlBlock('trigger', 'trg_capNhatTrangThaiPhong')" />
          </el-collapse-item>
        </el-collapse>

        <el-divider content-position="left">B3/B5 - Bảng dữ liệu liên quan (trước/sau)</el-divider>
        <div class="page-actions" style="border-bottom: none; padding-bottom: 0">
          <div class="actions-left">
            <el-button size="small" :loading="loadingSnapshots" @click="snapshotBeforeNhanPhong">Load dữ liệu trước</el-button>
          </div>
          <div class="actions-right">
            <el-button size="small" :loading="loadingSnapshots" @click="snapshotAfterNhanPhong">Load dữ liệu sau</el-button>
          </div>
        </div>

        <el-row :gutter="12">
          <el-col :span="12">
            <h4 style="margin: 8px 0">Trước</h4>
            <div class="muted" style="margin-bottom: 6px">dat_phong (đơn đang thao tác)</div>
            <pre style="white-space: pre-wrap; margin: 0">{{ JSON.stringify(datPhongSelectedBefore, null, 2) }}</pre>

            <div class="muted" style="margin: 10px 0 6px">phong (top 200)</div>
            <el-table :data="phongAllBefore ?? []" border height="220" style="width: 100%">
              <el-table-column prop="maPhong" label="Mã" width="80" />
              <el-table-column prop="tenPhong" label="Tên" min-width="140" />
              <el-table-column prop="tang" label="Tầng" width="90" />
              <el-table-column prop="trangThai" label="Trạng thái" width="120" />
            </el-table>
          </el-col>

          <el-col :span="12">
            <h4 style="margin: 8px 0">Sau</h4>
            <div class="muted" style="margin-bottom: 6px">dat_phong (sau khi nhận phòng)</div>
            <pre style="white-space: pre-wrap; margin: 0">{{ JSON.stringify(datPhongSelectedAfter, null, 2) }}</pre>

            <div class="muted" style="margin: 10px 0 6px">phong (sau khi trigger chạy)</div>
            <el-table :data="phongAllAfter ?? []" border height="220" style="width: 100%">
              <el-table-column prop="maPhong" label="Mã" width="80" />
              <el-table-column prop="tenPhong" label="Tên" min-width="140" />
              <el-table-column prop="tang" label="Tầng" width="90" />
              <el-table-column prop="trangThai" label="Trạng thái" width="120" />
            </el-table>
          </el-col>
        </el-row>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
        <el-form label-width="160px" style="max-width: 720px">
          <el-form-item label="Mã đặt phòng (maDatPhong)">
            <el-select
              v-model="nhanPhongForm.maDatPhong"
              filterable
              clearable
              allow-create
              default-first-option
              remote
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
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="Trả phòng + cập nhật lại trạng thái phòng"
          description="Gọi sp_traPhong để chuyển trạng thái đặt phòng sang 'đã trả phòng' và cập nhật các phòng liên quan về 'trống'."
        />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview title="SQL" :sql="sqlTraPhong" />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo chức năng (Procedure/Trigger)</el-divider>
        <div class="page-actions" style="border-bottom: none; padding: 0 0 6px">
          <div class="actions-left">
            <span class="muted">Trích trực tiếp từ file /sql/ql_dat_phong.sql</span>
          </div>
          <div class="actions-right">
            <el-button size="small" :loading="loadingSqlScript" @click="loadSqlScriptIfNeeded(true)">Tải code SQL</el-button>
          </div>
        </div>
        <el-collapse>
          <el-collapse-item title="Procedure: dbo.sp_traPhong">
            <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_traPhong')" />
          </el-collapse-item>
          <el-collapse-item title="Trigger: trg_capNhatTrangThaiPhong (đồng bộ trạng thái phòng)">
            <SqlPreview title="Trigger definition" :sql="getSqlBlock('trigger', 'trg_capNhatTrangThaiPhong')" />
          </el-collapse-item>
        </el-collapse>

        <el-divider content-position="left">B3/B5 - Bảng dữ liệu liên quan (trước/sau)</el-divider>
        <div class="page-actions" style="border-bottom: none; padding-bottom: 0">
          <div class="actions-left">
            <el-button size="small" :loading="loadingSnapshots" @click="snapshotBeforeTraPhong">Load dữ liệu trước</el-button>
          </div>
          <div class="actions-right">
            <el-button size="small" :loading="loadingSnapshots" @click="snapshotAfterTraPhong">Load dữ liệu sau</el-button>
          </div>
        </div>

        <el-row :gutter="12">
          <el-col :span="12">
            <h4 style="margin: 8px 0">Trước</h4>
            <div class="muted" style="margin-bottom: 6px">dat_phong (đơn đang thao tác)</div>
            <pre style="white-space: pre-wrap; margin: 0">{{ JSON.stringify(datPhongSelectedBefore, null, 2) }}</pre>

            <div class="muted" style="margin: 10px 0 6px">phong (top 200)</div>
            <el-table :data="phongAllBefore ?? []" border height="220" style="width: 100%">
              <el-table-column prop="maPhong" label="Mã" width="80" />
              <el-table-column prop="tenPhong" label="Tên" min-width="140" />
              <el-table-column prop="tang" label="Tầng" width="90" />
              <el-table-column prop="trangThai" label="Trạng thái" width="120" />
            </el-table>
          </el-col>

          <el-col :span="12">
            <h4 style="margin: 8px 0">Sau</h4>
            <div class="muted" style="margin-bottom: 6px">dat_phong (sau khi trả phòng)</div>
            <pre style="white-space: pre-wrap; margin: 0">{{ JSON.stringify(datPhongSelectedAfter, null, 2) }}</pre>

            <div class="muted" style="margin: 10px 0 6px">phong (sau khi cập nhật)</div>
            <el-table :data="phongAllAfter ?? []" border height="220" style="width: 100%">
              <el-table-column prop="maPhong" label="Mã" width="80" />
              <el-table-column prop="tenPhong" label="Tên" min-width="140" />
              <el-table-column prop="tang" label="Tầng" width="90" />
              <el-table-column prop="trangThai" label="Trạng thái" width="120" />
            </el-table>
          </el-col>
        </el-row>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
        <el-form label-width="160px" style="max-width: 720px">
          <el-form-item label="Mã đặt phòng (maDatPhong)">
            <el-select
              v-model="traPhongForm.maDatPhong"
              filterable
              clearable
              allow-create
              default-first-option
              remote
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
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="Lấy danh sách phòng trống"
          description="Gọi sp_phongTrong để truy vấn bảng phong theo trạng thái = 'trống'."
        />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview title="SQL" :sql="sqlPhongTrong" />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo chức năng (Procedure)</el-divider>
        <div class="page-actions" style="border-bottom: none; padding: 0 0 6px">
          <div class="actions-left">
            <span class="muted">Trích trực tiếp từ file /sql/ql_dat_phong.sql</span>
          </div>
          <div class="actions-right">
            <el-button size="small" :loading="loadingSqlScript" @click="loadSqlScriptIfNeeded(true)">Tải code SQL</el-button>
          </div>
        </div>
        <el-collapse>
          <el-collapse-item title="Procedure: dbo.sp_phongTrong">
            <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_phongTrong')" />
          </el-collapse-item>
        </el-collapse>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
        <div style="margin-bottom: 8px">
          <el-button type="primary" @click="loadPhongTrong">Tải danh sách phòng trống</el-button>
        </div>

        <el-divider content-position="left">B5 - Output</el-divider>
        <el-table :data="phongTrong" v-loading="loadingPhongTrong" border style="width: 100%">
          <el-table-column prop="maPhong" label="Mã" width="80" />
          <el-table-column prop="maLoaiPhong" label="Mã loại" width="100" />
          <el-table-column prop="tenPhong" label="Tên" min-width="200" />
          <el-table-column prop="tang" label="Tầng" width="90" />
          <el-table-column prop="trangThai" label="Trạng thái" width="140" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Phòng đã đặt (PROC)">
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="Lấy danh sách phòng đã được đặt theo khoảng thời gian"
          description="Gọi sp_phongDaDatTheoKhoangThoiGian để trả về danh sách phòng có đơn đặt phòng bị overlap với khoảng [tuNgay, denNgay]."
        />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview title="SQL" :sql="sqlPhongDaDat" />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo chức năng (Procedure)</el-divider>
        <div class="page-actions" style="border-bottom: none; padding: 0 0 6px">
          <div class="actions-left">
            <span class="muted">Trích trực tiếp từ file /sql/ql_dat_phong.sql</span>
          </div>
          <div class="actions-right">
            <el-button size="small" :loading="loadingSqlScript" @click="loadSqlScriptIfNeeded(true)">Tải code SQL</el-button>
          </div>
        </div>
        <el-collapse>
          <el-collapse-item title="Procedure: dbo.sp_phongDaDatTheoKhoangThoiGian">
            <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_phongDaDatTheoKhoangThoiGian')" />
          </el-collapse-item>
        </el-collapse>

        <el-divider content-position="left">B3 - Bảng dữ liệu liên quan</el-divider>
        <div class="muted" style="margin: 6px 0 10px">
          Bảng liên quan: dat_phong, chi_tiet_dat_phong, phong (join + điều kiện overlap).
        </div>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
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

        <el-divider content-position="left">B5 - Output</el-divider>
        <el-table :data="phongDaDat" v-loading="loadingPhongDaDat" border style="width: 100%">
          <el-table-column prop="maPhong" label="Mã" width="80" />
          <el-table-column prop="maLoaiPhong" label="Mã loại" width="100" />
          <el-table-column prop="tenPhong" label="Tên" min-width="200" />
          <el-table-column prop="tang" label="Tầng" width="90" />
          <el-table-column prop="trangThai" label="Trạng thái" width="140" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Doanh thu (FUNC/PROC)">
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="Tính tổng doanh thu theo tháng/năm"
          description="Gọi sp_tinhDoanhThuTheoThang để tính tổng SoTien trong bảng thanh_toan theo tháng/năm."
        />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview title="SQL" :sql="sqlDoanhThu" />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo chức năng (Procedure/Trigger)</el-divider>
        <div class="page-actions" style="border-bottom: none; padding: 0 0 6px">
          <div class="actions-left">
            <span class="muted">Trích trực tiếp từ file /sql/ql_dat_phong.sql</span>
          </div>
          <div class="actions-right">
            <el-button size="small" :loading="loadingSqlScript" @click="loadSqlScriptIfNeeded(true)">Tải code SQL</el-button>
          </div>
        </div>
        <el-collapse>
          <el-collapse-item title="Procedure: dbo.sp_tinhDoanhThuTheoThang">
            <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_tinhDoanhThuTheoThang')" />
          </el-collapse-item>
          <el-collapse-item title="Trigger: trg_setNgayThanhToan (tự set NgayThanhToan khi đã thanh toán)">
            <SqlPreview title="Trigger definition" :sql="getSqlBlock('trigger', 'trg_setNgayThanhToan')" />
          </el-collapse-item>
        </el-collapse>

        <el-divider content-position="left">B3 - Bảng dữ liệu liên quan</el-divider>
        <div class="muted" style="margin: 6px 0 10px">Bảng liên quan: thanh_toan</div>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
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

          <el-divider content-position="left">B5 - Output</el-divider>
          <el-form-item v-if="doanhThuValue != null" label="Kết quả">
            <el-tag type="success">{{ doanhThuValue }}</el-tag>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="Báo cáo doanh thu (CURSOR)">
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="Báo cáo doanh thu dùng Cursor"
          description="Gọi sp_baoCaoDoanhThu_cursor_report để duyệt từng đơn đặt phòng bằng cursor, gom dữ liệu và trả về result set cho website."
        />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview title="SQL" :sql="sqlBaoCaoCursor" />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo chức năng (Procedure CURSOR)</el-divider>
        <div class="page-actions" style="border-bottom: none; padding: 0 0 6px">
          <div class="actions-left">
            <span class="muted">Trích trực tiếp từ file /sql/ql_dat_phong.sql</span>
          </div>
          <div class="actions-right">
            <el-button size="small" :loading="loadingSqlScript" @click="loadSqlScriptIfNeeded(true)">Tải code SQL</el-button>
          </div>
        </div>
        <el-collapse>
          <el-collapse-item title="Procedure: dbo.sp_baoCaoDoanhThu_cursor_report">
            <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_baoCaoDoanhThu_cursor_report')" />
          </el-collapse-item>
          <el-collapse-item title="Procedure: dbo.sp_baoCaoDoanhThu_cursor (cursor + PRINT)">
            <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_baoCaoDoanhThu_cursor')" />
          </el-collapse-item>
        </el-collapse>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
        <div style="margin-bottom: 8px">
          <el-button type="primary" @click="loadBaoCaoDoanhThuCursor">Tải báo cáo cursor</el-button>
        </div>

        <el-divider content-position="left">B5 - Output</el-divider>
        <el-table :data="baoCaoCursor" v-loading="loadingBaoCaoCursor" border style="width: 100%">
          <el-table-column prop="maDatPhong" label="Mã đặt" width="90" />
          <el-table-column prop="maKh" label="Mã KH" width="80" />
          <el-table-column prop="hoTenKh" label="Họ tên" min-width="200" />
          <el-table-column prop="ngayDat" label="Ngày đặt" min-width="180" :formatter="formatNgayDatColumn" />
          <el-table-column prop="trangThai" label="Trạng thái" width="140" />
          <el-table-column prop="tongTien" label="Tổng tiền" width="160" :formatter="formatTongTienColumn" />
        </el-table>
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
