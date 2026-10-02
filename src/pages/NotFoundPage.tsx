import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-800">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="text-sm text-slate-500">This page doesn't exist.</p>
      <Link to="/" className="text-sm text-indigo-600 hover:underline">
        Back to dashboard
      </Link>
    </div>
  )
}
