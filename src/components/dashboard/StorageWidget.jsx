import React from 'react'
import { HardDrive, FolderOpen } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { formatBytes } from '@/lib/utils'
import { useFolderSummary } from '@/hooks/useFolderSummary'

function StorageWidget() {
  const { data, error, loading } = useFolderSummary()

  if (loading) {
    return (
      <Card className="flex h-full w-full flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <HardDrive size={18} className="text-kamui-red" />
            Armazenamento
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-kamui-white-muted py-8">A carregar…</CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="flex h-full w-full flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <HardDrive size={18} className="text-kamui-red" />
            Armazenamento
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-400 py-4">
          {error || 'Sem dados da pasta monitorada.'}
        </CardContent>
      </Card>
    )
  }

  const total = data.disk_total_bytes || 1
  const used = data.disk_used_bytes || 0
  const free = data.disk_free_bytes || 0
  const usedPct = Math.min(100, Math.round((used / total) * 100))
  const clipsBytes = data.total_size_bytes || 0
  const clipsPct = total ? Math.min(100, (clipsBytes / total) * 100) : 0
  const otherUsed = Math.max(0, used - clipsBytes)
  const otherPct = total ? Math.min(100, Math.max(0, (otherUsed / total) * 100)) : 0

  return (
    <Card className="flex h-full w-full flex-col">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <HardDrive size={18} className="text-kamui-red" />
          Armazenamento
        </CardTitle>
        <p className="text-xs text-kamui-white-muted truncate mt-1" title={data.folder_path}>
          {data.folder_path}
        </p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-4">
        <div className="flex items-center justify-center py-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-kamui-gray"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#storageGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${usedPct * 3.52} 352`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="storageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b0000" />
                  <stop offset="100%" stopColor="#c41e3a" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-kamui-white">{usedPct}%</span>
              <span className="text-xs text-kamui-white-muted">Disco usado</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="h-3 bg-kamui-gray rounded-full overflow-hidden flex">
            <div
              className="bg-kamui-red transition-all duration-500"
              style={{ width: `${clipsPct}%` }}
              title="Clipes na pasta"
            />
            <div
              className="bg-kamui-gray-light transition-all duration-500"
              style={{ width: `${otherPct}%` }}
              title="Resto do disco usado"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 mt-3">
            <div className="flex justify-between">
              <span className="text-kamui-white-muted">Vídeos na pasta</span>
              <span className="text-kamui-white">{data.total_videos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kamui-white-muted">Tamanho dos clipes</span>
              <span className="text-kamui-white">{formatBytes(clipsBytes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kamui-white-muted">Livre no volume</span>
              <span className="text-kamui-white">{formatBytes(free)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kamui-white-muted">Total / usado</span>
              <span className="text-kamui-white">
                {formatBytes(total)} / {formatBytes(used)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" type="button" disabled title={data.folder_path}>
            <FolderOpen size={14} />
            Pasta
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default StorageWidget
