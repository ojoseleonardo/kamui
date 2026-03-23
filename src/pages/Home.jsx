import React from 'react'
import { Upload, HardDrive, Clock, Youtube, TrendingUp, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, MetricCard, Badge } from '@/components/ui'
import ActivityChart from '@/components/dashboard/ActivityChart'
import RecentClips from '@/components/dashboard/RecentClips'
import StorageWidget from '@/components/dashboard/StorageWidget'
import SharinganIcon from '@/components/ui/SharinganIcon'
import KamuiLoader from '@/components/ui/KamuiLoader'
import { useBackendStatus } from '@/context/BackendStatusContext'
import { useDashboardSummary } from '@/hooks/useDashboardSummary'
import { useFolderSummary } from '@/hooks/useFolderSummary'
import { useYoutubeChannel } from '@/hooks/useYoutubeChannel'
import { useYoutubeAnalytics } from '@/hooks/useYoutubeAnalytics'
import { formatBytes, formatNumber } from '@/lib/utils'

function Home() {
  const { backendReachable, youtubeConnected } = useBackendStatus()
  const dash = useDashboardSummary(backendReachable)
  const folder = useFolderSummary(backendReachable)
  const channel = useYoutubeChannel(backendReachable && youtubeConnected)
  const analytics = useYoutubeAnalytics(backendReachable && youtubeConnected, 30)

  const loadingCore = dash.loading && !dash.data

  if (!backendReachable) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-kamui-white-muted">
        <p>Backend offline. Inicie o Kamui ou o servidor Python.</p>
      </div>
    )
  }

  if (loadingCore) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <KamuiLoader />
      </div>
    )
  }

  const d = dash.data || {}
  const act = d.activity_days || []
  const mon = d.monitor || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
            <SharinganIcon size={32} animated />
            Dashboard
          </h1>
          <p className="text-kamui-white-muted mt-1">Visão geral do sistema de clipes</p>
        </div>
        <div
          className="flex items-center"
          title={mon.active ? 'Monitor ativo' : 'Monitor parado'}
        >
          <span
            className={`h-2 w-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)] ${
              mon.active ? 'animate-pulse bg-green-500' : 'bg-kamui-gray-light'
            }`}
            role="status"
            aria-label={mon.active ? 'Monitor ativo' : 'Monitor inativo'}
          />
        </div>
      </div>

      {dash.error && (
        <p className="text-sm text-amber-400">Resumo: {dash.error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total de uploads"
          value={formatNumber(d.total_uploads ?? 0)}
          subtitle="Envios concluídos (Kamui)"
          icon={Upload}
        />
        <MetricCard
          title="Espaço dos clipes"
          value={
            folder.data ? formatBytes(folder.data.total_size_bytes || 0) : '—'
          }
          subtitle="Na pasta monitorada"
          icon={HardDrive}
        />
        <MetricCard
          title="Clipes pendentes"
          value={formatNumber(d.pending_clips ?? 0)}
          subtitle="Ficheiros ainda não enviados"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 items-stretch lg:grid-cols-3 gap-6">
        <div className="flex min-h-0 w-full lg:col-span-2">
          <Card className="flex h-full w-full flex-col">
            <CardHeader className="shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-kamui-red" />
                  Atividade (7 dias)
                </CardTitle>
              </div>
              {d.activity_views_error && (
                <p className="text-xs text-amber-400/90 mt-2">{d.activity_views_error}</p>
              )}
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-64 flex-1">
                <ActivityChart data={act} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex min-h-0 w-full">
          <StorageWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentClips />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={18} className="text-kamui-red" />
                Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-kamui-white-muted">Monitor</span>
                <Badge variant={mon.active ? 'success' : 'warning'}>
                  {mon.active ? 'Ativo' : 'Parado'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-kamui-white-muted">YouTube API</span>
                <Badge variant={youtubeConnected ? 'success' : 'error'}>
                  {youtubeConnected ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-kamui-white-muted">Auto-upload</span>
                <Badge variant={d.auto_upload ? 'primary' : 'default'}>
                  {d.auto_upload ? 'Sim' : 'Não'}
                </Badge>
              </div>
              {mon.watch_folder && (
                <p className="text-xs text-kamui-white-muted break-all border-t border-white/5 pt-2">
                  {mon.watch_folder}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube size={18} className="text-red-500" />
                YouTube
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!youtubeConnected && (
                <p className="text-sm text-kamui-white-muted">Conecte a conta em Configurações.</p>
              )}
              {youtubeConnected && channel.loading && (
                <p className="text-sm text-kamui-white-muted">A carregar canal…</p>
              )}
              {youtubeConnected && channel.error && (
                <p className="text-xs text-amber-400">{channel.error}</p>
              )}
              {youtubeConnected && channel.data && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-kamui-white-muted">Canal</span>
                    <span className="text-sm font-medium text-kamui-white truncate max-w-[60%] text-right">
                      {channel.data.title || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-kamui-white-muted">Inscritos</span>
                    <span className="text-sm font-medium text-kamui-white">
                      {channel.data.hidden_subscriber_count
                        ? 'Oculto'
                        : formatNumber(channel.data.subscriber_count ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-kamui-white-muted">Views (30 dias)</span>
                    <span className="text-sm font-medium text-kamui-white">
                      {analytics.loading
                        ? '…'
                        : formatNumber(analytics.data?.views ?? 0)}
                    </span>
                  </div>
                  {analytics.data?.error && (
                    <p className="text-xs text-amber-400">{analytics.data.error}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-kamui-white-muted">Tempo exibição (30 d)</span>
                    <span className="text-sm font-medium text-kamui-white">
                      {analytics.loading
                        ? '…'
                        : `${(analytics.data?.estimated_hours_watched ?? 0).toFixed(1)} h`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-kamui-white-muted">Vídeos (canal)</span>
                    <span className="text-sm font-medium text-kamui-white">
                      {formatNumber(channel.data.video_count ?? 0)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Home
