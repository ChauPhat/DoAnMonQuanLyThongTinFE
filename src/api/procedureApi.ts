import { http, unwrapApiResponse } from './http'
import type { ApiResponse } from './types'
import type {
  BaoCaoDoanhThuCursorDto,
  DatPhongNhanhRequest,
  DatPhongSummaryDto,
  DoanhThuTheoThangRequest,
  NhanPhongRequest,
  PhongDaDatRequest,
  PhongDto,
  TraPhongRequest,
} from './models'

export async function procDanhSachDatPhong(params?: { limit?: number; q?: string | null }) {
  const res = await http.get<ApiResponse<DatPhongSummaryDto[]>>('/api/proc/danh-sach-dat-phong', { params })
  return unwrapApiResponse(res.data)
}

export async function procThongTinDatPhong(maDatPhong: number) {
  const res = await http.get<ApiResponse<DatPhongSummaryDto>>(`/api/proc/dat-phong/${maDatPhong}`)
  return unwrapApiResponse(res.data)
}

export async function procBaoCaoDoanhThuCursor() {
  const res = await http.get<ApiResponse<BaoCaoDoanhThuCursorDto[]>>('/api/proc/bao-cao-doanh-thu-cursor')
  return unwrapApiResponse(res.data)
}

export async function procDatPhongNhanh(body: DatPhongNhanhRequest) {
  const res = await http.post<ApiResponse<number>>('/api/proc/dat-phong-nhanh', body)
  return unwrapApiResponse(res.data)
}

export async function procTraPhong(body: TraPhongRequest) {
  const res = await http.post<ApiResponse<void>>('/api/proc/tra-phong', body)
  return unwrapApiResponse(res.data)
}

export async function procNhanPhong(body: NhanPhongRequest) {
  const res = await http.post<ApiResponse<void>>('/api/proc/nhan-phong', body)
  return unwrapApiResponse(res.data)
}

export async function procPhongTrong() {
  const res = await http.get<ApiResponse<PhongDto[]>>('/api/proc/phong-trong')
  return unwrapApiResponse(res.data)
}

export async function procPhongDaDat(body: PhongDaDatRequest) {
  const res = await http.post<ApiResponse<PhongDto[]>>('/api/proc/phong-da-dat', body)
  return unwrapApiResponse(res.data)
}

export async function procDoanhThu(body: DoanhThuTheoThangRequest) {
  const res = await http.post<ApiResponse<number | string>>('/api/proc/doanh-thu', body)
  return unwrapApiResponse(res.data)
}
