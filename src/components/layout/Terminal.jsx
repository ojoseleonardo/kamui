import React, { useState, useEffect, useRef } from 'react'
import { X, Minimize2, Maximize2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const initialLogs = [
  { time: '10:23:45', type: 'info', message: '[KAMUI] Sistema iniciado com sucesso' },
  { time: '10:23:46', type: 'info', message: '[MONITOR] Pasta de clipes configurada: C:/Users/Clips' },
  { time: '10:23:47', type: 'success', message: '[MONITOR] Monitoramento ativo' },
  { time: '10:24:12', type: 'info', message: '[DETECTOR] Novo arquivo detectado: clutch_momento.mp4' },
  { time: '10:24:13', type: 'info', message: '[UPLOAD] Iniciando processamento...' },
  { time: '10:24:30', type: 'success', message: '[UPLOAD] Thumbnail gerada automaticamente' },
  { time: '10:25:01', type: 'success', message: '[YOUTUBE] Upload iniciado para YouTube' },
  { time: '10:26:45', type: 'success', message: '[YOUTUBE] Upload concluído: https://youtu.be/abc123' },
  { time: '10:26:46', type: 'info', message: '[CLEANUP] Movendo arquivo para pasta processados' },
  { time: '10:27:00', type: 'warning', message: '[STORAGE] Espaço em disco: 15.2 GB restantes' },
]

function Terminal({ isOpen, onClose }) {
  const [logs, setLogs] = useState(initialLogs)
  const [isMaximized, setIsMaximized] = useState(false)
  const terminalRef = useRef(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  // Simulate new logs
  useEffect(() => {
    if (!isOpen) return
    
    const messages = [
      { type: 'info', message: '[MONITOR] Verificando pasta de clipes...' },
      { type: 'info', message: '[SYSTEM] Heartbeat check - OK' },
      { type: 'success', message: '[API] Conexão com YouTube API estável' },
    ]
    
    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)]
      const now = new Date()
      const time = now.toLocaleTimeString('pt-BR', { hour12: false })
      
      setLogs(prev => [...prev.slice(-50), { ...randomMsg, time }])
    }, 5000)

    return () => clearInterval(interval)
  }, [isOpen])

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-kamui-white-muted'
    }
  }

  const clearLogs = () => setLogs([])

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
        {logs.map((log, index) => (
          <div key={index} className="flex gap-2 hover:bg-white/5 px-1 -mx-1 rounded">
            <span className="text-kamui-gray-light shrink-0">[{log.time}]</span>
            <span className={cn('break-all', getLogColor(log.type))}>
              {log.message}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-green-400">❯</span>
          <span className="w-2 h-4 bg-green-400 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default Terminal
