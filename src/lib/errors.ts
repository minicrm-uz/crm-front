import type { AxiosError } from 'axios'
import type { ApiValidationError } from './types'

export function extractApiError(error: unknown): {
  message: string
  fieldErrors: Record<string, string[]>
} {
  const axiosError = error as AxiosError<ApiValidationError | { message?: string }>
  const data = axiosError.response?.data

  if (data !== undefined && 'errors' in data && data.errors !== undefined) {
    return {
      message: data.message ?? 'Validation failed.',
      fieldErrors: data.errors,
    }
  }

  const message =
    (data as { message?: string } | undefined)?.message ??
    axiosError.message ??
    'Something went wrong.'

  return { message, fieldErrors: {} }
}
