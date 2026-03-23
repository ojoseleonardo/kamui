import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Youtube,
  Search,
  Grid,
  List,
  ExternalLink,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  Settings,
  Upload,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import KamuiLoader from '@/components/ui/KamuiLoader'
import { formatNumber, formatDuration, timeAgo } from '@/lib/utils'
import { apiPostJson, selectVideoFileElectron } from '@/lib/api'
import { useYoutubeVideos } from '@/hooks/useYoutubeVideos'

const privacyConfig = {
  public: { label: 'Público', variant: 'success' },
  unlisted: { label: 'Não listado', variant: 'warning' },
  private: { label: 'Privado', variant: 'error' },
}

function YouTube() {
  const navigate = useNavigate()
  const {
    items,
    nextPageToken,
    error,
    loading,
    initialDone,
    refresh,
    loadMore,
  } = useYoutubeVideos(true, 25)
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPrivacy, setFilterPrivacy] = useState('all')
  const [uploadBusy, setUploadBusy] = useState(false)

  const filteredVideos = items.filter((video) => {
    const t = (video.title || '').toLowerCase()
    const matchesSearch = t.includes(searchQuery.toLowerCase())
    const matchesPrivacy = filterPrivacy === 'all' || video.privacy === filterPrivacy
    return matchesSearch && matchesPrivacy
  })

  const totalLikes = filteredVideos.reduce((s, v) => s + (v.likes || 0), 0)
  const totalComments = filteredVideos.reduce((s, v) => s + (v.comments || 0), 0)

  const manualUpload = async () => {
    if (uploadBusy) return
    setUploadBusy(true)
    let path = null
    try {
      path = await selectVideoFileElectron()
      if (!path) return
      await apiPostJson('/uploads/manual', { path })
      await refresh()
    } catch (e) {
      window.alert(e.message || String(e))
    } finally {
      setUploadBusy(false)
    }
  }

  if (!initialDone && loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <KamuiLoader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
            <Youtube size={28} className="text-red-500" />
            YouTube
          </h1>
          <p className="text-kamui-white-muted mt-1">Vídeos do seu canal</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" type="button" onClick={() => navigate('/settings')}>
            <Settings size={16} />
            Configurações
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={manualUpload}
            disabled={uploadBusy}
            loading={uploadBusy}
          >
            <Upload size={16} />
            Upload manual
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Youtube size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{formatNumber(items.length)}</p>
              <p className="text-xs text-kamui-white-muted">Carregados (esta lista)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <ThumbsUp size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{formatNumber(totalLikes)}</p>
              <p className="text-xs text-kamui-white-muted">Likes (lista filtrada)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <MessageSquare size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{formatNumber(totalComments)}</p>
              <p className="text-xs text-kamui-white-muted">Comentários (lista filtrada)</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-kamui-white-muted" />
          <input
            type="text"
            placeholder="Buscar por título…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-kamui-gray border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50 transition-colors"
          />
        </div>
        <select
          value={filterPrivacy}
          onChange={(e) => setFilterPrivacy(e.target.value)}
          className="bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none focus:border-kamui-red/50"
        >
          <option value="all">Todos</option>
          <option value="public">Públicos</option>
          <option value="unlisted">Não listados</option>
          <option value="private">Privados</option>
        </select>
        <div className="flex items-center bg-kamui-gray rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-kamui-red text-white' : 'text-kamui-white-muted hover:text-kamui-white'
            }`}
          >
            <Grid size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-kamui-red text-white' : 'text-kamui-white-muted hover:text-kamui-white'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => {
            const pv = privacyConfig[video.privacy] || privacyConfig.public
            const href = `https://www.youtube.com/watch?v=${video.youtube_id}`
            return (
              <Card key={video.id} className="overflow-hidden p-0">
                <div className="relative group">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-kamui-gray" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a href={href} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="primary" type="button">
                        <ExternalLink size={14} />
                        Abrir
                      </Button>
                    </a>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                    {formatDuration(video.duration_seconds || 0)}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant={pv.variant}>{pv.label}</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-kamui-white line-clamp-2 mb-2">{video.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-kamui-white-muted">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {formatNumber(video.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={12} />
                      {formatNumber(video.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {video.published_at ? timeAgo(video.published_at) : '—'}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-white/5">
            {filteredVideos.map((video) => {
              const pv = privacyConfig[video.privacy] || privacyConfig.public
              const href = `https://www.youtube.com/watch?v=${video.youtube_id}`
              return (
                <div
                  key={video.id}
                  className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-kamui-gray">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white">
                      {formatDuration(video.duration_seconds || 0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-kamui-white truncate">{video.title}</h3>
                    <p className="text-sm text-kamui-white-muted truncate mt-1">
                      {(video.description || '').slice(0, 120)}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-kamui-white-muted">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {formatNumber(video.views)} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={12} />
                        {formatNumber(video.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        {formatNumber(video.comments)}
                      </span>
                    </div>
                  </div>
                  <Badge variant={pv.variant}>{pv.label}</Badge>
                  <span className="text-sm text-kamui-white-muted whitespace-nowrap">
                    {video.published_at ? timeAgo(video.published_at) : '—'}
                  </span>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="opacity-0 group-hover:opacity-100 p-2"
                    aria-label="Abrir"
                  >
                    <ExternalLink size={16} className="text-kamui-white-muted" />
                  </a>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {nextPageToken && (
        <div className="flex justify-center">
          <Button variant="outline" type="button" onClick={loadMore} disabled={loading} loading={loading}>
            Carregar mais
          </Button>
        </div>
      )}

      {initialDone && filteredVideos.length === 0 && !error && (
        <p className="text-center text-kamui-white-muted py-8">Nenhum vídeo encontrado.</p>
      )}
    </div>
  )
}

export default YouTube
