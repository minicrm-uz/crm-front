import { api } from './client'
import type { Lead, LeadActivity, LeadSource, LeadStatus, Paginated } from '../lib/types'

export type LeadListQuery = {
  q?: string
  status?: LeadStatus
  source?: LeadSource
  sort?: string
  page?: number
  per_page?: number
}

export async function listLeads(query: LeadListQuery): Promise<Paginated<Lead>> {
  const params: Record<string, string> = {}
  if (query.q) params.q = query.q
  if (query.status) params.status = query.status
  if (query.source) params.source = query.source
  if (query.sort) params.sort = query.sort
  if (query.page !== undefined) params.page = String(query.page)
  if (query.per_page !== undefined) params.per_page = String(query.per_page)

  const response = await api.get<Paginated<Lead>>('/api/leads', { params })
  return response.data
}

export async function getLead(id: number): Promise<Lead> {
  const response = await api.get<{ data: Lead }>(`/api/leads/${id}`)
  return response.data.data
}

export type CreateLeadPayload = {
  name: string
  phone?: string | null
  email?: string | null
  source: LeadSource
  note?: string | null
}

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const response = await api.post<{ data: Lead }>('/api/leads', payload)
  return response.data.data
}

export type UpdateLeadPayload = Partial<Omit<CreateLeadPayload, 'source'>> & {
  source?: LeadSource
}

export async function updateLead(id: number, payload: UpdateLeadPayload): Promise<Lead> {
  const response = await api.patch<{ data: Lead }>(`/api/leads/${id}`, payload)
  return response.data.data
}

export async function updateLeadStatus(id: number, status: LeadStatus): Promise<Lead> {
  const response = await api.patch<{ data: Lead }>(`/api/leads/${id}/status`, { status })
  return response.data.data
}

export async function deleteLead(id: number): Promise<void> {
  await api.delete(`/api/leads/${id}`)
}

export async function listLeadActivities(
  id: number,
  page = 1,
): Promise<Paginated<LeadActivity>> {
  const response = await api.get<Paginated<LeadActivity>>(
    `/api/leads/${id}/activities`,
    { params: { page } },
  )
  return response.data
}
