import { api } from './client'
import type { TokenPair, User } from '../lib/types'

export type RegisterPayload = {
  name: string
  email: string
  password: string
}

export type LoginPayload = {
  email: string
  password: string
}

export async function register(payload: RegisterPayload): Promise<TokenPair> {
  const response = await api.post<TokenPair>('/api/auth/register', payload)
  return response.data
}

export async function login(payload: LoginPayload): Promise<TokenPair> {
  const response = await api.post<TokenPair>('/api/auth/login', payload)
  return response.data
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout')
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await api.get<{ user: User }>('/api/auth/me')
  return response.data.user
}
