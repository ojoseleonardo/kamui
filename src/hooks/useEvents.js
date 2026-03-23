import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'

export function useEvents({ limit = 100, offset = 0, type, enabled = true } = {}) {
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(!!enabled)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setEvents([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = { limit, offset }
      if (type) params.type = type
      const d = await apiGet('/events', params)
      setEvents(d.events || [])
      setError(null)
    } catch (e) {
      setError(e.message || String(e))
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [enabled, limit, offset, type])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { events, error, loading, refresh }
}

export function useEventsStats(enabled = true) {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(!!enabled)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setStats(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const d = await apiGet('/events/stats')
      setStats(d)
      setError(null)
    } catch (e) {
      setError(e.message || String(e))
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { stats, error, loading, refresh }
}
