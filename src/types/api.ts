// src/types/api.ts

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  timestamp: number
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  pageSize: number
  items: T[]
}

// 用户相关类型
export interface User {
  name: string
  role: string
  token: string | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  code: number
  message: string
  data: User
}