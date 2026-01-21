import React, { useState } from 'react'
import { 
  History as HistoryIcon,
  Search,
  Filter,
  Calendar,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileVideo,
  ExternalLink,
  ChevronDown,
  Download
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { formatBytes, formatDateTime, timeAgo } from '@/lib/utils'

const historyItems = [
  {
    id: 1,
    type: 'upload_success',
    title: 'Upload concluído',
    description: 'clutch_final_valorant.mp4 foi enviado com sucesso',
    fileName: 'clutch_final_valorant.mp4',
    fileSize: 268435456,
    youtubeUrl: 'https://youtube.com/watch?v=abc123',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 2,
    type: 'clip_detected',
    title: 'Novo clipe detectado',
    description: 'ace_com_a_reyna.mp4 adicionado à fila',
    fileName: 'ace_com_a_reyna.mp4',
    fileSize: 157286400,
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: 3,
    type: 'upload_error',
    title: 'Falha no upload',
    description: 'Erro de conexão ao enviar jogada_insana_cs2.mp4',
    fileName: 'jogada_insana_cs2.mp4',
    fileSize: 524288000,
    error: 'Network timeout after 30s',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 4,
    type: 'file_deleted',
    title: 'Arquivo removido',
    description: 'highlight_antigo.mp4 foi deletado automaticamente',
    fileName: 'highlight_antigo.mp4',
    fileSize: 1073741824,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: 5,
    type: 'upload_success',
    title: 'Upload concluído',
    description: 'momento_engracado.mp4 foi enviado com sucesso',
    fileName: 'momento_engracado.mp4',
    fileSize: 104857600,
    youtubeUrl: 'https://youtube.com/watch?v=def456',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
  {
    id: 6,
    type: 'system',
    title: 'Sistema iniciado',
    description: 'Kamui iniciou o monitoramento da pasta',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: 7,
    type: 'upload_success',
    title: 'Upload concluído',
    description: 'tutorial_smoke.mp4 foi enviado com sucesso',
    fileName: 'tutorial_smoke.mp4',
    fileSize: 419430400,
    youtubeUrl: 'https://youtube.com/watch?v=ghi789',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 8,
    type: 'clip_detected',
    title: 'Novo clipe detectado',
    description: 'partida_ranqueada.mp4 adicionado à fila',
    fileName: 'partida_ranqueada.mp4',
    fileSize: 2147483648,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: 9,
    type: 'upload_error',
    title: 'Falha no upload',
    description: 'Arquivo muito grande: partida_ranqueada.mp4',
    fileName: 'partida_ranqueada.mp4',
    fileSize: 2147483648,
    error: 'File size exceeds 2GB limit',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30),
  },
  {
    id: 10,
    type: 'system',
    title: 'Atualização disponível',
    description: 'Nova versão do Kamui disponível: v2.1.0',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
]

const typeConfig = {
  upload_success: {
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Upload',
    variant: 'success',
  },
  upload_error: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    label: 'Erro',
    variant: 'error',
  },
  clip_detected: {
    icon: FileVideo,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    label: 'Detectado',
    variant: 'info',
  },
  file_deleted: {
    icon: Trash2,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    label: 'Deletado',
    variant: 'warning',
  },
  system: {
    icon: AlertCircle,
    color: 'text-kamui-white-muted',
    bgColor: 'bg-kamui-gray',
    label: 'Sistema',
    variant: 'default',
  },
}

function History() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [dateRange, setDateRange] = useState('all')

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || item.type === filterType
    
    // Date filtering
    let matchesDate = true
    const now = new Date()
    if (dateRange === 'today') {
      matchesDate = item.timestamp.toDateString() === now.toDateString()
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
      matchesDate = item.timestamp >= weekAgo
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
      matchesDate = item.timestamp >= monthAgo
    }
    
    return matchesSearch && matchesType && matchesDate
  })

  // Stats
  const stats = {
    total: historyItems.length,
    uploads: historyItems.filter(i => i.type === 'upload_success').length,
    errors: historyItems.filter(i => i.type === 'upload_error').length,
    detected: historyItems.filter(i => i.type === 'clip_detected').length,
  }

  // Group by date
  const groupedItems = filteredItems.reduce((groups, item) => {
    const date = item.timestamp.toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
    return groups
  }, {})

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
            <HistoryIcon size={28} className="text-kamui-red" />
            Histórico
          </h1>
          <p className="text-kamui-white-muted mt-1">
            Timeline completa de todas as ações
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download size={16} />
            Exportar
          </Button>
          <Button variant="danger" size="sm">
            <Trash2 size={16} />
            Limpar Histórico
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-kamui-red/20 flex items-center justify-center">
              <HistoryIcon size={20} className="text-kamui-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{stats.total}</p>
              <p className="text-xs text-kamui-white-muted">Total de Eventos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Upload size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{stats.uploads}</p>
              <p className="text-xs text-kamui-white-muted">Uploads Concluídos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{stats.errors}</p>
              <p className="text-xs text-kamui-white-muted">Erros</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileVideo size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{stats.detected}</p>
              <p className="text-xs text-kamui-white-muted">Clipes Detectados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-kamui-white-muted" />
          <input
            type="text"
            placeholder="Buscar no histórico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-kamui-gray border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50 transition-colors"
          />
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none focus:border-kamui-red/50"
        >
          <option value="all">Todos os Tipos</option>
          <option value="upload_success">Uploads</option>
          <option value="upload_error">Erros</option>
          <option value="clip_detected">Detectados</option>
          <option value="file_deleted">Deletados</option>
          <option value="system">Sistema</option>
        </select>

        {/* Date Filter */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none focus:border-kamui-red/50"
        >
          <option value="all">Todas as Datas</option>
          <option value="today">Hoje</option>
          <option value="week">Última Semana</option>
          <option value="month">Último Mês</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([date, items]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="flex items-center gap-3 mb-4">
              <Calendar size={16} className="text-kamui-white-muted" />
              <span className="text-sm font-medium text-kamui-white-muted">
                {new Date(date).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
              <div className="flex-1 h-px bg-white/10" />
              <Badge>{items.length} eventos</Badge>
            </div>

            {/* Items */}
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-white/5">
                {items.map((item, index) => {
                  const config = typeConfig[item.type]
                  const Icon = config.icon
                  
                  return (
                    <div 
                      key={item.id}
                      className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={20} className={config.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-kamui-white">{item.title}</h4>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                        <p className="text-sm text-kamui-white-muted">{item.description}</p>
                        
                        {/* Additional Info */}
                        {item.fileName && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-kamui-white-muted">
                            <span className="flex items-center gap-1">
                              <FileVideo size={12} />
                              {item.fileName}
                            </span>
                            {item.fileSize && (
                              <span>{formatBytes(item.fileSize)}</span>
                            )}
                          </div>
                        )}
                        
                        {item.error && (
                          <p className="text-xs text-red-400 mt-2 font-mono bg-red-500/10 px-2 py-1 rounded">
                            {item.error}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-kamui-white-muted">
                          {item.timestamp.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Actions */}
                      {item.youtubeUrl && (
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink size={14} />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <HistoryIcon size={48} className="mx-auto text-kamui-gray-light mb-4" />
          <h3 className="text-lg font-medium text-kamui-white mb-2">Nenhum evento encontrado</h3>
          <p className="text-kamui-white-muted">
            Ajuste os filtros ou aguarde novas ações
          </p>
        </div>
      )}
    </div>
  )
}

export default History
