import React, { useMemo, useState } from 'react'
import {
  History as HistoryIcon,
  Search,
  Calendar,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileVideo,
  ExternalLink,
  Download,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { formatBytes, formatDateTime } from '@/lib/utils'
import { apiDelete } from '@/lib/api'
import { useEvents, useEventsStats } from '@/hooks/useEvents'

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
  const { events, loading, error, refresh } = useEvents({ limit: 500 })
  const { stats, refresh: refreshStats } = useEventsStats(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [clearBusy, setClearBusy] = useState(false)

  const filteredItems = useMemo(() => {
    return events.filter((item) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        (item.title || '').toLowerCase().includes(q) ||
        (item.detail || '').toLowerCase().includes(q)
      const matchesType = filterType === 'all' || item.type === filterType
      const ts = new Date(item.created_at)
      let matchesDate = true
      const now = new Date()
      if (dateRange === 'today') {
        matchesDate = ts.toDateString() === now.toDateString()
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
        matchesDate = ts >= weekAgo
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
        matchesDate = ts >= monthAgo
      }
      return matchesSearch && matchesType && matchesDate
    })
  }, [events, searchQuery, filterType, dateRange])

  const byType = stats?.by_type || {}
  const statsRow = {
    total: stats?.total ?? 0,
    uploads: byType.upload_success ?? 0,
    errors: byType.upload_error ?? 0,
    detected: byType.clip_detected ?? 0,
  }

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((groups, item) => {
      const date = new Date(item.created_at).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(item)
      return groups
    }, {})
  }, [filteredItems])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filteredItems, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kamui-historico-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const clearAll = async () => {
    if (!window.confirm('Apagar todo o histórico de eventos?')) return
    setClearBusy(true)
    try {
      await apiDelete('/events')
      await refresh()
      await refreshStats()
    } catch (e) {
      window.alert(e.message || String(e))
    } finally {
      setClearBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
            <HistoryIcon size={28} className="text-kamui-red" />
            Histórico
          </h1>
          <p className="text-kamui-white-muted mt-1">Eventos registados pelo Kamui</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" type="button" onClick={exportJson}>
            <Download size={16} />
            Exportar
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="button"
            onClick={clearAll}
            disabled={clearBusy}
            loading={clearBusy}
          >
            <Trash2 size={16} />
            Limpar
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-kamui-red/20 flex items-center justify-center">
              <HistoryIcon size={20} className="text-kamui-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{statsRow.total}</p>
              <p className="text-xs text-kamui-white-muted">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Upload size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{statsRow.uploads}</p>
              <p className="text-xs text-kamui-white-muted">Uploads</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{statsRow.errors}</p>
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
              <p className="text-2xl font-bold text-kamui-white">{statsRow.detected}</p>
              <p className="text-xs text-kamui-white-muted">Detectados</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-kamui-white-muted" />
          <input
            type="text"
            placeholder="Buscar…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-kamui-gray border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50 transition-colors"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none focus:border-kamui-red/50"
        >
          <option value="all">Todos os tipos</option>
          <option value="upload_success">Uploads</option>
          <option value="upload_error">Erros</option>
          <option value="clip_detected">Detectados</option>
          <option value="file_deleted">Deletados</option>
          <option value="system">Sistema</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none focus:border-kamui-red/50"
        >
          <option value="all">Todas as datas</option>
          <option value="today">Hoje</option>
          <option value="week">Última semana</option>
          <option value="month">Último mês</option>
        </select>
      </div>

      {loading && <p className="text-sm text-kamui-white-muted">A carregar…</p>}

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([date, items]) => (
          <div key={date}>
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
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-white/5">
                {items.map((item) => {
                  const cfg = typeConfig[item.type] || typeConfig.system
                  const Icon = cfg.icon
                  const youtubeUrl = item.youtube_id
                    ? `https://www.youtube.com/watch?v=${item.youtube_id}`
                    : null
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg ${cfg.bgColor} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon size={20} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-kamui-white">{item.title}</h4>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <p className="text-sm text-kamui-white-muted">{item.detail}</p>
                        {item.file_path && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-kamui-white-muted">
                            <span className="flex items-center gap-1">
                              <FileVideo size={12} />
                              <span className="truncate">{item.file_path}</span>
                            </span>
                            {item.file_size != null && (
                              <span>{formatBytes(item.file_size)}</span>
                            )}
                          </div>
                        )}
                        {item.error && (
                          <p className="text-xs text-red-400 mt-2 font-mono bg-red-500/10 px-2 py-1 rounded">
                            {item.error}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-kamui-white-muted">
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>
                      {youtubeUrl && (
                        <a
                          href={youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="opacity-0 group-hover:opacity-100 p-2"
                        >
                          <ExternalLink size={14} className="text-kamui-white-muted" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        ))}
      </div>

      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <HistoryIcon size={48} className="mx-auto text-kamui-gray-light mb-4" />
          <h3 className="text-lg font-medium text-kamui-white mb-2">Nenhum evento</h3>
          <p className="text-kamui-white-muted">Ajuste os filtros ou aguarde nova atividade</p>
        </div>
      )}
    </div>
  )
}

export default History
