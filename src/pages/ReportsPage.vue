<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

import SqlPreview from '../components/SqlPreview.vue'
import { getErrorMessage } from '../api/http'
import type { BaoCaoDoanhThuCursorDto, PhongDto } from '../api/models'
import { procBaoCaoDoanhThuCursor, procDanhSachDatPhong, procDoanhThu, procPhongDaDat, procPhongTrong } from '../api/procedureApi'

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

  if (kind === 'procedure') startRe = new RegExp(`^\\s*create\\s+(?:or\\s+alter\\s+)?procedure\\s+dbo\\.${name}\\b`, 'im')
  else if (kind === 'function') startRe = new RegExp(`^\\s*create\\s+(?:or\\s+alter\\s+)?function\\s+dbo\\.${name}\\b`, 'im')
  else startRe = new RegExp(`^\\s*create\\s+trigger\\s+${name}\\b`, 'im')

  const startMatch = startRe.exec(sql)
  if (!startMatch || startMatch.index == null) return null
  const startIndex = startMatch.index

  const goLineRe = /^\s*go\s*$/gim
  goLineRe.lastIndex = startIndex
  const goMatch = goLineRe.exec(sql)
  if (!goMatch || goMatch.index == null) return sql.slice(startIndex).trim()

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
    ].join('\n')
  }
  if (!sqlScriptText.value) {
    return ['-- Chưa có nội dung SQL Script trong bộ nhớ.', '-- Nhấn "Tải code SQL" để load từ /sql/ql_dat_phong.sql.'].join('\n')
  }
  return (
    findSqlBlock(kind, objectName) ??
    `-- Không tìm thấy ${kind} "${objectName}" trong /sql/ql_dat_phong.sql (kiểm tra lại tên trong script).`
  )
}

function fmtDate(d: Date | null): string {
  if (!d) return ''
  return dayjs(d).format('YYYY-MM-DDTHH:mm:ss')
}

// Report 1: Phòng trống
const loadingPhongTrong = ref(false)
const phongTrong = ref<PhongDto[]>([])
async function runPhongTrong() {
  loadingPhongTrong.value = true
  try {
    phongTrong.value = await procPhongTrong()
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingPhongTrong.value = false
  }
}

// Report 2: Phòng đã đặt theo khoảng
const loadingPhongDaDat = ref(false)
const phongDaDat = ref<PhongDto[]>([])
const tuNgay = ref<Date | null>(new Date())
const denNgay = ref<Date | null>(dayjs().add(7, 'day').toDate())
async function runPhongDaDat() {
  if (!tuNgay.value || !denNgay.value) {
    ElMessage.warning('Vui lòng chọn đủ từ ngày/đến ngày')
    return
  }
  loadingPhongDaDat.value = true
  try {
    phongDaDat.value = await procPhongDaDat({ tuNgay: fmtDate(tuNgay.value), denNgay: fmtDate(denNgay.value) })
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingPhongDaDat.value = false
  }
}

// Report 3: Danh sách đặt phòng
const loadingDatPhongList = ref(false)
const datPhongList = ref<Array<{ maDatPhong: number; raw: any }>>([])
async function runDanhSachDatPhong() {
  loadingDatPhongList.value = true
  try {
    const data = await procDanhSachDatPhong({ limit: 20, q: null })
    datPhongList.value = (data ?? [])
      .map((x: any) => ({ maDatPhong: Number(x?.maDatPhong), raw: x }))
      .filter((x) => Number.isFinite(x.maDatPhong) && x.maDatPhong > 0)
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingDatPhongList.value = false
  }
}

// Report 4: Doanh thu theo tháng
const loadingDoanhThu = ref(false)
const doanhThuValue = ref<number | string | null>(null)
const thang = ref<number>(dayjs().month() + 1)
const nam = ref<number>(dayjs().year())
async function runDoanhThu() {
  loadingDoanhThu.value = true
  try {
    const v = await procDoanhThu({ thang: thang.value, nam: nam.value })
    doanhThuValue.value = (v as any) == null ? 0 : v
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingDoanhThu.value = false
  }
}

// Report 5: Báo cáo cursor
const loadingBaoCaoCursor = ref(false)
const baoCaoCursor = ref<BaoCaoDoanhThuCursorDto[]>([])
async function runBaoCaoCursor() {
  loadingBaoCaoCursor.value = true
  try {
    baoCaoCursor.value = await procBaoCaoDoanhThuCursor()
  } catch (e) {
    ElMessage.error(getErrorMessage(e))
  } finally {
    loadingBaoCaoCursor.value = false
  }
}

const sqlPhongTrong = computed(() => ['-- Report: phòng trống', 'EXEC dbo.sp_phongTrong;'].join('\n'))
const sqlPhongDaDat = computed(() => {
  const tn = tuNgay.value ? `'${fmtDate(tuNgay.value)}'` : 'NULL'
  const dn = denNgay.value ? `'${fmtDate(denNgay.value)}'` : 'NULL'
  return ['-- Report: phòng đã đặt theo khoảng', 'EXEC dbo.sp_phongDaDatTheoKhoangThoiGian', `  @TuNgay = ${tn},`, `  @DenNgay = ${dn};`].join('\n')
})
const sqlDanhSachDatPhong = computed(() => ['-- Report: danh sách đặt phòng', 'EXEC dbo.sp_danhSachDatPhong @Limit = 20, @Search = NULL;'].join('\n'))
const sqlDoanhThu = computed(() =>
  ['-- Report: doanh thu theo tháng', 'EXEC dbo.sp_tinhDoanhThuTheoThang', `  @Thang = ${thang.value},`, `  @Nam = ${nam.value};`].join('\n')
)
const sqlBaoCaoCursor = computed(() => ['-- Report: báo cáo doanh thu (cursor)', 'EXEC dbo.sp_baoCaoDoanhThu_cursor_report;'].join('\n'))

onMounted(async () => {
  await loadSqlScriptIfNeeded()
})
</script>

<template>
  <div class="page-card">
    <div class="page-actions" style="border-bottom: none">
      <div class="actions-left">
        <h2 style="margin: 0">Report (5)</h2>
        <div class="muted" style="margin-top: 6px">
          Mỗi report có B1–B5 và tương tác dữ liệu thông qua API → SQL Server.
        </div>
      </div>
      <div class="actions-right">
        <el-button size="small" :loading="loadingSqlScript" @click="loadSqlScriptIfNeeded(true)">Tải code SQL</el-button>
      </div>
    </div>

    <el-tabs type="border-card">
      <el-tab-pane label="1) Phòng trống">
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert type="info" show-icon :closable="false" title="Report danh sách phòng trống" description="Xây dựng report hiển thị các phòng đang có trạng thái 'trống'." />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview title="SQL" :sql="sqlPhongTrong" />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo report</el-divider>
        <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_phongTrong')" />

        <el-divider content-position="left">B3 - Bảng liên quan</el-divider>
        <div class="muted">Bảng: phong</div>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
        <el-button type="primary" :loading="loadingPhongTrong" @click="runPhongTrong">Tải report</el-button>

        <el-divider content-position="left">B5 - Output</el-divider>
        <el-table :data="phongTrong" v-loading="loadingPhongTrong" border style="width: 100%">
          <el-table-column prop="maPhong" label="Mã" width="80" />
          <el-table-column prop="tenPhong" label="Tên" min-width="200" />
          <el-table-column prop="tang" label="Tầng" width="90" />
          <el-table-column prop="trangThai" label="Trạng thái" width="140" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="2) Phòng đã đặt">
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="Report phòng đã được đặt theo khoảng thời gian"
          description="Xây dựng report liệt kê các phòng có đơn đặt phòng bị overlap với khoảng thời gian lựa chọn." />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview title="SQL" :sql="sqlPhongDaDat" />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo report</el-divider>
        <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_phongDaDatTheoKhoangThoiGian')" />

        <el-divider content-position="left">B3 - Bảng liên quan</el-divider>
        <div class="muted">Bảng: dat_phong, chi_tiet_dat_phong, phong</div>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
        <el-form label-width="140px" style="max-width: 680px">
          <el-form-item label="Từ ngày">
            <el-date-picker v-model="tuNgay" type="datetime" format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item label="Đến ngày">
            <el-date-picker v-model="denNgay" type="datetime" format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loadingPhongDaDat" @click="runPhongDaDat">Tải report</el-button>
          </el-form-item>
        </el-form>

        <el-divider content-position="left">B5 - Output</el-divider>
        <el-table :data="phongDaDat" v-loading="loadingPhongDaDat" border style="width: 100%">
          <el-table-column prop="maPhong" label="Mã" width="80" />
          <el-table-column prop="tenPhong" label="Tên" min-width="200" />
          <el-table-column prop="tang" label="Tầng" width="90" />
          <el-table-column prop="trangThai" label="Trạng thái" width="140" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="3) Danh sách đặt phòng">
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert type="info" show-icon :closable="false" title="Report danh sách đặt phòng" description="Xây dựng report liệt kê 20 đơn đặt phòng gần đây để phục vụ tra cứu." />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview title="SQL" :sql="sqlDanhSachDatPhong" />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo report</el-divider>
        <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_danhSachDatPhong')" />

        <el-divider content-position="left">B3 - Bảng liên quan</el-divider>
        <div class="muted">Bảng: dat_phong, khach_hang, nhan_vien, chi_tiet_dat_phong</div>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
        <el-button type="primary" :loading="loadingDatPhongList" @click="runDanhSachDatPhong">Tải report</el-button>

        <el-divider content-position="left">B5 - Output</el-divider>
        <el-table :data="datPhongList" v-loading="loadingDatPhongList" border style="width: 100%">
          <el-table-column prop="maDatPhong" label="Mã" width="90" />
          <el-table-column label="Raw" min-width="320">
            <template #default="scope">
              <pre style="white-space: pre-wrap; margin: 0">{{ JSON.stringify(scope.row.raw, null, 2) }}</pre>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="4) Doanh thu">
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert type="info" show-icon :closable="false" title="Report doanh thu theo tháng" description="Tính tổng doanh thu trong bảng thanh_toan theo tháng/năm." />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview title="SQL" :sql="sqlDoanhThu" />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo report</el-divider>
        <el-collapse>
          <el-collapse-item title="Procedure: dbo.sp_tinhDoanhThuTheoThang">
            <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_tinhDoanhThuTheoThang')" />
          </el-collapse-item>
          <el-collapse-item title="Trigger liên quan: trg_setNgayThanhToan">
            <SqlPreview title="Trigger definition" :sql="getSqlBlock('trigger', 'trg_setNgayThanhToan')" />
          </el-collapse-item>
        </el-collapse>

        <el-divider content-position="left">B3 - Bảng liên quan</el-divider>
        <div class="muted">Bảng: thanh_toan</div>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
        <el-form label-width="120px" style="max-width: 520px">
          <el-form-item label="Tháng">
            <el-input-number v-model="thang" :min="1" :max="12" />
          </el-form-item>
          <el-form-item label="Năm">
            <el-input-number v-model="nam" :min="2000" :max="2100" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loadingDoanhThu" @click="runDoanhThu">Tính doanh thu</el-button>
          </el-form-item>
        </el-form>

        <el-divider content-position="left">B5 - Output</el-divider>
        <el-tag v-if="doanhThuValue != null" type="success" effect="light">{{ doanhThuValue }}</el-tag>
        <div v-else class="muted">Chưa có dữ liệu</div>
      </el-tab-pane>

      <el-tab-pane label="5) Báo cáo Cursor">
        <el-divider content-position="left">B1 - Bài toán</el-divider>
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="Report doanh thu dùng Cursor"
          description="Dùng cursor duyệt từng đơn đặt phòng, tổng hợp và trả result set về website." />

        <el-divider content-position="left">B2 - Câu truy vấn SQL</el-divider>
        <SqlPreview title="SQL" :sql="sqlBaoCaoCursor" />

        <el-divider content-position="left">B2.1 - Code SQL đúng theo report</el-divider>
        <el-collapse>
          <el-collapse-item title="Procedure: dbo.sp_baoCaoDoanhThu_cursor_report">
            <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_baoCaoDoanhThu_cursor_report')" />
          </el-collapse-item>
          <el-collapse-item title="Procedure: dbo.sp_baoCaoDoanhThu_cursor (cursor + PRINT)">
            <SqlPreview title="Procedure definition" :sql="getSqlBlock('procedure', 'sp_baoCaoDoanhThu_cursor')" />
          </el-collapse-item>
        </el-collapse>

        <el-divider content-position="left">B3 - Bảng liên quan</el-divider>
        <div class="muted">Bảng: dat_phong, khach_hang, chi_tiet_dat_phong</div>

        <el-divider content-position="left">B4 - Nút thực thi</el-divider>
        <el-button type="primary" :loading="loadingBaoCaoCursor" @click="runBaoCaoCursor">Tải report</el-button>

        <el-divider content-position="left">B5 - Output</el-divider>
        <el-table :data="baoCaoCursor" v-loading="loadingBaoCaoCursor" border style="width: 100%">
          <el-table-column prop="maDatPhong" label="Mã đặt" width="90" />
          <el-table-column prop="maKh" label="Mã KH" width="80" />
          <el-table-column prop="hoTenKh" label="Họ tên" min-width="200" />
          <el-table-column prop="ngayDat" label="Ngày đặt" min-width="180" />
          <el-table-column prop="trangThai" label="Trạng thái" width="140" />
          <el-table-column prop="tongTien" label="Tổng tiền" width="160" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
