interface AxiosError {
  response?: { data?: { message?: string; errors?: Record<string, string[]> } }
}

export function getErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as AxiosError
    const errors = axiosErr.response?.data?.errors
    if (errors) return Object.values(errors).flat().join(', ')
    if (axiosErr.response?.data?.message) return axiosErr.response.data.message
  }
  return fallback
}
