import React, { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button, ConfirmModal } from '@/components/ui'
import { apiGet, apiPostJson } from '@/lib/api'

const fieldClass =
  'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm leading-normal text-kamui-white placeholder:text-kamui-white-muted/70 focus:border-kamui-red/40 focus:outline-none focus:ring-1 focus:ring-kamui-red/30'

const labelClass = 'mb-1 block text-xs font-medium text-kamui-white-muted'

/**
 * @param {{ open: boolean, video: object | null, onClose: () => void, onSaved: () => Promise<void> | void }} props
 */
export default function VideoEditModal({ open, video, onClose, onSaved }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsStr, setTagsStr] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)

  const videoKey = video ? video.youtube_id || video.id : null

  useEffect(() => {
    if (!open || !videoKey || !video) return undefined

    let cancelled = false
    const base = video

    const applyItem = (item) => {
      setTitle(item.title || '')
      setDescription(item.description || '')
      const tags = Array.isArray(item.tags) ? item.tags : []
      setTagsStr(tags.join(', '))
    }

    const run = async () => {
      setDetailLoading(true)
      setDetailError(null)
      applyItem(base)
      try {
        const d = await apiGet('/youtube/video', { id: videoKey })
        if (cancelled) return
        if (d.item) applyItem(d.item)
      } catch (e) {
        if (!cancelled) {
          setDetailError(e.message || String(e))
          applyItem(base)
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
    // Só re-sincroniza ao abrir ou ao mudar de vídeo — não quando a lista refresca o mesmo ID.
  }, [open, videoKey])

  if (!open || !video) return null

  const vid = video.youtube_id || video.id

  const handleSave = async () => {
    setSaving(true)
    try {
      const tags = tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      await apiPostJson('/youtube/videos/update', {
        id: vid,
        title: title.trim(),
        description,
        tags,
      })
      await onSaved?.()
      onClose()
    } catch (e) {
      setSaveError(e.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ConfirmModal
        open={saveError != null}
        titleId="video-edit-error-title"
        title="Não foi possível salvar"
        confirmLabel="OK"
        cancelLabel={null}
        confirmVariant="primary"
        overlayClassName="z-[110]"
        onClose={() => setSaveError(null)}
        onConfirm={() => setSaveError(null)}
      >
        <p className="text-kamui-white/90">{saveError}</p>
      </ConfirmModal>
      <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-edit-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="glass-card-static relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
        {detailLoading && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/40 backdrop-blur-[1px]"
            aria-busy="true"
            aria-live="polite"
          >
            <Loader2 className="h-8 w-8 animate-spin text-kamui-red" strokeWidth={2} />
            <p className="text-xs text-kamui-white/90">A sincronizar com o YouTube…</p>
          </div>
        )}
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 id="video-edit-title" className="text-sm font-semibold tracking-tight text-kamui-white">
              Editar vídeo
            </h2>
            <p className="mt-0.5 truncate text-xs text-kamui-white-muted" title={title || video.title || ''}>
              {title || video.title || 'Sem título'}
            </p>
            {detailError && !detailLoading && (
              <p className="mt-1 text-[11px] text-amber-400/95">
                Não foi possível carregar a versão mais recente; a mostrar dados da lista. {detailError}
              </p>
            )}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1.5 text-kamui-white-muted transition-colors hover:bg-white/[0.06] hover:text-kamui-white"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="max-h-[min(60vh,28rem)] space-y-3 overflow-y-auto px-4 py-3">
          <div>
            <label htmlFor="video-edit-title-input" className={labelClass}>
              Título
            </label>
            <input
              id="video-edit-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={detailLoading}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="video-edit-desc" className={labelClass}>
              Descrição
            </label>
            <textarea
              id="video-edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={detailLoading}
              className={`${fieldClass} resize-y`}
            />
          </div>
          <div>
            <label htmlFor="video-edit-tags" className={labelClass}>
              Tags (vírgula)
            </label>
            <input
              id="video-edit-tags"
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="gaming, highlight, kamui"
              disabled={detailLoading}
              className={fieldClass}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={handleSave}
            loading={saving}
            disabled={saving || detailLoading}
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
    </>
  )
}
