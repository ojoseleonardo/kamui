import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useBackendStatus } from '@/context/BackendStatusContext'

function YoutubeDisconnectBanner() {
  const { youtubeConnected, youtubeMessage, backendReachable } = useBackendStatus()

  if (youtubeConnected && backendReachable) return null

  const text = !backendReachable
    ? 'Backend offline — reinicie o Kamui ou, em core/, rode uv sync (ou pip install -e .) e use KAMUI_PYTHON se necessário.'
    : `YouTube desconectado da API. ${youtubeMessage || 'Reconecte em Configurações.'}`

  return (
    <div
      className="flex shrink-0 items-center gap-3 border-b border-amber-500/30 bg-amber-950/80 px-4 py-2.5 text-sm text-amber-100 backdrop-blur-md"
      role="alert"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
      <p className="min-w-0 flex-1">{text}</p>
      {backendReachable && (
        <Link
          to="/settings"
          className="shrink-0 rounded-md bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-500/30"
        >
          Configurações
        </Link>
      )}
    </div>
  )
}

export default YoutubeDisconnectBanner
