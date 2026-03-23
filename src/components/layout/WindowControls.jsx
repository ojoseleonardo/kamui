import React, { useEffect, useState, useCallback } from 'react'
import { Minus, Square, Copy, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function getIpcRenderer() {
  if (typeof window === 'undefined' || !window.require) return null
  try {
    return window.require('electron').ipcRenderer
  } catch {
    return null
  }
}

const btnClass =
  'flex h-full w-11 shrink-0 items-center justify-center text-kamui-white-muted transition-colors hover:bg-white/10 hover:text-kamui-white'

function WindowControls() {
  const [ipc] = useState(getIpcRenderer)
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    if (!ipc) return undefined
    const onState = (_e, payload) => {
      if (payload && typeof payload.maximized === 'boolean') {
        setMaximized(payload.maximized)
      }
    }
    ipc.on('window-state', onState)
    ipc.invoke('get-window-maximized').then(setMaximized).catch(() => {})
    return () => {
      ipc.removeListener('window-state', onState)
    }
  }, [ipc])

  const minimize = useCallback(() => ipc?.send('minimize-window'), [ipc])
  const toggleMax = useCallback(() => ipc?.send('maximize-window'), [ipc])
  const close = useCallback(() => ipc?.send('close-window'), [ipc])

  if (!ipc) return null

  return (
    <div
      className={cn(
        'flex h-full shrink-0 border-l border-white/10 no-drag',
        '-mr-px'
      )}
      role="toolbar"
      aria-label="Controles da janela"
    >
      <button
        type="button"
        className={btnClass}
        onClick={minimize}
        title="Minimizar"
      >
        <Minus size={18} strokeWidth={2} />
      </button>
      <button
        type="button"
        className={btnClass}
        onClick={toggleMax}
        title={maximized ? 'Restaurar' : 'Maximizar'}
      >
        {maximized ? (
          <Copy size={16} strokeWidth={2} className="opacity-90" />
        ) : (
          <Square size={14} strokeWidth={2} className="opacity-90" />
        )}
      </button>
      <button
        type="button"
        className={cn(
          btnClass,
          'hover:bg-red-600 hover:text-white'
        )}
        onClick={close}
        title="Fechar"
      >
        <X size={18} strokeWidth={2} />
      </button>
    </div>
  )
}

export default WindowControls
