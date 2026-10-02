import { api } from './client'
import type { DashboardStats } from '../lib/types'

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>('/api/dashboard/stats')
  return response.data
}
