import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'

export function useDashboardSummary(enabled = true) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(!!enabled)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const d = await apiGet('/dashboard/summary')
      setData(d)
      setError(null)
    } catch (e) {
      setError(e.message || String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, error, loading, refresh }
}
