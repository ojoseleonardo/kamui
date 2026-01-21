import React, { useState } from 'react'
import { 
  Youtube, 
  Search, 
  Filter, 
  Grid, 
  List, 
  ExternalLink,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  MoreVertical,
  Settings,
  Upload
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { formatNumber, formatDuration, timeAgo } from '@/lib/utils'

const uploadedVideos = [
  {
    id: 1,
    title: 'CLUTCH INSANO 1v5 no Valorant',
    description: 'O clutch mais épico que já fiz',
    thumbnail: 'https://picsum.photos/seed/yt1/320/180',
    views: 12500,
    likes: 892,
    comments: 45,
    duration: 125,
    privacy: 'public',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    youtubeId: 'abc123',
  },
  {
    id: 2,
    title: 'ACE PERFEITO com a Jett',
    description: 'Todos os headshots conectados',
    thumbnail: 'https://picsum.photos/seed/yt2/320/180',
    views: 8900,
    likes: 654,
    comments: 32,
    duration: 67,
    privacy: 'public',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    youtubeId: 'def456',
  },
  {
    id: 3,
    title: 'Momentos Engraçados #12',
    description: 'Compilação da semana',
    thumbnail: 'https://picsum.photos/seed/yt3/320/180',
    views: 5600,
    likes: 423,
    comments: 18,
    duration: 480,
    privacy: 'unlisted',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    youtubeId: 'ghi789',
  },
  {
    id: 4,
    title: 'Como fazer FLICKS perfeitos',
    description: 'Tutorial de aim no Valorant',
    thumbnail: 'https://picsum.photos/seed/yt4/320/180',
    views: 23400,
    likes: 1850,
    comments: 124,
    duration: 720,
    privacy: 'public',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    youtubeId: 'jkl012',
  },
  {
    id: 5,
    title: 'Partida Ranqueada Intensa',
    description: 'Do Bronze ao Ouro em uma sessão',
    thumbnail: 'https://picsum.photos/seed/yt5/320/180',
    views: 4200,
    likes: 312,
    comments: 28,
    duration: 1800,
    privacy: 'public',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
    youtubeId: 'mno345',
  },
  {
    id: 6,
    title: 'Teste de Sensibilidade',
    description: 'Encontrando o DPI perfeito',
    thumbnail: 'https://picsum.photos/seed/yt6/320/180',
    views: 1890,
    likes: 145,
    comments: 12,
    duration: 300,
    privacy: 'private',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    youtubeId: 'pqr678',
  },
]

const privacyConfig = {
  public: { label: 'Público', variant: 'success' },
  unlisted: { label: 'Não listado', variant: 'warning' },
  private: { label: 'Privado', variant: 'error' },
}

function YouTube() {
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPrivacy, setFilterPrivacy] = useState('all')

  const filteredVideos = uploadedVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPrivacy = filterPrivacy === 'all' || video.privacy === filterPrivacy
    return matchesSearch && matchesPrivacy
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
            <Youtube size={28} className="text-red-500" />
            YouTube
          </h1>
          <p className="text-kamui-white-muted mt-1">
            Seus clipes enviados ao YouTube
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings size={16} />
            Configurações
          </Button>
          <Button variant="primary" size="sm">
            <Upload size={16} />
            Upload Manual
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Youtube size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{uploadedVideos.length}</p>
              <p className="text-xs text-kamui-white-muted">Vídeos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Eye size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">
                {formatNumber(uploadedVideos.reduce((sum, v) => sum + v.views, 0))}
              </p>
              <p className="text-xs text-kamui-white-muted">Views Totais</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <ThumbsUp size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">
                {formatNumber(uploadedVideos.reduce((sum, v) => sum + v.likes, 0))}
              </p>
              <p className="text-xs text-kamui-white-muted">Likes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <MessageSquare size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">
                {formatNumber(uploadedVideos.reduce((sum, v) => sum + v.comments, 0))}
              </p>
              <p className="text-xs text-kamui-white-muted">Comentários</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-kamui-white-muted" />
          <input
            type="text"
            placeholder="Buscar vídeos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-kamui-gray border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50 transition-colors"
          />
        </div>

        {/* Privacy Filter */}
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

        {/* View Mode Toggle */}
        <div className="flex items-center bg-kamui-gray rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-kamui-red text-white' : 'text-kamui-white-muted hover:text-kamui-white'
            }`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-kamui-red text-white' : 'text-kamui-white-muted hover:text-kamui-white'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Videos Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden p-0">
              {/* Thumbnail */}
              <div className="relative group">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="primary">
                    <ExternalLink size={14} />
                    Abrir
                  </Button>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                  {formatDuration(video.duration)}
                </div>
                <div className="absolute top-2 left-2">
                  <Badge variant={privacyConfig[video.privacy].variant}>
                    {privacyConfig[video.privacy].label}
                  </Badge>
                </div>
              </div>
              
              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium text-kamui-white line-clamp-2 mb-2">
                  {video.title}
                </h3>
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
                    {timeAgo(video.uploadedAt)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-white/5">
            {filteredVideos.map((video) => (
              <div 
                key={video.id}
                className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
              >
                {/* Thumbnail */}
                <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white">
                    {formatDuration(video.duration)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-kamui-white truncate">{video.title}</h3>
                  <p className="text-sm text-kamui-white-muted truncate mt-1">{video.description}</p>
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

                {/* Status */}
                <Badge variant={privacyConfig[video.privacy].variant}>
                  {privacyConfig[video.privacy].label}
                </Badge>

                {/* Date */}
                <span className="text-sm text-kamui-white-muted whitespace-nowrap">
                  {timeAgo(video.uploadedAt)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost">
                    <ExternalLink size={16} />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <MoreVertical size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default YouTube
