import React from 'react'
import { 
  Upload, 
  HardDrive, 
  Clock, 
  Youtube,
  TrendingUp,
  Play,
  Eye,
  Zap
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, MetricCard, Badge, Progress } from '@/components/ui'
import ActivityChart from '@/components/dashboard/ActivityChart'
import RecentClips from '@/components/dashboard/RecentClips'
import StorageWidget from '@/components/dashboard/StorageWidget'
import SharinganIcon from '@/components/ui/SharinganIcon'

function Home() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
            <SharinganIcon size={32} animated />
            Dashboard
          </h1>
          <p className="text-kamui-white-muted mt-1">
            Visão geral do seu sistema de clipes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Sistema Ativo
          </Badge>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Uploads"
          value="247"
          subtitle="Clipes enviados ao YouTube"
          icon={Upload}
          trend="up"
          trendValue="+12% este mês"
        />
        <MetricCard
          title="Espaço Liberado"
          value="128.5 GB"
          subtitle="Desde o início"
          icon={HardDrive}
          trend="up"
          trendValue="+8.2 GB esta semana"
        />
        <MetricCard
          title="Clipes Pendentes"
          value="3"
          subtitle="Aguardando processamento"
          icon={Clock}
        />
        <MetricCard
          title="Views Totais"
          value="52.4K"
          subtitle="Em todos os vídeos"
          icon={Eye}
          trend="up"
          trendValue="+2.3K esta semana"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart - 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-kamui-red" />
                  Atividade de Uploads
                </CardTitle>
                <select className="bg-kamui-gray border border-white/10 rounded-lg px-3 py-1.5 text-sm text-kamui-white-muted focus:outline-none focus:border-kamui-red/50">
                  <option>Últimos 7 dias</option>
                  <option>Últimos 30 dias</option>
                  <option>Este mês</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityChart />
            </CardContent>
          </Card>
        </div>

        {/* Storage Widget */}
        <div>
          <StorageWidget />
        </div>
      </div>

      {/* Recent Clips and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Clips - 2 columns */}
        <div className="lg:col-span-2">
          <RecentClips />
        </div>

        {/* Quick Actions / Status */}
        <div className="space-y-4">
          {/* Monitoring Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={18} className="text-kamui-red" />
                Status do Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-kamui-white-muted">Pasta Monitorada</span>
                <Badge variant="success">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-kamui-white-muted">YouTube API</span>
                <Badge variant="success">Conectado</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-kamui-white-muted">Auto-Upload</span>
                <Badge variant="primary">Ativo</Badge>
              </div>
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-kamui-white-muted mb-2">Próximo clipe na fila</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-kamui-gray flex items-center justify-center">
                    <Play size={16} className="text-kamui-red" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-kamui-white truncate">clutch_insano_2024.mp4</p>
                    <p className="text-xs text-kamui-white-muted">256 MB • 2:34</p>
                  </div>
                </div>
                <Progress value={65} className="mt-3" />
                <p className="text-xs text-kamui-white-muted mt-1">Processando... 65%</p>
              </div>
            </CardContent>
          </Card>

          {/* YouTube Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube size={18} className="text-red-500" />
                YouTube Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-kamui-white-muted">Inscritos</span>
                <span className="text-sm font-medium text-kamui-white">1.2K</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-kamui-white-muted">Views (30 dias)</span>
                <span className="text-sm font-medium text-kamui-white">15.8K</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-kamui-white-muted">Tempo de exibição</span>
                <span className="text-sm font-medium text-kamui-white">423h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-kamui-white-muted">Vídeos públicos</span>
                <span className="text-sm font-medium text-kamui-white">247</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Home
