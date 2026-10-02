// Token storage lives outside React so axios interceptors (which run
// outside the component tree) can read/write tokens synchronously.
//
// Design tradeoff:
//   access token  -> in-memory only. If an attacker runs script in
//                    the SPA they already have it, but a page refresh
//                    forces a refresh-token flow.
//   refresh token -> localStorage. Vulnerable to XSS by design, but
//                    survives reloads and avoids a Laravel session
//                    layer we don't want. A production hardening step
//                    would be an httpOnly SameSite=Strict cookie plus
//                    a CSRF token for the refresh endpoint.

const REFRESH_KEY = 'crm.refresh'

let accessToken: string | null = null
const listeners = new Set<() => void>()

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(access: string, refresh: string): void {
  accessToken = access
  localStorage.setItem(REFRESH_KEY, refresh)
  listeners.forEach((fn) => fn())
}

export function clearTokens(): void {
  accessToken = null
  localStorage.removeItem(REFRESH_KEY)
  listeners.forEach((fn) => fn())
}

export function subscribeToTokenChanges(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
