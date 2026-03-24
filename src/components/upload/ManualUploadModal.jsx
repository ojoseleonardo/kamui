import React, { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import SelectMenuButton from '@/components/ui/SelectMenuButton'
import { cn } from '@/lib/utils'
import { apiGet, apiPostFormData } from '@/lib/api'

const DEFAULT_DESCRIPTION = 'Vídeo enviado com Kamui.'
const DEFAULT_TAGS = 'kamui, clip'

function basenameStem(absPath) {
  const base = (absPath || '').split(/[/\\]/).pop() || ''
  return base.replace(/\.[^.]+$/, '')
}

function buildFormData(path, fields, thumbFile) {
  const fd = new FormData()
  fd.append('path', path)
  if (fields.title?.trim()) fd.append('title', fields.title.trim())
  if (fields.description != null && String(fields.description).trim() !== '') {
    fd.append('description', String(fields.description).trim())
  }
  if (fields.tags?.trim()) fd.append('tags', fields.tags.trim())
  if (fields.privacy) fd.append('privacy', fields.privacy)
  fd.append('thumbnail_mode', fields.thumbnailMode)
  const ms = Math.round((Number(fields.frameSeconds) || 0) * 1000)
  fd.append('thumbnail_seek_ms', String(Math.max(0, ms)))
  if (fields.thumbnailMode === 'url' && fields.thumbnailUrl?.trim()) {
    fd.append('thumbnail_url', fields.thumbnailUrl.trim())
  }
  if (fields.thumbnailMode === 'file' && thumbFile) {
    fd.append('thumbnail', thumbFile, thumbFile.name || 'thumbnail.jpg')
  }
  return fd
}

function ThumbnailRadioOption({ id, label, checked, onSelect, name }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-xs text-kamui-white/90 transition-colors',
        checked
          ? 'border-kamui-red/45 bg-kamui-red/10'
          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]',
      )}
    >
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          type="radio"
          name={name}
          value={id}
          checked={checked}
          onChange={() => onSelect(id)}
          className="sr-only"
        />
        <span
          className={cn(
            'flex h-4 w-4 rounded-full border-2 transition-colors',
            checked ? 'border-kamui-red bg-kamui-red/25' : 'border-white/30 bg-transparent',
          )}
          aria-hidden
        />
        <span
          className={cn(
            'pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-kamui-red-light transition-opacity',
            checked ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden
        />
      </span>
      <span className="leading-snug">{label}</span>
    </label>
  )
}

/**
 * @param {{
 *   open: boolean,
 *   paths: string[],
 *   onClose: () => void,
 *   onComplete: (result: { failures: { path: string, message: string }[], attempted: number }) => void,
 * }} props
 */
export default function ManualUploadModal({ open, paths, onClose, onComplete }) {
  const fileInputRef = useRef(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [privacy, setPrivacy] = useState('unlisted')
  const [thumbnailMode, setThumbnailMode] = useState('frame')
  const [frameSeconds, setFrameSeconds] = useState(0.8)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbFile, setThumbFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const resetForPaths = useCallback(() => {
    const list = paths || []
    if (list.length === 1) {
      const stem = basenameStem(list[0])
      setTitle(stem.replace(/[_-]+/g, ' ').trim() || stem)
    } else {
      setTitle('')
    }
    setThumbnailMode('frame')
    setFrameSeconds(0.8)
    setThumbnailUrl('')
    setThumbFile(null)
    setPrivacy('unlisted')
    setDescription(DEFAULT_DESCRIPTION)
    setTags(DEFAULT_TAGS)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError(null)
  }, [paths])

  useEffect(() => {
    if (!open) return
    resetForPaths()
    let alive = true
    ;(async () => {
      try {
        const prefs = await apiGet('/settings/preferences')
        if (!alive) return
        const prefDesc =
          typeof prefs.default_description === 'string'
            ? prefs.default_description.trim()
            : ''
        const prefTags =
          typeof prefs.default_tags === 'string'
            ? prefs.default_tags.trim()
            : ''
        setDescription(prefDesc || DEFAULT_DESCRIPTION)
        setTags(prefTags || DEFAULT_TAGS)
      } catch (_) {
        /* mantém unlisted + frame já definidos em resetForPaths */
      }
    })()
    return () => {
      alive = false
    }
  }, [open, resetForPaths])

  const handleSubmit = async () => {
    const list = paths || []
    if (!list.length) return
    if (thumbnailMode === 'file' && !thumbFile) {
      setError('Escolha uma imagem JPEG ou PNG.')
      return
    }
    if (thumbnailMode === 'url' && !thumbnailUrl.trim()) {
      setError('Indique uma URL HTTPS da imagem.')
      return
    }
    setError(null)
    setBusy(true)
    const fields = {
      title,
      description,
      tags,
      privacy,
      thumbnailMode,
      frameSeconds,
      thumbnailUrl,
    }
    const failures = []
    try {
      for (const p of list) {
        try {
          const fd = buildFormData(p, fields, thumbFile)
          await apiPostFormData('/uploads/manual', fd)
        } catch (e) {
          failures.push({ path: p, message: e.message || String(e) })
        }
      }
      onComplete({ failures, attempted: list.length })
      if (failures.length === 0) onClose()
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  if (!open) return null

  const n = paths?.length ?? 0
  const multi = n > 1

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-upload-title"
      onMouseDown={(e) => {
        if (!busy && e.target === e.currentTarget) onClose()
      }}
    >
      <div className="glass-card-static max-h-[92vh] w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <h2
            id="manual-upload-title"
            className="min-w-0 flex-1 text-sm font-semibold tracking-tight text-kamui-white"
          >
            {multi ? `Enviar ${n} vídeos para o YouTube` : 'Enviar para o YouTube'}
          </h2>
          <button
            type="button"
            disabled={busy}
            className="shrink-0 rounded-lg p-1.5 text-kamui-white-muted transition-colors hover:bg-white/[0.06] hover:text-kamui-white disabled:opacity-40"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto px-4 py-4 text-sm text-kamui-white-muted">
          {multi && (
            <p className="text-xs text-kamui-white-muted">
              Os mesmos metadados e miniatura serão aplicados a todos os arquivos. Deixe o título
              vazio para usar o nome de cada arquivo.
            </p>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="manual-upload-title" className="text-xs font-medium text-kamui-white">
              Título
            </label>
            <input
              id="manual-upload-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={multi ? 'Vazio = nome de cada arquivo' : 'Gerado a partir do nome se vazio'}
              className="h-10 w-full rounded-lg border border-white/10 bg-kamui-gray px-3 text-sm leading-normal text-kamui-white placeholder:text-kamui-white-muted/50 focus:border-kamui-red/50 focus:outline-none focus:ring-1 focus:ring-kamui-red/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="manual-upload-desc" className="text-xs font-medium text-kamui-white">
              Descrição
            </label>
            <textarea
              id="manual-upload-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Vem das Configurações; você pode editar antes de enviar."
              className="w-full resize-y rounded-lg border border-white/10 bg-kamui-gray px-3 py-2.5 text-sm leading-normal text-kamui-white placeholder:text-kamui-white-muted/50 focus:border-kamui-red/50 focus:outline-none focus:ring-1 focus:ring-kamui-red/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="manual-upload-tags" className="text-xs font-medium text-kamui-white">
              Tags (vírgulas)
            </label>
            <input
              id="manual-upload-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex.: gaming, clip"
              className="h-10 w-full rounded-lg border border-white/10 bg-kamui-gray px-3 text-sm leading-normal text-kamui-white placeholder:text-kamui-white-muted/50 focus:border-kamui-red/50 focus:outline-none focus:ring-1 focus:ring-kamui-red/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="manual-upload-privacy-trigger" className="text-xs font-medium text-kamui-white">
              Privacidade
            </label>
            <SelectMenuButton
              idPrefix="manual-upload-privacy"
              value={privacy}
              onChange={setPrivacy}
              options={[
                { value: 'unlisted', label: 'Não listado' },
                { value: 'private', label: 'Privado' },
                { value: 'public', label: 'Público' },
              ]}
              className="w-full min-w-0"
            />
          </div>

          <div className="space-y-2 border-t border-white/5 pt-3">
            <p className="text-xs font-medium text-kamui-white">Miniatura</p>
            <p className="text-[11px] text-kamui-white-muted/90">
              Padrão: frame do vídeo (~0,8 s) — você pode enviar direto ou mudar abaixo.
            </p>
            <div className="flex flex-col gap-2">
              {[
                { id: 'frame', label: 'Frame do vídeo (padrão)' },
                { id: 'youtube', label: 'Deixar o YouTube escolher' },
                { id: 'file', label: 'Arquivo no PC (JPEG/PNG)' },
                { id: 'url', label: 'URL da imagem (HTTPS)' },
              ].map((opt) => (
                <ThumbnailRadioOption
                  key={opt.id}
                  id={opt.id}
                  label={opt.label}
                  name="thumb-mode"
                  checked={thumbnailMode === opt.id}
                  onSelect={setThumbnailMode}
                />
              ))}
            </div>
            {thumbnailMode === 'frame' && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] text-kamui-white-muted">Tempo do frame (segundos)</label>
                <div className="space-y-2 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={0.1}
                    value={Math.min(30, Math.max(0, Number(frameSeconds) || 0))}
                    onChange={(e) => setFrameSeconds(parseFloat(e.target.value) || 0)}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-kamui-gray accent-kamui-red"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={3600}
                      step={0.1}
                      value={frameSeconds}
                      onChange={(e) => setFrameSeconds(parseFloat(e.target.value) || 0)}
                      className="h-10 w-28 rounded-lg border border-white/10 bg-kamui-gray px-3 text-sm leading-normal text-kamui-white [appearance:textfield] focus:border-kamui-red/50 focus:outline-none focus:ring-1 focus:ring-kamui-red/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-kamui-white-muted">segundos</span>
                    <div className="ml-auto flex gap-1">
                      {[0.8, 2, 5].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFrameSeconds(preset)}
                          className="rounded-md border border-white/10 bg-kamui-gray px-2 py-1 text-[11px] text-kamui-white-muted transition-colors hover:border-kamui-red/35 hover:text-kamui-white"
                        >
                          {preset}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {thumbnailMode === 'file' && (
              <div className="pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                  className="w-full text-xs text-kamui-white-muted file:mr-2 file:rounded file:border-0 file:bg-kamui-red/80 file:px-2 file:py-1 file:text-white"
                  onChange={(e) => setThumbFile(e.target.files?.[0] || null)}
                />
              </div>
            )}
            {thumbnailMode === 'url' && (
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1 w-full rounded-lg border border-white/10 bg-kamui-gray px-3 py-2 text-sm text-kamui-white placeholder:text-kamui-white-muted/60 focus:border-kamui-red/50 focus:outline-none"
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] px-4 py-3">
          <Button variant="outline" size="sm" type="button" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="button" loading={busy} onClick={handleSubmit}>
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}
