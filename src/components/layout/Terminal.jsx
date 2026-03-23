import React, { useMemo, useState, useEffect, useRef } from 'react'
import { X, Minimize2, Maximize2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEvents } from '@/hooks/useEvents'
import { apiDelete } from '@/lib/api'

const typeToVisual = {
  upload_success: 'success',
  upload_error: 'error',
  clip_detected: 'info',
  file_deleted: 'warning',
  system: 'info',
}

function formatEventTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--:--:--'
  return d.toLocaleTimeString('pt-BR', { hour12: false })
}

function formatEventMessage(event) {
  const title = (event.title || '').trim()
  const detail = (event.detail || '').trim()
  const err = (event.error || '').trim()
  if (err) return `[ERRO] ${title || 'Falha'}${detail ? `: ${detail}` : ''} (${err})`
  if (title && detail) return `[${event.type || 'EVENT'}] ${title}: ${detail}`
  if (title) return `[${event.type || 'EVENT'}] ${title}`
  if (detail) return `[${event.type || 'EVENT'}] ${detail}`
  return `[${event.type || 'EVENT'}] Evento registado`
}

function Terminal({ isOpen, onClose }) {
  const { events, loading, refresh } = useEvents({ limit: 200, enabled: true })
  const [clearBusy, setClearBusy] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const terminalRef = useRef(null)

  const logs = useMemo(() => {
    return (events || [])
      .slice()
      .reverse()
      .map((event) => ({
        id: event.id,
        time: formatEventTime(event.created_at),
        type: typeToVisual[event.type] || 'info',
        message: formatEventMessage(event),
      }))
  }, [events])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  useEffect(() => {
    if (!isOpen) return
    refresh()
    const interval = setInterval(refresh, 5000)

    return () => clearInterval(interval)
  }, [isOpen, refresh])

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-kamui-white-muted'
    }
  }

  const clearLogs = async () => {
    if (clearBusy) return
    setClearBusy(true)
    try {
      await apiDelete('/events')
      await refresh()
    } finally {
      setClearBusy(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className={cn(
        'terminal-bg border-t border-green-500/20 transition-all duration-300',
        isMaximized ? 'h-96' : 'h-48'
      )}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-green-500/20 bg-black/50">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="terminal-text text-xs opacity-70">kamui@terminal ~ logs</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearLogs}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Limpar logs"
            disabled={clearBusy}
          >
            <Trash2 size={14} className="text-kamui-white-muted" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title={isMaximized ? 'Minimizar' : 'Maximizar'}
          >
            {isMaximized ? (
              <Minimize2 size={14} className="text-kamui-white-muted" />
            ) : (
              <Maximize2 size={14} className="text-kamui-white-muted" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Fechar"
          >
            <X size={14} className="text-kamui-white-muted" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="h-full overflow-auto p-4 font-mono text-xs leading-relaxed"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 hover:bg-white/5 px-1 -mx-1 rounded">
            <span className="text-kamui-gray-light shrink-0">[{log.time}]</span>
            <span className={cn('break-all', getLogColor(log.type))}>
              {log.message}
            </span>
          </div>
        ))}
        {!loading && logs.length === 0 && (
          <div className="text-kamui-white-muted">Nenhum evento recente.</div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-green-400">❯</span>
          <span className="w-2 h-4 bg-green-400 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default Terminal
