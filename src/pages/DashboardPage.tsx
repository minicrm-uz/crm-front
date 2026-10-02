import { useAuth } from '../auth/useAuth'

export function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Mini CRM</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">{user?.email}</span>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-slate-500">
          Dashboard, leads list, and detail views land in Day 6.
        </p>
      </main>
    </div>
  )
}
