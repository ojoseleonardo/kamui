import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'

export function useYoutubeAnalytics(enabled = true, days = 30) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - (days - 1))
      const start_date = start.toISOString().slice(0, 10)
      const end_date = end.toISOString().slice(0, 10)
      const d = await apiGet('/youtube/analytics', { start_date, end_date })
      setData(d)
      setError(null)
    } catch (e) {
      setError(e.message || String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, days])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, error, loading, refresh }
}
