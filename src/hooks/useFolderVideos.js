import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'

export function useFolderVideos(enabled = true) {
  const [videos, setVideos] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(!!enabled)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setVideos([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const d = await apiGet('/folder/videos')
      setVideos(d.videos || [])
      setError(null)
    } catch (e) {
      setError(e.message || String(e))
      setVideos([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { videos, error, loading, refresh }
}
