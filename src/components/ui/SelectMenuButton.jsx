import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Botão estilo select com lista suspensa (alinhado às telas YouTube / Local).
 * @param {{ idPrefix: string, options: { value: string, label: string }[], value: string, onChange: (v: string) => void, className?: string }} props
 */
export default function SelectMenuButton({ idPrefix, options, value, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const label = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? ''

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const btnId = `${idPrefix}-trigger`
  const listId = `${idPrefix}-list`

  return (
    <div ref={ref} className={`relative shrink-0 min-w-[9.5rem] ${className}`.trim()}>
      <button
        type="button"
        id={btnId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full cursor-pointer items-center rounded-lg border border-white/10 bg-kamui-gray py-0 pl-4 pr-9 text-left text-sm text-kamui-white transition-colors hover:border-white/20 focus:border-kamui-red/50 focus:outline-none"
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          size={16}
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-kamui-white-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={btnId}
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-white/10 bg-kamui-gray py-1 shadow-lg shadow-black/40"
        >
          {options.map((opt) => (
            <li key={opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === opt.value}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/10 ${
                  value === opt.value ? 'bg-white/5 text-kamui-white' : 'text-kamui-white'
                }`}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
