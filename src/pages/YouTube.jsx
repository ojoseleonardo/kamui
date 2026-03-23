import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Youtube,
  Search,
  Grid,
  List,
  ExternalLink,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  Settings,
  Upload,
  RefreshCw,
  Trash2,
  ListChecks,
  MoreVertical,
  Pencil,
  Globe,
  Link2,
  Lock,
} from 'lucide-react'
import { Card, Button, Badge, SelectMenuButton, SelectionCheckbox, ConfirmModal } from '@/components/ui'
import KamuiLoader from '@/components/ui/KamuiLoader'
import VideoEditModal from '@/components/youtube/VideoEditModal'
import { formatNumber, formatDuration, timeAgo } from '@/lib/utils'
import { apiPostJson, selectVideoFileElectron } from '@/lib/api'
import { useYoutubeVideos } from '@/hooks/useYoutubeVideos'

const privacyConfig = {
  public: { label: 'Público', variant: 'success' },
  unlisted: { label: 'Não listado', variant: 'warning' },
  private: { label: 'Privado', variant: 'error' },
}

const privacyFilterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'public', label: 'Públicos' },
  { value: 'unlisted', label: 'Não listados' },
  { value: 'private', label: 'Privados' },
]

const privacyLabels = { public: 'público(s)', unlisted: 'não listado(s)', private: 'privado(s)' }

function YouTube() {
  const navigate = useNavigate()
  const location = useLocation()
  const lastRouteKeyRef = useRef()
  const {
    items,
    nextPageToken,
    error,
    loading,
    initialDone,
    refresh,
    loadMore,
  } = useYoutubeVideos(true, 25)
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPrivacy, setFilterPrivacy] = useState('all')
  const [uploadBusy, setUploadBusy] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [privacyBusy, setPrivacyBusy] = useState(false)
  const [editVideo, setEditVideo] = useState(null)
  const [menuVid, setMenuVid] = useState(null)
  const [noticeModal, setNoticeModal] = useState(null)
  const [bulkPrivacyModal, setBulkPrivacyModal] = useState(null)
  const [deleteModalIds, setDeleteModalIds] = useState(null)

  useEffect(() => {
    if (!menuVid) return
    const onDoc = (e) => {
      const el = e.target.closest('[data-video-options-menu]')
      if (!el) setMenuVid(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuVid])

  useEffect(() => {
    const prev = lastRouteKeyRef.current
    lastRouteKeyRef.current = location.key
    if (prev !== undefined && prev !== location.key) {
      refresh()
    }
  }, [location.key, refresh])

  const filteredVideos = items.filter((video) => {
    const t = (video.title || '').toLowerCase()
    const matchesSearch = t.includes(searchQuery.toLowerCase())
    const matchesPrivacy = filterPrivacy === 'all' || video.privacy === filterPrivacy
    return matchesSearch && matchesPrivacy
  })

  const totalLikes = filteredVideos.reduce((s, v) => s + (v.likes || 0), 0)
  const totalComments = filteredVideos.reduce((s, v) => s + (v.comments || 0), 0)

  const manualUpload = async () => {
    if (uploadBusy) return
    setUploadBusy(true)
    let path = null
    try {
      path = await selectVideoFileElectron()
      if (!path) return
      await apiPostJson('/uploads/manual', { path })
      await refresh()
    } catch (e) {
      setNoticeModal({ title: 'Upload manual', body: e.message || String(e) })
    } finally {
      setUploadBusy(false)
    }
  }

  const filteredIds = filteredVideos.map((v) => v.youtube_id || v.id).filter(Boolean)
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id))
  const selectedCount = selectedIds.size

  const setSingleVideoPrivacy = async (id, privacy) => {
    setMenuVid(null)
    setPrivacyBusy(true)
    try {
      const res = await apiPostJson('/youtube/videos/privacy', { ids: [id], privacy })
      if (res.errors?.length) {
        setNoticeModal({
          title: 'Privacidade',
          body: `Falha ao atualizar ${res.errors.length} vídeo(s).`,
          lines: res.errors.map((x) => `${x.id}: ${x.detail}`),
        })
      }
      await refresh()
    } catch (e) {
      setNoticeModal({ title: 'Privacidade', body: e.message || String(e) })
    } finally {
      setPrivacyBusy(false)
    }
  }

  const openBulkPrivacyModal = (privacy) => {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    setBulkPrivacyModal({ privacy, ids })
  }

  const runBulkPrivacy = async () => {
    if (!bulkPrivacyModal) return
    const { privacy, ids } = bulkPrivacyModal
    setBulkPrivacyModal(null)
    setPrivacyBusy(true)
    try {
      const res = await apiPostJson('/youtube/videos/privacy', { ids, privacy })
      if (res.errors?.length) {
        setNoticeModal({
          title: 'Privacidade em massa',
          body: `Atualizados: ${res.updated ?? 0}. Falhas: ${res.errors.length}.`,
          lines: res.errors.slice(0, 8).map((x) => `${x.id}: ${x.detail}`),
        })
      }
      await refresh()
    } catch (e) {
      setNoticeModal({ title: 'Privacidade em massa', body: e.message || String(e) })
    } finally {
      setPrivacyBusy(false)
    }
  }

  const requestDeleteYoutubeVideos = (ids) => {
    if (!ids.length) return
    setDeleteModalIds(ids)
  }

  const runDeleteYoutubeVideos = async () => {
    const ids = deleteModalIds
    if (!ids?.length) return
    setDeleteModalIds(null)
    setDeleteBusy(true)
    try {
      const res = await apiPostJson('/youtube/videos/delete', { ids })
      const errs = res.errors || []
      if (errs.length) {
        setNoticeModal({
          title: 'Excluir do YouTube',
          body: `Eliminados: ${res.deleted ?? 0}. Falhas: ${errs.length}.`,
          lines: errs.slice(0, 8).map((e) => `${e.id}: ${e.detail}`),
        })
      }
      setSelectedIds((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      })
      await refresh()
    } catch (e) {
      setNoticeModal({ title: 'Excluir do YouTube', body: e.message || String(e) })
    } finally {
      setDeleteBusy(false)
    }
  }

  const deleteOneYoutube = (youtubeId) => {
    setMenuVid(null)
    requestDeleteYoutubeVideos([youtubeId])
  }

  const optionsMenu = (video, vid) => (
    <div className="relative" data-video-options-menu>
      <Button
        size="sm"
        variant="outline"
        type="button"
        className="px-2"
        aria-label="Opções do vídeo"
        disabled={privacyBusy || deleteBusy}
        onClick={() => setMenuVid((m) => (m === vid ? null : vid))}
      >
        <MoreVertical size={16} />
      </Button>
      {menuVid === vid && (
        <div
          className="glass-card-static absolute right-0 top-full z-50 mt-1.5 min-w-[12.5rem] overflow-hidden rounded-xl p-1 shadow-2xl shadow-black/40"
          data-video-options-menu
        >
          <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-kamui-white-muted/80">
            Vídeo
          </p>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-kamui-white/95 transition-colors hover:bg-white/[0.06]"
            onClick={() => {
              setEditVideo(video)
              setMenuVid(null)
            }}
          >
            <Pencil size={14} className="shrink-0 opacity-60" strokeWidth={2} />
            Editar detalhes
          </button>
          <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-kamui-white-muted/80">
            Privacidade
          </p>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-kamui-white/95 transition-colors hover:bg-white/[0.06]"
            onClick={() => setSingleVideoPrivacy(vid, 'public')}
          >
            <Globe size={14} className="shrink-0 opacity-60" strokeWidth={2} />
            Público
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-kamui-white/95 transition-colors hover:bg-white/[0.06]"
            onClick={() => setSingleVideoPrivacy(vid, 'unlisted')}
          >
            <Link2 size={14} className="shrink-0 opacity-60" strokeWidth={2} />
            Não listado
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-kamui-white/95 transition-colors hover:bg-white/[0.06]"
            onClick={() => setSingleVideoPrivacy(vid, 'private')}
          >
            <Lock size={14} className="shrink-0 opacity-60" strokeWidth={2} />
            Privado
          </button>
          <div className="my-1 border-t border-white/[0.06]" />
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-red-400/95 transition-colors hover:bg-red-500/10"
            onClick={() => deleteOneYoutube(vid)}
          >
            <Trash2 size={14} className="shrink-0 opacity-80" strokeWidth={2} />
            Excluir do YouTube
          </button>
        </div>
      )}
    </div>
  )

  if (!initialDone && loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <KamuiLoader />
      </div>
    )
  }

  const deleteCount = deleteModalIds?.length ?? 0
  const bulkPrivacyLabel =
    bulkPrivacyModal && (privacyLabels[bulkPrivacyModal.privacy] || bulkPrivacyModal.privacy)

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={noticeModal != null}
        titleId="youtube-notice-title"
        title={noticeModal?.title ?? ''}
        confirmLabel="OK"
        cancelLabel={null}
        confirmVariant="primary"
        onClose={() => setNoticeModal(null)}
        onConfirm={() => setNoticeModal(null)}
      >
        <p className="text-kamui-white/90">{noticeModal?.body}</p>
        {noticeModal?.lines?.length > 0 && (
          <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-kamui-white-muted">
            {noticeModal.lines.map((line, i) => (
              <li key={i} className="break-all">
                {line}
              </li>
            ))}
          </ul>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={bulkPrivacyModal != null}
        titleId="youtube-bulk-privacy-title"
        title="Alterar privacidade em massa?"
        confirmLabel="Aplicar"
        cancelLabel="Cancelar"
        confirmVariant="primary"
        busy={privacyBusy}
        onClose={() => !privacyBusy && setBulkPrivacyModal(null)}
        onConfirm={runBulkPrivacy}
      >
        <p className="text-kamui-white/90">
          {bulkPrivacyModal
            ? `Definir ${bulkPrivacyModal.ids.length} vídeo(s) como ${bulkPrivacyLabel}.`
            : null}
        </p>
      </ConfirmModal>

      <ConfirmModal
        open={deleteModalIds != null}
        titleId="youtube-delete-title"
        title={deleteCount === 1 ? 'Excluir vídeo do YouTube?' : 'Excluir vídeos do YouTube?'}
        confirmLabel={deleteCount === 1 ? 'Excluir permanentemente' : `Excluir ${deleteCount} vídeos`}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        busy={deleteBusy}
        onClose={() => !deleteBusy && setDeleteModalIds(null)}
        onConfirm={runDeleteYoutubeVideos}
      >
        <p className="text-kamui-white/90">
          Esta ação remove o vídeo do canal no YouTube e não pode ser desfeita pelo Kamui.
        </p>
      </ConfirmModal>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
            <Youtube size={28} className="text-red-500" />
            YouTube
          </h1>
          <p className="text-kamui-white-muted mt-1">Vídeos do seu canal</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => refresh()}
            disabled={loading}
            loading={loading}
            title="Recarregar vídeos do YouTube"
          >
            <RefreshCw size={16} />
            Atualizar lista
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={() => navigate('/settings')}>
            <Settings size={16} />
            Configurações
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={manualUpload}
            disabled={uploadBusy}
            loading={uploadBusy}
          >
            <Upload size={16} />
            Upload manual
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Youtube size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{formatNumber(items.length)}</p>
              <p className="text-xs text-kamui-white-muted">Carregados (esta lista)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <ThumbsUp size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{formatNumber(totalLikes)}</p>
              <p className="text-xs text-kamui-white-muted">Likes (lista filtrada)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <MessageSquare size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kamui-white">{formatNumber(totalComments)}</p>
              <p className="text-xs text-kamui-white-muted">Comentários (lista filtrada)</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-kamui-white-muted" />
          <input
            type="text"
            placeholder="Buscar por título…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-kamui-gray border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50 transition-colors"
          />
        </div>
        <SelectMenuButton
          idPrefix="youtube-privacy-filter"
          options={privacyFilterOptions}
          value={filterPrivacy}
          onChange={setFilterPrivacy}
        />
        <div className="flex items-center bg-kamui-gray rounded-lg p-1">
          <button
            type="button"
            aria-label={selectionMode ? 'Concluir seleção' : 'Selecionar'}
            aria-pressed={selectionMode}
            onClick={() => {
              setSelectionMode((m) => {
                if (m) setSelectedIds(new Set())
                return !m
              })
              setMenuVid(null)
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

      {selectionMode && filteredVideos.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
          <div className="flex items-center gap-2 text-kamui-white-muted">
            <SelectionCheckbox
              checked={allFilteredSelected}
              onChange={(on) => {
                if (on) {
                  setSelectedIds((prev) => {
                    const next = new Set(prev)
                    filteredIds.forEach((id) => next.add(id))
                    return next
                  })
                } else {
                  setSelectedIds((prev) => {
                    const next = new Set(prev)
                    filteredIds.forEach((id) => next.delete(id))
                    return next
                  })
                }
              }}
              aria-label="Selecionar todos na lista filtrada"
            />
            <span className="select-none">Todos nesta lista ({filteredVideos.length})</span>
          </div>
          {selectedCount > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={deleteBusy}
                loading={deleteBusy}
                onClick={() => requestDeleteYoutubeVideos(Array.from(selectedIds))}
              >
                <Trash2 size={14} />
                Excluir ({selectedCount})
              </Button>
              <span className="text-xs text-kamui-white-muted">Privacidade em massa:</span>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={privacyBusy}
                loading={privacyBusy}
                onClick={() => openBulkPrivacyModal('public')}
              >
                Público
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={privacyBusy}
                onClick={() => openBulkPrivacyModal('unlisted')}
              >
                Não listado
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={privacyBusy}
                onClick={() => openBulkPrivacyModal('private')}
              >
                Privado
              </Button>
            </>
          )}
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => {
            const pv = privacyConfig[video.privacy] || privacyConfig.public
            const vid = video.youtube_id || video.id
            const href = `https://www.youtube.com/watch?v=${vid}`
            const checked = selectedIds.has(vid)
            return (
              <Card
                key={vid}
                className={`overflow-visible p-0 ${menuVid === vid ? 'relative z-50' : ''}`}
              >
                <div className="relative group overflow-hidden rounded-t-xl">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-kamui-gray" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a href={href} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="primary" type="button">
                        <ExternalLink size={14} />
                        Abrir
                      </Button>
                    </a>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                    {formatDuration(video.duration_seconds || 0)}
                  </div>
                  {selectionMode && (
                    <div className="absolute left-2 top-2 z-20 rounded-md bg-black/65 p-1 backdrop-blur-sm">
                      <SelectionCheckbox
                        checked={checked}
                        onChange={(on) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev)
                            if (on) next.add(vid)
                            else next.delete(vid)
                            return next
                          })
                        }}
                        stopPropagation
                        aria-label={`Selecionar ${video.title || 'vídeo'}`}
                      />
                    </div>
                  )}
                  <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                    <Badge variant={pv.variant}>{pv.label}</Badge>
                  </div>
                </div>
                <div className="p-3.5">
                  <h3 className="mb-1.5 line-clamp-2 text-sm font-medium leading-snug text-kamui-white">
                    {video.title}
                  </h3>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-4 text-xs text-kamui-white-muted">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {formatNumber(video.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={12} />
                        {formatNumber(video.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {video.published_at ? timeAgo(video.published_at) : '—'}
                      </span>
                    </div>
                    {optionsMenu(video, vid)}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-0 overflow-visible">
          <div className="divide-y divide-white/5">
            {filteredVideos.map((video) => {
              const pv = privacyConfig[video.privacy] || privacyConfig.public
              const vid = video.youtube_id || video.id
              const href = `https://www.youtube.com/watch?v=${vid}`
              const checked = selectedIds.has(vid)
              return (
                <div
                  key={vid}
                  className={`flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group ${
                    menuVid === vid ? 'relative z-50' : ''
                  }`}
                >
                  {selectionMode ? (
                    <SelectionCheckbox
                      checked={checked}
                      onChange={(on) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev)
                          if (on) next.add(vid)
                          else next.delete(vid)
                          return next
                        })
                      }}
                      aria-label={`Selecionar ${video.title || 'vídeo'}`}
                    />
                  ) : (
                    <span className="w-5 shrink-0" aria-hidden />
                  )}
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-kamui-gray">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white">
                      {formatDuration(video.duration_seconds || 0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-medium text-kamui-white">{video.title}</h3>
                    <p className="mt-0.5 truncate text-xs text-kamui-white-muted">
                      {(video.description || '').slice(0, 120)}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-kamui-white-muted">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {formatNumber(video.views)} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={12} />
                        {formatNumber(video.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        {formatNumber(video.comments)}
                      </span>
                    </div>
                  </div>
                  <Badge variant={pv.variant}>{pv.label}</Badge>
                  <span className="whitespace-nowrap text-xs text-kamui-white-muted">
                    {video.published_at ? timeAgo(video.published_at) : '—'}
                  </span>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="opacity-0 group-hover:opacity-100 p-2"
                    aria-label="Abrir"
                  >
                    <ExternalLink size={16} className="text-kamui-white-muted" />
                  </a>
                  {optionsMenu(video, vid)}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {nextPageToken && (
        <div className="flex justify-center">
          <Button variant="outline" type="button" onClick={loadMore} disabled={loading} loading={loading}>
            Carregar mais
          </Button>
        </div>
      )}

      {initialDone && filteredVideos.length === 0 && !error && (
        <p className="text-center text-kamui-white-muted py-8">Nenhum vídeo encontrado.</p>
      )}

      <VideoEditModal
        open={!!editVideo}
        video={editVideo}
        onClose={() => setEditVideo(null)}
        onSaved={refresh}
      />
    </div>
  )
}

export default YouTube
