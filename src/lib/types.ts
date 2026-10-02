export type User = {
  id: number
  name: string
  email: string
  created_at: string | null
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost'
export type LeadSource =
  | 'Website'
  | 'Referral'
  | 'Social'
  | 'Cold Call'
  | 'Event'
  | 'Other'

export type Lead = {
  id: number
  owner_id: number
  owner?: User | null
  name: string
  phone: string | null
  email: string | null
  source: LeadSource
  status: LeadStatus
  note: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type LeadActivity = {
  id: number
  lead_id: number
  actor_id: number | null
  actor?: User | null
  action: 'created' | 'updated' | 'status_changed' | 'deleted'
  changes: { before?: Record<string, unknown>; after?: Record<string, unknown> } | null
  created_at: string
}

export type Token = {
  token: string
  expires_at: string
  expires_in: number
}

export type TokenPair = {
  user: User
  access: Token
  refresh: Token
}

export type Paginated<T> = {
  data: T[]
  links: { first: string; last: string; prev: string | null; next: string | null }
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export type DashboardStats = {
  total: number
  by_status: Record<LeadStatus, number>
  by_source: Record<LeadSource, number>
  won_rate: number
  this_week: number
  this_month: number
}

export type ApiValidationError = {
  message: string
  errors: Record<string, string[]>
}
