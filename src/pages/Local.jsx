import React, { useState } from 'react'
import { 
  FolderOpen, 
  Search, 
  Upload,
  Trash2,
  Play,
  FileVideo,
  HardDrive,
  Clock,
  MoreVertical,
  CheckSquare,
  Square,
  FolderPlus,
  RefreshCw
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Progress } from '@/components/ui'
import { formatBytes, formatDuration, timeAgo } from '@/lib/utils'
import KamuiLoader from '@/components/ui/KamuiLoader'

const localClips = [
  {
    id: 1,
    name: 'clutch_final_valorant.mp4',
    size: 268435456,
    duration: 145,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    status: 'pending',
    thumbnail: 'https://picsum.photos/seed/local1/160/90',
  },
  {
    id: 2,
    name: 'ace_com_a_reyna.mp4',
    size: 157286400,
    duration: 62,
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    status: 'uploading',
    progress: 45,
    thumbnail: 'https://picsum.photos/seed/local2/160/90',
  },
  {
    id: 3,
    name: 'jogada_insana_cs2.mp4',
    size: 524288000,
    duration: 230,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    status: 'pending',
    thumbnail: 'https://picsum.photos/seed/local3/160/90',
  },
  {
    id: 4,
    name: 'highlight_reel_dezembro.mp4',
    size: 1073741824,
    duration: 600,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    status: 'processing',
    thumbnail: 'https://picsum.photos/seed/local4/160/90',
  },
  {
    id: 5,
    name: 'momento_engracado_squad.mp4',
    size: 104857600,
    duration: 45,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    status: 'pending',
    thumbnail: 'https://picsum.photos/seed/local5/160/90',
  },
  {
    id: 6,
    name: 'tutorial_smoke_mirage.mp4',
    size: 419430400,
    duration: 180,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'error',
    error: 'Falha na conexão',
    thumbnail: 'https://picsum.photos/seed/local6/160/90',
  },
]

const statusConfig = {
  pending: { label: 'Pendente', variant: 'info', icon: Clock },
  uploading: { label: 'Enviando', variant: 'warning', icon: Upload },
  processing: { label: 'Processando', variant: 'primary', icon: RefreshCw },
  error: { label: 'Erro', variant: 'error', icon: Trash2 },
}

function Local() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClips, setSelectedClips] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredClips = localClips.filter(clip => {
    const matchesSearch = clip.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || clip.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const toggleSelect = (id) => {
    setSelectedClips(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedClips.length === filteredClips.length) {
      setSelectedClips([])
    } else {
      setSelectedClips(filteredClips.map(c => c.id))
    }
  }

  const totalSize = localClips.reduce((sum, clip) => sum + clip.size, 0)
  const pendingCount = localClips.filter(c => c.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
            <FolderOpen size={28} className="text-kamui-red" />
            Clipes Locais
          </h1>
          <p className="text-kamui-white-muted mt-1">
            Clipes aguardando upload no seu computador
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <FolderPlus size={16} />
            Mudar Pasta
          </Button>
          <Button variant="primary" size="sm" disabled={selectedClips.length === 0}>
            <Upload size={16} />
            Upload ({selectedClips.length})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-kamui-red/20 flex items-center justify-center">
              <FileVideo size={20} className="text-kamui-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{localClips.length}</p>
              <p className="text-xs text-kamui-white-muted">Clipes</p>
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
              <p className="text-xs text-kamui-white-muted">Tamanho Total</p>
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
              <p className="text-xs text-kamui-white-muted">Pendentes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <FolderOpen size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-kamui-white truncate">C:/Users/Clips</p>
              <p className="text-xs text-kamui-white-muted">Pasta Monitorada</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Select All */}
        <button
          onClick={toggleSelectAll}
          className="flex items-center gap-2 text-sm text-kamui-white-muted hover:text-kamui-white transition-colors"
        >
          {selectedClips.length === filteredClips.length && filteredClips.length > 0 ? (
            <CheckSquare size={18} className="text-kamui-red" />
          ) : (
            <Square size={18} />
          )}
          Selecionar Todos
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-kamui-white-muted" />
          <input
            type="text"
            placeholder="Buscar clipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-kamui-gray border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none focus:border-kamui-red/50"
        >
          <option value="all">Todos os Status</option>
          <option value="pending">Pendentes</option>
          <option value="uploading">Enviando</option>
          <option value="processing">Processando</option>
          <option value="error">Com Erro</option>
        </select>

        {/* Bulk Actions */}
        {selectedClips.length > 0 && (
          <>
            <div className="w-px h-6 bg-white/10" />
            <Button variant="danger" size="sm">
              <Trash2 size={14} />
              Excluir ({selectedClips.length})
            </Button>
          </>
        )}
      </div>

      {/* Clips List */}
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-white/5">
          {filteredClips.map((clip) => (
            <div 
              key={clip.id}
              className={`flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group ${
                selectedClips.includes(clip.id) ? 'bg-kamui-red/5' : ''
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleSelect(clip.id)}
                className="text-kamui-white-muted hover:text-kamui-white transition-colors"
              >
                {selectedClips.includes(clip.id) ? (
                  <CheckSquare size={20} className="text-kamui-red" />
                ) : (
                  <Square size={20} />
                )}
              </button>

              {/* Thumbnail */}
              <div className="relative w-32 h-18 rounded-lg overflow-hidden flex-shrink-0 bg-kamui-gray">
                <img
                  src={clip.thumbnail}
                  alt={clip.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play size={24} className="text-white" fill="white" />
                </div>
                <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white">
                  {formatDuration(clip.duration)}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-kamui-white truncate">{clip.name}</h3>
                <div className="flex items-center gap-4 mt-1 text-xs text-kamui-white-muted">
                  <span>{formatBytes(clip.size)}</span>
                  <span>{timeAgo(clip.createdAt)}</span>
                </div>
                {clip.status === 'uploading' && (
                  <div className="mt-2">
                    <Progress value={clip.progress} className="h-1.5" />
                    <p className="text-xs text-kamui-white-muted mt-1">{clip.progress}% enviado</p>
                  </div>
                )}
                {clip.status === 'processing' && (
                  <div className="flex items-center gap-2 mt-2">
                    <KamuiLoader size="sm" />
                    <span className="text-xs text-kamui-white-muted">Processando vídeo...</span>
                  </div>
                )}
                {clip.status === 'error' && (
                  <p className="text-xs text-red-400 mt-1">{clip.error}</p>
                )}
              </div>

              {/* Status */}
              <Badge variant={statusConfig[clip.status].variant}>
                {statusConfig[clip.status].label}
              </Badge>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {clip.status === 'pending' && (
                  <Button size="sm" variant="primary">
                    <Upload size={14} />
                    Upload
                  </Button>
                )}
                {clip.status === 'error' && (
                  <Button size="sm" variant="outline">
                    <RefreshCw size={14} />
                    Retry
                  </Button>
                )}
                <Button size="icon" variant="ghost">
                  <MoreVertical size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {filteredClips.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen size={48} className="mx-auto text-kamui-gray-light mb-4" />
          <h3 className="text-lg font-medium text-kamui-white mb-2">Nenhum clipe encontrado</h3>
          <p className="text-kamui-white-muted">
            Grave novos clipes ou ajuste os filtros de busca
          </p>
        </div>
      )}
    </div>
  )
}

export default Local
