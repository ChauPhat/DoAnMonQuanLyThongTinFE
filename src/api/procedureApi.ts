import { http, unwrapApiResponse } from './http'
import type { ApiResponse } from './types'
import type {
  DatPhongRequest,
  DoanhThuTheoThangRequest,
  PhongDto,
  ThemChiTietDatPhongRequest,
  TraPhongRequest,
} from './models'

export async function procDatPhong(body: DatPhongRequest) {
  const res = await http.post<ApiResponse<void>>('/api/proc/dat-phong', body)
  return unwrapApiResponse(res.data)
}

export async function procThemChiTiet(body: ThemChiTietDatPhongRequest) {
  const res = await http.post<ApiResponse<void>>('/api/proc/them-chi-tiet', body)
  return unwrapApiResponse(res.data)
}

export async function procTraPhong(body: TraPhongRequest) {
  const res = await http.post<ApiResponse<void>>('/api/proc/tra-phong', body)
  return unwrapApiResponse(res.data)
}

export async function procPhongTrong() {
  const res = await http.get<ApiResponse<PhongDto[]>>('/api/proc/phong-trong')
  return unwrapApiResponse(res.data)
}

export async function procDoanhThu(body: DoanhThuTheoThangRequest) {
  const res = await http.post<ApiResponse<number | string>>('/api/proc/doanh-thu', body)
  return unwrapApiResponse(res.data)
}
