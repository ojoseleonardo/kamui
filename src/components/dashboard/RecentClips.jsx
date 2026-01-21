import React from 'react'
import { Play, ExternalLink, MoreVertical, Clock, Eye } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { formatDuration, timeAgo, formatNumber } from '@/lib/utils'

const recentClips = [
  {
    id: 1,
    title: 'Clutch insano no Valorant',
    game: 'Valorant',
    duration: 125,
    views: 2340,
    status: 'uploaded',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 30),
    thumbnail: 'https://picsum.photos/seed/clip1/160/90',
  },
  {
    id: 2,
    title: 'Ace com a Jett',
    game: 'Valorant',
    duration: 45,
    views: 1580,
    status: 'uploaded',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    thumbnail: 'https://picsum.photos/seed/clip2/160/90',
  },
  {
    id: 3,
    title: 'Play épico no CS2',
    game: 'CS2',
    duration: 67,
    views: 890,
    status: 'processing',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    thumbnail: 'https://picsum.photos/seed/clip3/160/90',
  },
  {
    id: 4,
    title: 'Vitória dramática',
    game: 'League of Legends',
    duration: 180,
    views: 3200,
    status: 'uploaded',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    thumbnail: 'https://picsum.photos/seed/clip4/160/90',
  },
]

const statusConfig = {
  uploaded: { label: 'Publicado', variant: 'success' },
  processing: { label: 'Processando', variant: 'warning' },
  pending: { label: 'Pendente', variant: 'info' },
  error: { label: 'Erro', variant: 'error' },
}

function RecentClips() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Play size={18} className="text-kamui-red" />
            Clipes Recentes
          </CardTitle>
          <button className="text-sm text-kamui-red hover:text-kamui-red-light transition-colors">
            Ver todos
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentClips.map((clip) => (
            <div
              key={clip.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
            >
              {/* Thumbnail */}
              <div className="relative w-28 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-kamui-gray">
                <img
                  src={clip.thumbnail}
                  alt={clip.title}
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
                <h4 className="text-sm font-medium text-kamui-white truncate">
                  {clip.title}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-kamui-white-muted">{clip.game}</span>
                  <span className="text-xs text-kamui-white-muted flex items-center gap-1">
                    <Eye size={12} />
                    {formatNumber(clip.views)}
                  </span>
                  <span className="text-xs text-kamui-white-muted flex items-center gap-1">
                    <Clock size={12} />
                    {timeAgo(clip.uploadedAt)}
                  </span>
                </div>
              </div>

              {/* Status */}
              <Badge variant={statusConfig[clip.status].variant}>
                {statusConfig[clip.status].label}
              </Badge>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <ExternalLink size={16} className="text-kamui-white-muted" />
                </button>
                <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <MoreVertical size={16} className="text-kamui-white-muted" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default RecentClips
