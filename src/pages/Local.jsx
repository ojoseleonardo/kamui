import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  Search,
  Upload,
  FileVideo,
  HardDrive,
  Clock,
  RefreshCw,
  Play,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { formatBytes, timeAgo } from '@/lib/utils'
import KamuiLoader from '@/components/ui/KamuiLoader'
import { apiPostJson } from '@/lib/api'
import { useFolderVideos } from '@/hooks/useFolderVideos'
import { useBackendStatus } from '@/context/BackendStatusContext'

function Local() {
  const navigate = useNavigate()
  const { backendReachable } = useBackendStatus()
  const { videos, error, loading, refresh } = useFolderVideos(backendReachable)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [uploadPath, setUploadPath] = useState(null)
  const [uploadBusy, setUploadBusy] = useState(false)

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      const name = (v.name || '').toLowerCase()
      const okSearch = !searchQuery || name.includes(searchQuery.toLowerCase())
      const okFilter =
        filter === 'all' ||
        (filter === 'pending' && !v.uploaded) ||
        (filter === 'uploaded' && v.uploaded)
      return okSearch && okFilter
    })
  }, [videos, searchQuery, filter])

  const totalSize = videos.reduce((s, v) => s + (v.size || 0), 0)
  const pendingCount = videos.filter((v) => !v.uploaded).length

  const uploadOne = async (path) => {
    setUploadPath(path)
    setUploadBusy(true)
    try {
      await apiPostJson('/uploads/manual', { path })
      await refresh()
    } catch (e) {
      window.alert(e.message || String(e))
    } finally {
      setUploadBusy(false)
      setUploadPath(null)
    }
  }

  if (!backendReachable) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-kamui-white-muted">
        Backend offline.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
            <FolderOpen size={28} className="text-kamui-red" />
            Clipes locais
          </h1>
          <p className="text-kamui-white-muted mt-1">Ficheiros na pasta monitorada</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" type="button" onClick={() => refresh()}>
            <RefreshCw size={16} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={() => navigate('/settings')}>
            Pasta
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-kamui-red/20 flex items-center justify-center">
              <FileVideo size={20} className="text-kamui-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{videos.length}</p>
              <p className="text-xs text-kamui-white-muted">Vídeos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <HardDrive size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{formatBytes(totalSize)}</p>
              <p className="text-xs text-kamui-white-muted">Tamanho total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{pendingCount}</p>
              <p className="text-xs text-kamui-white-muted">Pendentes de upload</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-kamui-white-muted" />
          <input
            type="text"
            placeholder="Buscar por nome…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-kamui-gray border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50 transition-colors"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none focus:border-kamui-red/50"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="uploaded">Já enviados</option>
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <KamuiLoader />
        </div>
      )}

      {!loading && (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-white/5">
            {filtered.map((clip) => (
              <div
                key={clip.path}
                className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-16 h-10 rounded-lg bg-kamui-gray flex items-center justify-center flex-shrink-0">
                  <Play size={20} className="text-kamui-white-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-kamui-white truncate">{clip.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-kamui-white-muted">
                    <span>{formatBytes(clip.size || 0)}</span>
                    {clip.modified && <span>{timeAgo(clip.modified)}</span>}
                  </div>
                </div>
                <Badge variant={clip.uploaded ? 'success' : 'warning'}>
                  {clip.uploaded ? 'Enviado' : 'Pendente'}
                </Badge>
                {!clip.uploaded && (
                  <Button
                    size="sm"
                    variant="primary"
                    type="button"
                    disabled={uploadBusy}
                    loading={uploadBusy && uploadPath === clip.path}
                    onClick={() => uploadOne(clip.path)}
                  >
                    <Upload size={14} />
                    Enviar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-12 text-kamui-white-muted">
          <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum ficheiro encontrado.</p>
        </div>
      )}
    </div>
  )
}

export default Local
