import type { LeadSource, LeadStatus } from './types'

export const LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Qualified',
  'Won',
  'Lost',
]

export const LEAD_SOURCES: LeadSource[] = [
  'Website',
  'Referral',
  'Social',
  'Cold Call',
  'Event',
  'Other',
]

export const STATUS_BADGE: Record<LeadStatus, string> = {
  New: 'bg-slate-100 text-slate-700',
  Contacted: 'bg-blue-100 text-blue-700',
  Qualified: 'bg-violet-100 text-violet-700',
  Won: 'bg-emerald-100 text-emerald-700',
  Lost: 'bg-rose-100 text-rose-700',
}
