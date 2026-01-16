import axios, { type AxiosError } from 'axios'

import type { ApiResponse } from './types'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const http = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function unwrapApiResponse<T>(payload: ApiResponse<T> | T): T {
  // Supports both: { data: T } and plain T.
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResponse<T>).data as T
  }
  return payload as T
}

export function getErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<any>
  const data = axiosErr?.response?.data
  if (data?.message) return String(data.message)
  if (data?.error) return String(data.error)
  if (axiosErr?.message) return axiosErr.message
  return 'Có lỗi xảy ra'
}
