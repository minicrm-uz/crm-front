import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  deleteLead,
  getLead,
  listLeadActivities,
  updateLead,
  updateLeadStatus,
} from '../api/leads'
import { LEAD_SOURCES, LEAD_STATUSES, STATUS_BADGE } from '../lib/constants'
import { extractApiError } from '../lib/errors'
import type { Lead, LeadActivity, LeadSource, LeadStatus } from '../lib/types'

export function LeadDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const leadQuery = useQuery({
    queryKey: ['leads', 'detail', id],
    queryFn: () => getLead(id),
    enabled: Number.isFinite(id),
  })

  const activitiesQuery = useQuery({
    queryKey: ['leads', 'activities', id],
    queryFn: () => listLeadActivities(id),
    enabled: Number.isFinite(id),
  })

  const statusMutation = useMutation({
    mutationFn: (nextStatus: LeadStatus) => updateLeadStatus(id, nextStatus),
    onSuccess: (lead) => {
      toast.success(`Status set to ${lead.status}`)
      queryClient.setQueryData(['leads', 'detail', id], lead)
      void queryClient.invalidateQueries({ queryKey: ['leads', 'activities', id] })
      void queryClient.invalidateQueries({ queryKey: ['leads'], exact: false })
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
    },
    onError: (error) => toast.error(extractApiError(error).message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteLead(id),
    onSuccess: () => {
      toast.success('Lead deleted')
      void queryClient.invalidateQueries({ queryKey: ['leads'], exact: false })
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      navigate('/leads')
    },
    onError: (error) => toast.error(extractApiError(error).message),
  })

  if (leadQuery.isPending) {
    return <p className="text-sm text-slate-500">Loading lead…</p>
  }

  if (leadQuery.isError || leadQuery.data === undefined) {
    return (
      <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        This lead doesn't exist or you don't have access to it.
      </p>
    )
  }

  const lead = leadQuery.data

  function onDelete() {
    if (window.confirm('Delete this lead? (soft delete — activity log is retained)')) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{lead.name}</h1>
          <p className="text-sm text-slate-500">
            Lead #{lead.id} · created {new Date(lead.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusDropdown
            value={lead.status}
            disabled={statusMutation.isPending}
            onChange={(next) => statusMutation.mutate(next)}
          />
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteMutation.isPending}
            className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-70"
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Details</h2>
          <EditLeadForm key={lead.id} lead={lead} />
        </section>

        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Activity</h2>
          {activitiesQuery.isPending && (
            <p className="text-sm text-slate-500">Loading activity…</p>
          )}
          {activitiesQuery.isError && (
            <p className="text-sm text-rose-600">Could not load activity.</p>
          )}
          {activitiesQuery.data?.data.length === 0 && (
            <p className="text-sm text-slate-500">No activity yet.</p>
          )}
          <ul className="space-y-3">
            {activitiesQuery.data?.data.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

// Separate component so we can seed form state via lazy useState
// initializers (keyed on lead.id in the parent) instead of an effect
// that overwrites user edits whenever the lead refetches.
function EditLeadForm({ lead }: { lead: Lead }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(lead.name)
  const [phone, setPhone] = useState(lead.phone ?? '')
  const [email, setEmail] = useState(lead.email ?? '')
  const [source, setSource] = useState<LeadSource>(lead.source)
  const [note, setNote] = useState(lead.note ?? '')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const mutation = useMutation({
    mutationFn: () =>
      updateLead(lead.id, {
        name,
        phone: phone || null,
        email: email || null,
        source,
        note: note || null,
      }),
    onSuccess: (updated) => {
      toast.success('Lead updated')
      queryClient.setQueryData(['leads', 'detail', lead.id], updated)
      void queryClient.invalidateQueries({ queryKey: ['leads', 'activities', lead.id] })
      void queryClient.invalidateQueries({ queryKey: ['leads'], exact: false })
    },
    onError: (error) => {
      const { message, fieldErrors } = extractApiError(error)
      setFieldErrors(fieldErrors)
      if (Object.keys(fieldErrors).length === 0) toast.error(message)
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldErrors({})
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Name" error={fieldErrors.name?.[0]}>
        <input
          type="text"
          required
          maxLength={255}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone" error={fieldErrors.phone?.[0]}>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </Field>
        <Field label="Email" error={fieldErrors.email?.[0]}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </Field>
      </div>

      <Field label="Source" error={fieldErrors.source?.[0]}>
        <select
          value={source}
          onChange={(event) => setSource(event.target.value as LeadSource)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {LEAD_SOURCES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Note" error={fieldErrors.note?.[0]}>
        <textarea
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </Field>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-70"
        >
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function StatusDropdown({
  value,
  disabled,
  onChange,
}: {
  value: LeadStatus
  disabled?: boolean
  onChange: (next: LeadStatus) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[value]}`}
      >
        {value}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as LeadStatus)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {LEAD_STATUSES.map((option) => (
          <option key={option} value={option}>
            Set to {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string | undefined
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {error !== undefined && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  )
}

function ActivityItem({ activity }: { activity: LeadActivity }) {
  const actor = activity.actor?.name ?? 'Unknown'
  const when = new Date(activity.created_at).toLocaleString()

  return (
    <li className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          <span className="font-medium text-slate-700">{actor}</span>{' '}
          {describeAction(activity)}
        </span>
        <span>{when}</span>
      </div>
      {activity.changes !== null && activity.action !== 'created' && (
        <ChangeList activity={activity} />
      )}
    </li>
  )
}

function describeAction(activity: LeadActivity): string {
  switch (activity.action) {
    case 'created':
      return 'created this lead'
    case 'updated':
      return 'edited lead details'
    case 'status_changed':
      return 'changed the status'
    case 'deleted':
      return 'deleted this lead'
  }
}

function ChangeList({ activity }: { activity: LeadActivity }) {
  const before = (activity.changes?.before ?? {}) as Record<string, unknown>
  const after = (activity.changes?.after ?? {}) as Record<string, unknown>
  const fields = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))

  if (fields.length === 0) return null

  return (
    <ul className="mt-2 space-y-1 text-xs text-slate-600">
      {fields.map((field) => (
        <li key={field}>
          <span className="font-medium text-slate-700">{field}:</span>{' '}
          <span className="text-rose-600 line-through">{formatValue(before[field])}</span>{' '}
          → <span className="text-emerald-700">{formatValue(after[field])}</span>
        </li>
      ))}
    </ul>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '∅'
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}
