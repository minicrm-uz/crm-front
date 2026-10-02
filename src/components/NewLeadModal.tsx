import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { createLead, type CreateLeadPayload } from '../api/leads'
import { LEAD_SOURCES } from '../lib/constants'
import { extractApiError } from '../lib/errors'
import type { LeadSource } from '../lib/types'

export function NewLeadModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState<LeadSource>('Website')
  const [note, setNote] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const mutation = useMutation({
    mutationFn: (payload: CreateLeadPayload) => createLead(payload),
    onSuccess: (lead) => {
      toast.success('Lead created')
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      onClose()
      navigate(`/leads/${lead.id}`)
    },
    onError: (error) => {
      const { message, fieldErrors } = extractApiError(error)
      setFieldErrors(fieldErrors)
      if (Object.keys(fieldErrors).length === 0) {
        toast.error(message)
      }
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldErrors({})
    mutation.mutate({
      name,
      phone: phone || null,
      email: email || null,
      source,
      note: note || null,
    })
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 px-4">
      <div
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">New lead</h2>
            <p className="text-sm text-slate-500">
              You'll be redirected to the lead's page after creation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

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
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-70"
            >
              {mutation.isPending ? 'Creating…' : 'Create lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
