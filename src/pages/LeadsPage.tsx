import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listLeads } from '../api/leads'
import { LEAD_SOURCES, LEAD_STATUSES, STATUS_BADGE } from '../lib/constants'
import type { LeadSource, LeadStatus } from '../lib/types'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { NewLeadModal } from '../components/NewLeadModal'

const SORTABLE_COLUMNS = [
  { field: 'name', label: 'Name' },
  { field: 'phone', label: 'Phone' },
  { field: 'email', label: 'Email' },
  { field: 'source', label: 'Source' },
  { field: 'status', label: 'Status' },
  { field: 'created_at', label: 'Created' },
] as const

const SORTABLE_FIELDS = new Set(['name', 'status', 'created_at', 'updated_at'])

export function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [newOpen, setNewOpen] = useState(false)

  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const source = searchParams.get('source') ?? ''
  const sort = searchParams.get('sort') ?? '-created_at'
  const page = Number(searchParams.get('page') ?? '1')

  // Keep the search input locally so typing is responsive; sync a
  // debounced copy into the URL (which drives the react-query key).
  const [searchDraft, setSearchDraft] = useState(q)
  const debouncedSearch = useDebouncedValue(searchDraft, 350)

  useEffect(() => {
    if (debouncedSearch === q) return

    const next = new URLSearchParams(searchParams)
    if (debouncedSearch) {
      next.set('q', debouncedSearch)
    } else {
      next.delete('q')
    }
    next.delete('page')
    setSearchParams(next, { replace: true })
  }, [debouncedSearch, q, searchParams, setSearchParams])

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ['leads', { q, status, source, sort, page }],
    queryFn: () =>
      listLeads({
        q: q || undefined,
        status: (status as LeadStatus) || undefined,
        source: (source as LeadSource) || undefined,
        sort,
        page,
      }),
    placeholderData: (previous) => previous,
  })

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (value === null || value === '') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    next.delete('page')
    setSearchParams(next)
  }

  function toggleSort(field: string) {
    if (!SORTABLE_FIELDS.has(field)) return
    const next = new URLSearchParams(searchParams)
    next.set('sort', sort === field ? `-${field}` : field)
    next.delete('page')
    setSearchParams(next)
  }

  function goToPage(target: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(target))
    setSearchParams(next)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="text-sm text-slate-500">
            {data?.meta.total ?? '…'} total · showing page {data?.meta.current_page ?? 1} of{' '}
            {data?.meta.last_page ?? 1}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + New lead
        </button>
      </section>

      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
        <label className="col-span-2 text-sm">
          <span className="text-slate-600">Search by name</span>
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Alice"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
        <SelectFilter
          label="Status"
          value={status}
          options={LEAD_STATUSES}
          onChange={(v) => updateParam('status', v)}
        />
        <SelectFilter
          label="Source"
          value={source}
          options={LEAD_SOURCES}
          onChange={(v) => updateParam('source', v)}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {SORTABLE_COLUMNS.map((col) => {
                const sortable = SORTABLE_FIELDS.has(col.field)
                const active = sort === col.field || sort === `-${col.field}`
                const direction = sort === col.field ? '↑' : sort === `-${col.field}` ? '↓' : ''
                return (
                  <th
                    key={col.field}
                    scope="col"
                    onClick={() => toggleSort(col.field)}
                    className={[
                      'px-4 py-2 font-medium',
                      sortable ? 'cursor-pointer select-none hover:text-slate-700' : '',
                      active ? 'text-slate-700' : '',
                    ].join(' ')}
                  >
                    {col.label} {direction}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isPending && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  Loading leads…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-rose-600">
                  Could not load leads.
                </td>
              </tr>
            )}
            {data !== undefined && data.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  No leads match the current filters.
                </td>
              </tr>
            )}
            {data?.data.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link
                    to={`/leads/${lead.id}`}
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    {lead.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{lead.phone ?? '—'}</td>
                <td className="px-4 py-2 text-slate-600">{lead.email ?? '—'}</td>
                <td className="px-4 py-2 text-slate-600">{lead.source}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[lead.status]}`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {data !== undefined && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            {isFetching ? 'Refreshing…' : `${data.meta.total} results`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={data.meta.current_page <= 1}
              onClick={() => goToPage(data.meta.current_page - 1)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-600">
              {data.meta.current_page} / {data.meta.last_page}
            </span>
            <button
              type="button"
              disabled={data.meta.current_page >= data.meta.last_page}
              onClick={() => goToPage(data.meta.current_page + 1)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {newOpen && <NewLeadModal onClose={() => setNewOpen(false)} />}
    </div>
  )
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="text-sm">
      <span className="text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
