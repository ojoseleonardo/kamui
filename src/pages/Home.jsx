import React from 'react'
import { Folder, Upload, HardDrive, Youtube, TrendingUp, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, MetricCard } from '@/components/ui'
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
import { cn, formatBytes, formatNumber } from '@/lib/utils'

const youtubeDataPill =
  'min-w-0 max-w-[min(17rem,70%)] rounded-full border border-white/[0.08] bg-kamui-black/40 px-2.5 py-1 text-xs font-medium text-kamui-white shadow-inner shadow-black/10'

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
          title="Clipes na pasta"
          value={formatNumber(d.local_clips ?? 0)}
          subtitle="Arquivos na pasta monitorada neste momento"
          icon={Folder}
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
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-kamui-white-muted">Monitor</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    mon.active
                      ? 'border-green-500/30 bg-green-500/10 text-green-400'
                      : 'border-white/[0.08] bg-kamui-black/40 text-kamui-white-muted',
                  )}
                  role="status"
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      mon.active
                        ? 'animate-pulse bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.55)]'
                        : 'bg-kamui-gray-light',
                    )}
                    aria-hidden
                  />
                  {mon.active ? 'Ativo' : 'Parado'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-kamui-white-muted">YouTube API</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    youtubeConnected
                      ? 'border-green-500/30 bg-green-500/10 text-green-400'
                      : 'border-red-500/25 bg-red-500/10 text-red-400',
                  )}
                  role="status"
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      youtubeConnected
                        ? 'animate-pulse bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.55)]'
                        : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.45)]',
                    )}
                    aria-hidden
                  />
                  {youtubeConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-kamui-white-muted">Auto-upload</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    d.auto_upload
                      ? 'border-kamui-red/35 bg-kamui-red/10 text-kamui-red-light'
                      : 'border-white/[0.08] bg-kamui-black/40 text-kamui-white-muted',
                  )}
                  role="status"
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      d.auto_upload
                        ? 'animate-pulse bg-kamui-red shadow-[0_0_8px_rgba(196,30,58,0.5)]'
                        : 'bg-kamui-gray-light',
                    )}
                    aria-hidden
                  />
                  {d.auto_upload ? 'Sim' : 'Não'}
                </span>
              </div>
              {mon.watch_folder && (
                <div className="border-t border-white/5 pt-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-kamui-white-muted/70">
                      Pasta monitorada
                    </p>
                    <div
                      className="flex min-w-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-kamui-black/50 px-2.5 py-2 shadow-inner shadow-black/20"
                      title={mon.watch_folder}
                    >
                      <Folder size={15} className="shrink-0 text-kamui-red/85" aria-hidden />
                      <span
                        className="min-w-0 truncate font-mono text-[11px] leading-snug text-kamui-white/90 tracking-tight select-all"
                        dir="ltr"
                      >
                        {mon.watch_folder}
                      </span>
                    </div>
                  </div>
                </div>
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
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-sm text-kamui-white-muted">Canal</span>
                    <span
                      className={cn(youtubeDataPill, 'block truncate text-right')}
                      title={channel.data.title || undefined}
                    >
                      {channel.data.title || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-sm text-kamui-white-muted">Inscritos</span>
                    <span className={cn(youtubeDataPill, 'inline-block text-right tabular-nums')}>
                      {channel.data.hidden_subscriber_count
                        ? 'Oculto'
                        : formatNumber(channel.data.subscriber_count ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-sm text-kamui-white-muted">Views (30 dias)</span>
                    <span className={cn(youtubeDataPill, 'inline-block text-right tabular-nums')}>
                      {analytics.loading
                        ? '…'
                        : formatNumber(analytics.data?.views ?? 0)}
                    </span>
                  </div>
                  {analytics.data?.error && (
                    <p className="text-xs text-amber-400">{analytics.data.error}</p>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-sm text-kamui-white-muted">Tempo exibição (30 d)</span>
                    <span className={cn(youtubeDataPill, 'inline-block text-right tabular-nums')}>
                      {analytics.loading
                        ? '…'
                        : `${(analytics.data?.estimated_hours_watched ?? 0).toFixed(1)} h`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-sm text-kamui-white-muted">Vídeos (canal)</span>
                    <span className={cn(youtubeDataPill, 'inline-block text-right tabular-nums')}>
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
