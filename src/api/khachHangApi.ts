import { http, unwrapApiResponse } from './http'
import type { ApiResponse, SpringPage } from './types'
import type { KhachHangDto } from './models'

export type UpsertKhachHangRequest = {
  hoTen: string
  cccd?: string | null
  dienThoai?: string | null
  email?: string | null
  diaChi?: string | null
}

export async function listKhachHang(params: { page: number; size: number }) {
  const res = await http.get<ApiResponse<SpringPage<KhachHangDto>>>('/api/khach-hang', { params })
  return unwrapApiResponse(res.data)
}

export async function getKhachHang(id: number) {
  const res = await http.get<ApiResponse<KhachHangDto>>(`/api/khach-hang/${id}`)
  return unwrapApiResponse(res.data)
}

export async function createKhachHang(body: UpsertKhachHangRequest) {
  const res = await http.post<ApiResponse<KhachHangDto>>('/api/khach-hang', body)
  return unwrapApiResponse(res.data)
}

export async function updateKhachHang(id: number, body: UpsertKhachHangRequest) {
  const res = await http.put<ApiResponse<KhachHangDto>>(`/api/khach-hang/${id}`, body)
  return unwrapApiResponse(res.data)
}

export async function deleteKhachHang(id: number) {
  const res = await http.delete<ApiResponse<void>>(`/api/khach-hang/${id}`)
  return unwrapApiResponse(res.data)
}
