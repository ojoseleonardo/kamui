import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

/**
 * @param {{
 *   open: boolean,
 *   titleId?: string,
 *   title: string,
 *   children: React.ReactNode,
 *   confirmLabel?: string,
 *   cancelLabel?: string | null,
 *   confirmVariant?: 'primary' | 'danger' | 'outline',
 *   onConfirm: () => void,
 *   onClose: () => void,
 *   busy?: boolean,
 *   overlayClassName?: string,
 * }} props
 */
export default function ConfirmModal({
  open,
  titleId = 'confirm-modal-title',
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  onConfirm,
  onClose,
  busy = false,
  overlayClassName = '',
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px] ${overlayClassName || 'z-[100]'}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (!busy && e.target === e.currentTarget) onClose()
      }}
    >
      <div className="glass-card-static max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <h2 id={titleId} className="min-w-0 flex-1 text-sm font-semibold tracking-tight text-kamui-white">
            {title}
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
        <div className="max-h-[min(50vh,20rem)] space-y-4 overflow-y-auto px-4 py-4 text-sm leading-relaxed text-kamui-white-muted">
          {children}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] px-4 py-3">
          {cancelLabel != null && (
            <Button variant="outline" size="sm" type="button" disabled={busy} onClick={onClose}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={confirmVariant}
            size="sm"
            type="button"
            loading={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
