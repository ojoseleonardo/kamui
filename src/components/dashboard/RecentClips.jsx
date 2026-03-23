import React from 'react'
import { Link } from 'react-router-dom'
import { Play, ExternalLink, Clock, Eye } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { timeAgo } from '@/lib/utils'
import { useEvents } from '@/hooks/useEvents'

function RecentClips() {
  const { events, error, loading } = useEvents({ limit: 6, type: 'upload_success' })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Play size={18} className="text-kamui-red" />
            Uploads recentes
          </CardTitle>
          <Link
            to="/youtube"
            className="text-sm text-kamui-red hover:text-kamui-red-light transition-colors"
          >
            Ver no YouTube
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-kamui-white-muted py-4">A carregar…</p>
        )}
        {error && (
          <p className="text-sm text-red-400 py-4">{error}</p>
        )}
        {!loading && !error && events.length === 0 && (
          <p className="text-sm text-kamui-white-muted py-4">Ainda não há uploads registados.</p>
        )}
        <div className="space-y-3">
          {events.map((ev) => {
            const thumb = ev.youtube_id
              ? `https://i.ytimg.com/vi/${ev.youtube_id}/mqdefault.jpg`
              : null
            return (
              <div
                key={ev.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
              >
                <div className="relative w-28 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-kamui-gray flex items-center justify-center">
                  {thumb ? (
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Play size={24} className="text-kamui-white-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-kamui-white truncate">
                    {ev.detail || ev.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    {ev.youtube_id && (
                      <span className="text-xs text-kamui-white-muted flex items-center gap-1">
                        <Eye size={12} />
                        {ev.youtube_id}
                      </span>
                    )}
                    <span className="text-xs text-kamui-white-muted flex items-center gap-1">
                      <Clock size={12} />
                      {timeAgo(ev.created_at)}
                    </span>
                  </div>
                </div>
                <Badge variant="success">Publicado</Badge>
                {ev.youtube_id && (
                  <a
                    href={`https://www.youtube.com/watch?v=${ev.youtube_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-opacity opacity-0 group-hover:opacity-100"
                    aria-label="Abrir no YouTube"
                  >
                    <ExternalLink size={16} className="text-kamui-white-muted" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default RecentClips
