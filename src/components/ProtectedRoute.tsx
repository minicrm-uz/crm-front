import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading session…
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
