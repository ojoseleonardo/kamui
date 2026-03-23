import React from 'react'
import { Check } from 'lucide-react'

/**
 * Checkbox compacto para modo seleção (Kamui).
 * @param {{ checked: boolean, onChange: (v: boolean) => void, className?: string, stopPropagation?: boolean, 'aria-label'?: string }} props
 */
export default function SelectionCheckbox({
  checked,
  onChange,
  className = '',
  stopPropagation = false,
  'aria-label': ariaLabel = 'Selecionar',
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center justify-center rounded-md p-0.5 transition hover:bg-white/10 ${className}`}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
          checked
            ? 'border-kamui-red bg-kamui-red shadow-[0_0_0_1px_rgba(0,0,0,0.2)_inset]'
            : 'border-white/30 bg-black/50 shadow-inner'
        }`}
      >
        {checked ? <Check className="h-3 w-3 text-white" strokeWidth={3} aria-hidden /> : null}
      </span>
    </label>
  )
}
