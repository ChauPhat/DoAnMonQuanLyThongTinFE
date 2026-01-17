import { http, unwrapApiResponse } from './http'
import type { ApiResponse, SpringPage } from './types'
import type { PhongDto } from './models'

export type UpsertPhongRequest = {
  maLoaiPhong: number
  tenPhong?: string | null
  tang?: number | null
  trangThai?: string | null
}

export async function listPhong(params: { page: number; size: number }) {
  const res = await http.get<ApiResponse<SpringPage<PhongDto>>>('/api/phong', { params })
  return unwrapApiResponse(res.data)
}

export async function getPhong(id: number) {
  const res = await http.get<ApiResponse<PhongDto>>(`/api/phong/${id}`)
  return unwrapApiResponse(res.data)
}

export async function createPhong(body: UpsertPhongRequest) {
  const res = await http.post<ApiResponse<PhongDto>>('/api/phong', body)
  return unwrapApiResponse(res.data)
}

export async function updatePhong(id: number, body: UpsertPhongRequest) {
  const res = await http.put<ApiResponse<PhongDto>>(`/api/phong/${id}`, body)
  return unwrapApiResponse(res.data)
}

export async function deletePhong(id: number) {
  const res = await http.delete<ApiResponse<void>>(`/api/phong/${id}`)
  return unwrapApiResponse(res.data)
}
