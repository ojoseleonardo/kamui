import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'

export function useYoutubeVideos(enabled = true, pageSize = 25) {
  const [items, setItems] = useState([])
  const [nextPageToken, setNextPageToken] = useState(undefined)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initialDone, setInitialDone] = useState(false)

  const fetchPage = useCallback(
    async (token, append) => {
      if (!enabled) {
        setItems([])
        setNextPageToken(undefined)
        setInitialDone(true)
        return
      }
      setLoading(true)
      try {
        const params = { max_results: pageSize }
        if (token) params.page_token = token
        const d = await apiGet('/youtube/videos', params)
        if (d.error) {
          throw new Error(d.error)
        }
        const chunk = d.items || []
        setItems((prev) => (append ? [...prev, ...chunk] : chunk))
        setNextPageToken(d.next_page_token || null)
        setError(null)
      } catch (e) {
        setError(e.message || String(e))
        if (!append) setItems([])
      } finally {
        setLoading(false)
        setInitialDone(true)
      }
    },
    [enabled, pageSize],
  )

  const refresh = useCallback(() => fetchPage(undefined, false), [fetchPage])

  const loadMore = useCallback(() => {
    if (nextPageToken) fetchPage(nextPageToken, true)
  }, [nextPageToken, fetchPage])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    items,
    nextPageToken,
    error,
    loading,
    initialDone,
    refresh,
    loadMore,
  }
}
