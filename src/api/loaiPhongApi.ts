import { http, unwrapApiResponse } from './http'
import type { ApiResponse, SpringPage } from './types'
import type { LoaiPhongDto } from './models'

export type UpsertLoaiPhongRequest = {
  tenLoaiPhong: string
  sucChua: number
  giaCoBan: number
  moTa?: string | null
}

export async function listLoaiPhong(params: { page: number; size: number }) {
  const res = await http.get<ApiResponse<SpringPage<LoaiPhongDto>>>('/api/loai-phong', { params })
  return unwrapApiResponse(res.data)
}

export async function getLoaiPhong(id: number) {
  const res = await http.get<ApiResponse<LoaiPhongDto>>(`/api/loai-phong/${id}`)
  return unwrapApiResponse(res.data)
}

export async function createLoaiPhong(body: UpsertLoaiPhongRequest) {
  const res = await http.post<ApiResponse<LoaiPhongDto>>('/api/loai-phong', body)
  return unwrapApiResponse(res.data)
}

export async function updateLoaiPhong(id: number, body: UpsertLoaiPhongRequest) {
  const res = await http.put<ApiResponse<LoaiPhongDto>>(`/api/loai-phong/${id}`, body)
  return unwrapApiResponse(res.data)
}

export async function deleteLoaiPhong(id: number) {
  const res = await http.delete<ApiResponse<void>>(`/api/loai-phong/${id}`)
  return unwrapApiResponse(res.data)
}
