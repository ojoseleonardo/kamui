import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  Folder,
  Search,
  Upload,
  FileVideo,
  HardDrive,
  RefreshCw,
  Play,
  Grid,
  List,
  Trash2,
  ListChecks,
  FolderSearch,
} from 'lucide-react'
import { Card, Button, SelectionCheckbox, ConfirmModal } from '@/components/ui'
import { formatBytes, timeAgo } from '@/lib/utils'
import KamuiLoader from '@/components/ui/KamuiLoader'
import ManualUploadModal from '@/components/upload/ManualUploadModal'
import { apiPostJson, apiUrl, openPathElectron, showItemInFolderElectron } from '@/lib/api'
import { useFolderVideos } from '@/hooks/useFolderVideos'
import { useBackendStatus } from '@/context/BackendStatusContext'

function folderBadgeLabel(videoPath) {
  try {
    if (!videoPath) return 'Raiz'
    const normalized = String(videoPath).replace(/\\/g, '/')
    const parts = normalized.split('/').filter(Boolean)
    if (parts.length < 2) return 'Raiz'
    return parts[parts.length - 2] || 'Raiz'
  } catch {
    return 'Raiz'
  }
}

function LocalVideoThumb({ videoPath }) {
  const [src, setSrc] = useState('')
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    let cancelled = false
    setShowFallback(false)
    setSrc('')
    ;(async () => {
      try {
        const u = await apiUrl(
          `/folder/video/thumbnail?path=${encodeURIComponent(videoPath)}`
        )
        if (!cancelled) setSrc(u)
      } catch {
        if (!cancelled) setShowFallback(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [videoPath])

  if (showFallback) {
    return (
      <div className="relative flex w-full aspect-video items-center justify-center overflow-hidden rounded-lg bg-kamui-gray">
        <Play size={22} className="text-kamui-white-muted" aria-hidden />
      </div>
    )
  }

  if (!src) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-kamui-gray" />
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-kamui-gray">
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setShowFallback(true)}
      />
    </div>
  )
}

function Local() {
  const navigate = useNavigate()
  const { backendReachable } = useBackendStatus()
  const { videos, error, loading, refresh } = useFolderVideos(backendReachable)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [uploadPaths, setUploadPaths] = useState(null)
  const [selectedPaths, setSelectedPaths] = useState(() => new Set())
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [trashConfirmPaths, setTrashConfirmPaths] = useState(null)
  const [trashFeedback, setTrashFeedback] = useState(null)
  const [bulkUploadFeedback, setBulkUploadFeedback] = useState(null)

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return videos.filter((v) => {
      const name = (v.name || '').toLowerCase()
      return !q || name.includes(q)
    })
  }, [videos, searchQuery])

  const filteredPaths = filtered.map((v) => v.path)
  const allFilteredSelected =
    filteredPaths.length > 0 && filteredPaths.every((p) => selectedPaths.has(p))
  const selectedCount = selectedPaths.size

  const totalSize = videos.reduce((s, v) => s + (v.size || 0), 0)

  const openTrashConfirm = (paths) => {
    if (!paths.length) return
    setTrashConfirmPaths(paths)
  }

  const runMoveToTrash = async () => {
    const paths = trashConfirmPaths
    if (!paths?.length) return
    setDeleteBusy(true)
    try {
      const res = await apiPostJson('/folder/videos/delete', { paths })
      const errs = res.errors || []
      const failed = new Set((errs || []).map((e) => e.path).filter(Boolean))
      setTrashConfirmPaths(null)
      setSelectedPaths((prev) => {
        const next = new Set(prev)
        paths.forEach((p) => {
          if (!failed.has(p)) next.delete(p)
        })
        return next
      })
      await refresh()
      if (errs.length) {
        setTrashFeedback({
          title: 'Concluído com alertas',
          body: `Apagados permanentemente: ${res.deleted ?? 0}. Falhas: ${errs.length}.`,
          lines: errs.slice(0, 8).map((e) => `${e.path}: ${e.detail}`),
        })
      }
    } catch (e) {
      setTrashConfirmPaths(null)
      setTrashFeedback({ title: 'Erro', body: e.message || String(e) })
    } finally {
      setDeleteBusy(false)
    }
  }

  const deleteOneLocal = (path) => openTrashConfirm([path])

  const openUploadModal = (paths) => {
    if (!paths?.length) return
    setUploadPaths(paths)
  }

  const handleUploadComplete = async ({ failures, attempted }) => {
    await refresh()
    if (failures?.length) {
      setBulkUploadFeedback({
        title: 'Envio para o YouTube',
        body:
          failures.length >= attempted
            ? 'Nenhum envio concluído.'
            : `Falharam ${failures.length} de ${attempted} envio(s).`,
        lines: failures.slice(0, 12).map((f) => `${f.path}: ${f.message}`),
      })
    }
    if (!failures?.length) {
      setSelectedPaths(new Set())
      setSelectionMode(false)
    }
  }

  const playLocalOnSystem = async (clip) => {
    if (!clip?.path || selectionMode) return
    const r = await openPathElectron(clip.path)
    if (!r?.ok) {
      setTrashFeedback({
        title: 'Não foi possível abrir o vídeo',
        body: r?.error || 'Falha ao abrir no player padrão do sistema.',
      })
    }
  }

  const revealClipInFolder = async (clip) => {
    if (!clip?.path) return
    const r = await showItemInFolderElectron(clip.path)
    if (!r?.ok) {
      setTrashFeedback({
        title: 'Não foi possível abrir a pasta',
        body: r?.error || 'Falha ao abrir localização do arquivo.',
      })
    }
  }

  if (!backendReachable) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-kamui-white-muted">
        Backend offline.
      </div>
    )
  }

  const trashCount = trashConfirmPaths?.length ?? 0

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={trashConfirmPaths != null}
        titleId="local-delete-confirm-title"
        title={trashCount === 1 ? 'Apagar arquivo permanentemente?' : 'Apagar arquivos permanentemente?'}
        confirmLabel={trashCount === 1 ? 'Apagar permanentemente' : `Apagar ${trashCount} arquivos`}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        busy={deleteBusy}
        onClose={() => !deleteBusy && setTrashConfirmPaths(null)}
        onConfirm={runMoveToTrash}
      >
        <p className="text-kamui-white/90">
          {trashCount === 1
            ? 'Esta ação não vai para a Lixeira. O arquivo será removido do disco e não dá para desfazer pelo sistema.'
            : `Os ${trashCount} arquivos serão removidos do disco de forma permanente (sem Lixeira). Esta ação não dá para desfazer pelo sistema.`}
        </p>
      </ConfirmModal>

      <ManualUploadModal
        open={uploadPaths != null && uploadPaths.length > 0}
        paths={uploadPaths || []}
        onClose={() => setUploadPaths(null)}
        onComplete={handleUploadComplete}
      />

      <ConfirmModal
        open={bulkUploadFeedback != null}
        titleId="local-bulk-upload-feedback-title"
        title={bulkUploadFeedback?.title ?? ''}
        confirmLabel="OK"
        cancelLabel={null}
        confirmVariant="primary"
        onClose={() => setBulkUploadFeedback(null)}
        onConfirm={() => setBulkUploadFeedback(null)}
      >
        <p className="text-kamui-white/90">{bulkUploadFeedback?.body}</p>
        {bulkUploadFeedback?.lines?.length > 0 && (
          <ul className="list-inside list-disc space-y-1 text-xs text-kamui-white-muted">
            {bulkUploadFeedback.lines.map((line, i) => (
              <li key={i} className="break-all">
                {line}
              </li>
            ))}
          </ul>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={trashFeedback != null}
        titleId="local-trash-feedback-title"
        title={trashFeedback?.title ?? ''}
        confirmLabel="OK"
        cancelLabel={null}
        confirmVariant="primary"
        onClose={() => setTrashFeedback(null)}
        onConfirm={() => setTrashFeedback(null)}
      >
        <p className="text-kamui-white/90">{trashFeedback?.body}</p>
        {trashFeedback?.lines?.length > 0 && (
          <ul className="list-inside list-disc space-y-1 text-xs text-kamui-white-muted">
            {trashFeedback.lines.map((line, i) => (
              <li key={i} className="break-all">
                {line}
              </li>
            ))}
          </ul>
        )}
      </ConfirmModal>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
            <FolderOpen size={28} className="text-kamui-red" />
            Clipes locais
          </h1>
          <p className="text-kamui-white-muted mt-1">Arquivos na pasta monitorada</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" type="button" onClick={() => refresh()}>
            <RefreshCw size={16} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => navigate('/settings', { state: { section: 'storage' } })}
          >
            Gerenciar
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-kamui-red/20 flex items-center justify-center">
              <FileVideo size={20} className="text-kamui-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{videos.length}</p>
              <p className="text-xs text-kamui-white-muted">Vídeos na pasta</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <HardDrive size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{formatBytes(totalSize)}</p>
              <p className="text-xs text-kamui-white-muted">Tamanho total</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-kamui-white-muted" />
          <input
            type="text"
            placeholder="Buscar por nome…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-kamui-gray border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50 transition-colors"
          />
        </div>
        <div className="flex items-center bg-kamui-gray rounded-lg p-1">
          <button
            type="button"
            aria-label={selectionMode ? 'Concluir seleção' : 'Selecionar'}
            aria-pressed={selectionMode}
            onClick={() => {
              setSelectionMode((m) => {
                if (m) setSelectedPaths(new Set())
                return !m
              })
            }}
            className={`p-2 rounded-md transition-colors ${
              selectionMode ? 'bg-kamui-red text-white' : 'text-kamui-white-muted hover:text-kamui-white'
            }`}
          >
            <ListChecks size={18} />
          </button>
        </div>
        <div className="flex items-center bg-kamui-gray rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-kamui-red text-white' : 'text-kamui-white-muted hover:text-kamui-white'
            }`}
          >
            <Grid size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-kamui-red text-white' : 'text-kamui-white-muted hover:text-kamui-white'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {selectionMode && !loading && filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
          <div className="flex items-center gap-2 text-kamui-white-muted">
            <SelectionCheckbox
              checked={allFilteredSelected}
              onChange={(on) => {
                if (on) {
                  setSelectedPaths((prev) => {
                    const next = new Set(prev)
                    filteredPaths.forEach((p) => next.add(p))
                    return next
                  })
                } else {
                  setSelectedPaths((prev) => {
                    const next = new Set(prev)
                    filteredPaths.forEach((p) => next.delete(p))
                    return next
                  })
                }
              }}
              aria-label="Selecionar todos nesta lista"
            />
            <span className="select-none">Todos nesta lista ({filtered.length})</span>
          </div>
          {selectedCount > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={deleteBusy}
                loading={deleteBusy}
                onClick={() => openTrashConfirm(Array.from(selectedPaths))}
              >
                <Trash2 size={14} />
                Apagar ({selectedCount})
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => openUploadModal(Array.from(selectedPaths))}
              >
                <Upload size={14} />
                Enviar selecionados ({selectedCount})
              </Button>
            </>
          )}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <KamuiLoader />
        </div>
      )}

      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((clip) => {
            const checked = selectedPaths.has(clip.path)
            return (
              <Card key={clip.path} className="overflow-hidden p-0">
                <div className="relative">
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => playLocalOnSystem(clip)}
                    aria-label={`Abrir arquivo ${clip.name}`}
                  >
                    <LocalVideoThumb videoPath={clip.path} />
                  </button>
                  {selectionMode && (
                    <div className="absolute left-2 top-2 z-20 rounded-md bg-black/65 p-1 backdrop-blur-sm">
                      <SelectionCheckbox
                        checked={checked}
                        onChange={(on) => {
                          setSelectedPaths((prev) => {
                            const next = new Set(prev)
                            if (on) next.add(clip.path)
                            else next.delete(clip.path)
                            return next
                          })
                        }}
                        stopPropagation
                        aria-label={`Selecionar ${clip.name}`}
                      />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <button
                    type="button"
                    className="mb-2 line-clamp-2 text-left font-medium text-kamui-white hover:text-kamui-red transition-colors"
                    onClick={() => playLocalOnSystem(clip)}
                    aria-label={`Abrir arquivo ${clip.name}`}
                  >
                    {clip.name}
                  </button>
                  <div className="mb-2 flex max-w-full items-center gap-1 text-[11px] text-kamui-white-muted/80">
                    <Folder size={12} className="shrink-0 opacity-70" />
                    <span className="truncate">{folderBadgeLabel(clip.path)}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-kamui-white-muted">
                      <span>{formatBytes(clip.size || 0)}</span>
                      {clip.modified && (
                        <span className="ml-2">{timeAgo(clip.modified)}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        type="button"
                        disabled={uploadPaths != null}
                        onClick={() => openUploadModal([clip.path])}
                      >
                        <Upload size={14} />
                        Enviar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => revealClipInFolder(clip)}
                        aria-label={`Ver ${clip.name} na pasta`}
                      >
                        <FolderSearch size={14} />
                        Ver na pasta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        disabled={deleteBusy}
                        onClick={() => deleteOneLocal(clip.path)}
                        aria-label="Apagar arquivo"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && viewMode === 'list' && (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-white/5">
            {filtered.map((clip) => {
              const checked = selectedPaths.has(clip.path)
              return (
                <div
                  key={clip.path}
                  className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors"
                >
                  {selectionMode ? (
                    <SelectionCheckbox
                      checked={checked}
                      onChange={(on) => {
                        setSelectedPaths((prev) => {
                          const next = new Set(prev)
                          if (on) next.add(clip.path)
                          else next.delete(clip.path)
                          return next
                        })
                      }}
                      aria-label={`Selecionar ${clip.name}`}
                    />
                  ) : (
                    <span className="w-5 shrink-0" aria-hidden />
                  )}
                  <div className="w-40 flex-shrink-0">
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => playLocalOnSystem(clip)}
                      aria-label={`Abrir arquivo ${clip.name}`}
                    >
                      <LocalVideoThumb videoPath={clip.path} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      className="font-medium text-kamui-white truncate hover:text-kamui-red transition-colors"
                      onClick={() => playLocalOnSystem(clip)}
                      aria-label={`Abrir arquivo ${clip.name}`}
                    >
                      {clip.name}
                    </button>
                    <div className="mt-1 flex max-w-full items-center gap-1 text-[11px] text-kamui-white-muted/80">
                      <Folder size={12} className="shrink-0 opacity-70" />
                      <span className="truncate">{folderBadgeLabel(clip.path)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-kamui-white-muted">
                      <span>{formatBytes(clip.size || 0)}</span>
                      {clip.modified && <span>{timeAgo(clip.modified)}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    type="button"
                    disabled={uploadPaths != null}
                    onClick={() => openUploadModal([clip.path])}
                  >
                    <Upload size={14} />
                    Enviar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => revealClipInFolder(clip)}
                    aria-label={`Ver ${clip.name} na pasta`}
                  >
                    <FolderSearch size={14} />
                    Ver na pasta
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    disabled={deleteBusy}
                    onClick={() => deleteOneLocal(clip.path)}
                    aria-label="Apagar arquivo"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-12 text-kamui-white-muted">
          <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum arquivo encontrado.</p>
        </div>
      )}
    </div>
  )
}

export default Local
