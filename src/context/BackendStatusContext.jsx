import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiGet } from '@/lib/api'

const BackendStatusContext = createContext({
  youtubeConnected: false,
  youtubeMessage: '',
  backendReachable: true,
  refresh: async () => {},
})

export function BackendStatusProvider({ children }) {
  const [youtubeConnected, setYoutubeConnected] = useState(false)
  const [youtubeMessage, setYoutubeMessage] = useState('')
  const [backendReachable, setBackendReachable] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const r = await apiGet('/youtube/status')
      setBackendReachable(true)
      setYoutubeConnected(!!r.connected)
      setYoutubeMessage(r.message || '')
    } catch {
      setBackendReachable(false)
      setYoutubeConnected(false)
      setYoutubeMessage('Sem conexão com o backend.')
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 12000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  const value = useMemo(
    () => ({
      youtubeConnected,
      youtubeMessage,
      backendReachable,
      refresh,
    }),
    [youtubeConnected, youtubeMessage, backendReachable, refresh],
  )

  return <BackendStatusContext.Provider value={value}>{children}</BackendStatusContext.Provider>
}

export function useBackendStatus() {
  return useContext(BackendStatusContext)
}
