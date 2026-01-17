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

  // Backend may return structured errors like:
  // { timestamp, error: { code, message } }
  if (data) {
    if (typeof data === 'string') return data

    const message = (data as any)?.message
    if (typeof message === 'string' && message.trim()) return message

    const error = (data as any)?.error
    if (typeof error === 'string' && error.trim()) return error
    if (error && typeof error === 'object') {
      const errorMessage = (error as any)?.message
      const errorCode = (error as any)?.code
      if (typeof errorMessage === 'string' && errorMessage.trim()) {
        if (typeof errorCode === 'string' && errorCode.trim()) return `${errorCode}: ${errorMessage}`
        return errorMessage
      }
      if (typeof errorCode === 'string' && errorCode.trim()) return errorCode
    }
  }

  if (axiosErr?.message) return axiosErr.message
  return 'Có lỗi xảy ra'
}
