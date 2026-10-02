import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { extractApiError } from '../lib/errors'

export function RegisterPage() {
  const { status, register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      await register({ name, email, password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const { message, fieldErrors } = extractApiError(error)
      setGeneralError(message)
      setFieldErrors(fieldErrors)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-lg border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Create an account</h1>
          <p className="text-sm text-slate-500">Start tracking leads in Mini CRM.</p>
        </div>

        {generalError !== null && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {generalError}
          </div>
        )}

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {fieldErrors.name?.[0] !== undefined && (
            <span className="text-xs text-rose-600">{fieldErrors.name[0]}</span>
          )}
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {fieldErrors.email?.[0] !== undefined && (
            <span className="text-xs text-rose-600">{fieldErrors.email[0]}</span>
          )}
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-500">Minimum 8 characters.</span>
          {fieldErrors.password?.[0] !== undefined && (
            <span className="text-xs text-rose-600">{fieldErrors.password[0]}</span>
          )}
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
