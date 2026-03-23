import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'

export function useYoutubeChannel(enabled = true) {
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
      const d = await apiGet('/youtube/channel')
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
