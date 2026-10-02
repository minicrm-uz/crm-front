import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../api/auth'
import type { TokenPair } from '../lib/types'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'
import { clearTokens, getRefreshToken, setTokens } from './tokenStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    getRefreshToken() === null ? 'anonymous' : 'loading',
  )

  const applyPair = useCallback((pair: TokenPair) => {
    setTokens(pair.access.token, pair.refresh.token)
    setUser(pair.user)
    setStatus('authenticated')
  }, [])

  // When we boot with a refresh token in storage, resolve the current
  // user. The axios interceptor turns the first 401 from /auth/me
  // into a refresh + retry, so a reload with only a refresh token
  // still restores the session.
  useEffect(() => {
    if (status !== 'loading') {
      return
    }

    let cancelled = false

    fetchCurrentUser()
      .then((fetched) => {
        if (!cancelled) {
          setUser(fetched)
          setStatus('authenticated')
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearTokens()
          setUser(null)
          setStatus('anonymous')
        }
      })

    return () => {
      cancelled = true
    }
  }, [status])

  const login = useCallback<AuthContextValue['login']>(
    async (payload) => {
      applyPair(await loginRequest(payload))
    },
    [applyPair],
  )

  const register = useCallback<AuthContextValue['register']>(
    async (payload) => {
      applyPair(await registerRequest(payload))
    },
    [applyPair],
  )

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    try {
      await logoutRequest()
    } finally {
      clearTokens()
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
