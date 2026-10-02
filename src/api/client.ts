import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../auth/tokenStore'

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retried?: boolean
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token !== null) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// Collapse concurrent 401s into a single refresh so N parallel
// requests don't each burn a refresh token.
let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (refresh === null) {
    return null
  }

  if (refreshInFlight === null) {
    refreshInFlight = axios
      .post(
        `${api.defaults.baseURL}/api/auth/refresh`,
        { refresh },
        { headers: { Accept: 'application/json' } },
      )
      .then((response) => {
        const { access, refresh: newRefresh } = response.data
        setTokens(access.token, newRefresh.token)
        return access.token as string
      })
      .catch(() => {
        clearTokens()
        return null
      })
      .finally(() => {
        refreshInFlight = null
      })
  }

  return refreshInFlight
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequestConfig | undefined

    if (
      error.response?.status === 401 &&
      original !== undefined &&
      original._retried !== true &&
      !original.url?.endsWith('/api/auth/refresh') &&
      !original.url?.endsWith('/api/auth/login')
    ) {
      original._retried = true
      const newAccess = await refreshAccessToken()
      if (newAccess !== null) {
        original.headers.set('Authorization', `Bearer ${newAccess}`)
        return api.request(original as AxiosRequestConfig)
      }
    }

    return Promise.reject(error)
  },
)
