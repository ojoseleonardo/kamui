import React from 'react'
import { Folder, HardDrive, FolderOpen } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { cn, formatBytes } from '@/lib/utils'
import { useFolderSummary } from '@/hooks/useFolderSummary'

function pctOf(totalBytes, partBytes) {
  if (!totalBytes) return 0
  return Math.min(100, Math.max(0, (partBytes / totalBytes) * 100))
}

function segmentStyle(pct, hasBytes) {
  const w = Math.min(100, Math.max(0, pct))
  return {
    width: `${w}%`,
    minWidth: hasBytes && w > 0 && w < 0.8 ? '6px' : undefined,
  }
}

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
  const otherUsed = Math.max(0, used - clipsBytes)

  const clipsPct = pctOf(total, clipsBytes)
  const otherPct = pctOf(total, otherUsed)
  const freePctLabel = pctOf(total, free)
  const freeBarPct = Math.max(0, 100 - clipsPct - otherPct)

  const legend = [
    {
      key: 'clips',
      dotClass: 'bg-kamui-red',
      label: 'Clipes nesta pasta',
      detail: formatBytes(clipsBytes),
      pct: clipsPct,
      bytes: clipsBytes,
    },
    {
      key: 'other',
      dotClass: 'bg-amber-500',
      label: 'Outro no disco (fora desta pasta)',
      detail: formatBytes(otherUsed),
      pct: otherPct,
      bytes: otherUsed,
    },
    {
      key: 'free',
      dotClass: 'bg-emerald-600',
      label: 'Livre no volume',
      detail: formatBytes(free),
      pct: freePctLabel,
      bytes: free,
    },
  ]

  return (
    <Card className="flex h-full w-full flex-col">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <HardDrive size={18} className="text-kamui-red" />
          Armazenamento
        </CardTitle>
        <div className="mt-2 space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-kamui-white-muted/70">
            Pasta monitorada
          </p>
          <div
            className="flex min-w-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-kamui-black/50 px-2.5 py-2 shadow-inner shadow-black/20"
            title={data.folder_path}
          >
            <Folder size={15} className="shrink-0 text-kamui-red/85" aria-hidden />
            <span
              className="min-w-0 truncate font-mono text-[11px] leading-snug text-kamui-white/90 tracking-tight select-all"
              dir="ltr"
            >
              {data.folder_path}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 text-xs">
        <p className="text-sm leading-snug text-kamui-white-muted">
          <span className="font-semibold text-kamui-white">{usedPct}%</span> do volume em uso
          <span className="mx-1.5 text-kamui-gray-light">·</span>
          <span className="text-emerald-400/90">{formatBytes(free)}</span> livres
        </p>

        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-kamui-white-muted">
            Disco (100% = capacidade total)
          </p>
          <div
            className="flex h-4 w-full overflow-hidden rounded-full bg-kamui-black ring-1 ring-white/10"
            role="img"
            aria-label={`Disco: ${clipsPct.toFixed(1)}% clipes, ${otherPct.toFixed(1)}% outro uso, ${freePctLabel.toFixed(1)}% livre`}
          >
            <div
              className="bg-kamui-red transition-all duration-500"
              style={segmentStyle(clipsPct, clipsBytes > 0)}
              title={`Clipes: ${formatBytes(clipsBytes)} (${clipsPct.toFixed(1)}%)`}
            />
            <div
              className="bg-amber-500 transition-all duration-500"
              style={segmentStyle(otherPct, otherUsed > 0)}
              title={`Outro no disco: ${formatBytes(otherUsed)} (${otherPct.toFixed(1)}%)`}
            />
            <div
              className="bg-emerald-600 transition-all duration-500"
              style={segmentStyle(freeBarPct, free > 0)}
              title={`Livre: ${formatBytes(free)} (${freeBarPct.toFixed(1)}%)`}
            />
          </div>

          <ul className="mt-3 space-y-2">
            {legend.map((row) => (
              <li key={row.key} className="flex items-start gap-2.5">
                <span
                  className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-sm', row.dotClass)}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span className="text-kamui-white-muted">{row.label}</span>
                    <span className="font-mono text-[11px] text-kamui-white tabular-nums">
                      {row.detail}
                    </span>
                  </div>
                  <span className="text-[11px] text-kamui-white-muted/80">
                    {row.pct < 0.05 && row.bytes > 0
                      ? 'Menos de 0,1% do volume'
                      : `${row.pct.toFixed(1)}% do volume`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-white/5 pt-3 space-y-2">
          <div className="flex justify-between gap-2">
            <span className="text-kamui-white-muted">Vídeos na pasta</span>
            <span className="text-kamui-white tabular-nums">{data.total_videos}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-kamui-white-muted">Capacidade total</span>
            <span className="text-kamui-white tabular-nums">{formatBytes(total)}</span>
          </div>
        </div>

        <div className="mt-auto flex gap-2 pt-1">
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
