import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiGet } from '@/lib/api'

const BackendStatusContext = createContext({
  youtubeConnected: false,
  youtubeMessage: '',
  backendReachable: true,
  monitorActive: false,
  queueCount: 0,
  refresh: async () => {},
})

export function BackendStatusProvider({ children }) {
  const [youtubeConnected, setYoutubeConnected] = useState(false)
  const [youtubeMessage, setYoutubeMessage] = useState('')
  const [backendReachable, setBackendReachable] = useState(true)
  const [monitorActive, setMonitorActive] = useState(false)
  const [queueCount, setQueueCount] = useState(0)

  const refresh = useCallback(async (opts = {}) => {
    try {
      const r = await apiGet('/youtube/status', opts.probe ? { probe: true } : undefined)
      setBackendReachable(true)
      setYoutubeConnected(!!r.connected)
      setYoutubeMessage(r.message || '')
    } catch {
      setBackendReachable(false)
      setYoutubeConnected(false)
      setYoutubeMessage('Sem conexão com o backend.')
      setMonitorActive(false)
      setQueueCount(0)
    }
  }, [])

  const refreshMonitorStatus = useCallback(async () => {
    try {
      const m = await apiGet('/monitor/status')
      setBackendReachable(true)
      setMonitorActive(!!m.active)
      setQueueCount(Number(m?.queue?.total ?? 0))
    } catch {
      setBackendReachable(false)
      setMonitorActive(false)
      setQueueCount(0)
    }
  }, [])

  useEffect(() => {
    refresh()
    refreshMonitorStatus()

    const POLL_MS = 300000
    let intervalId = null
    let lastFocusRefresh = 0

    const armInterval = () => {
      if (intervalId != null) {
        clearInterval(intervalId)
        intervalId = null
      }
      if (document.visibilityState === 'visible') {
        intervalId = window.setInterval(refresh, POLL_MS)
      }
    }

    const MONITOR_POLL_MS = 8000
    let monitorIntervalId = null

    const armMonitorInterval = () => {
      if (monitorIntervalId != null) {
        clearInterval(monitorIntervalId)
        monitorIntervalId = null
      }
      if (document.visibilityState === 'visible') {
        monitorIntervalId = window.setInterval(refreshMonitorStatus, MONITOR_POLL_MS)
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh()
        refreshMonitorStatus()
      }
      armInterval()
      armMonitorInterval()
    }

    const onFocus = () => {
      const now = Date.now()
      if (now - lastFocusRefresh < 60000) return
      lastFocusRefresh = now
      refresh()
      refreshMonitorStatus()
    }

    armInterval()
    armMonitorInterval()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)

    return () => {
      if (intervalId != null) clearInterval(intervalId)
      if (monitorIntervalId != null) clearInterval(monitorIntervalId)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh, refreshMonitorStatus])

  const value = useMemo(
    () => ({
      youtubeConnected,
      youtubeMessage,
      backendReachable,
      monitorActive,
      queueCount,
      refresh,
    }),
    [youtubeConnected, youtubeMessage, backendReachable, monitorActive, queueCount, refresh],
  )

  return <BackendStatusContext.Provider value={value}>{children}</BackendStatusContext.Provider>
}

export function useBackendStatus() {
  return useContext(BackendStatusContext)
}
