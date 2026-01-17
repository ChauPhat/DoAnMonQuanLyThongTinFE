import { http, unwrapApiResponse } from './http'
import type { ApiResponse, SpringPage } from './types'
import type { CreateNhanVienRequest, NhanVienDto, UpdateNhanVienRequest } from './models'

export async function listNhanVien(params: { page: number; size: number }) {
  const res = await http.get<ApiResponse<SpringPage<NhanVienDto>>>('/api/nhan-vien', { params })
  return unwrapApiResponse(res.data)
}

export async function getNhanVien(id: number) {
  const res = await http.get<ApiResponse<NhanVienDto>>(`/api/nhan-vien/${id}`)
  return unwrapApiResponse(res.data)
}

export async function createNhanVien(body: CreateNhanVienRequest) {
  const res = await http.post<ApiResponse<NhanVienDto>>('/api/nhan-vien', body)
  return unwrapApiResponse(res.data)
}

export async function updateNhanVien(id: number, body: UpdateNhanVienRequest) {
  const res = await http.put<ApiResponse<NhanVienDto>>(`/api/nhan-vien/${id}`, body)
  return unwrapApiResponse(res.data)
}

export async function deleteNhanVien(id: number) {
  const res = await http.delete<ApiResponse<void>>(`/api/nhan-vien/${id}`)
  return unwrapApiResponse(res.data)
}
