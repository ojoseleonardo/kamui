import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Youtube, 
  FolderOpen, 
  Settings, 
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiGet } from '@/lib/api'
import SharinganIcon from '../ui/SharinganIcon'
import { useBackendStatus } from '@/context/BackendStatusContext'

const navItems = [
  { to: '/', icon: Home, label: 'Home', needsYoutube: false },
  { to: '/youtube', icon: Youtube, label: 'YouTube', needsYoutube: true },
  { to: '/local', icon: FolderOpen, label: 'Local', needsYoutube: false },
  { to: '/history', icon: History, label: 'Histórico', needsYoutube: false },
  { to: '/settings', icon: Settings, label: 'Configurações', needsYoutube: false },
]

function Sidebar() {
  const { youtubeConnected, backendReachable, monitorActive, queueCount } = useBackendStatus()
  const [displayName, setDisplayName] = useState('')
  const hasQueue = queueCount > 0
  const statusDotClass = !backendReachable
    ? 'bg-kamui-gray-light'
    : hasQueue
      ? 'bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.4)] animate-pulse'
      : monitorActive
        ? 'bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.35)]'
        : 'bg-kamui-gray-light'

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const setup = await apiGet('/setup/status')
        if (!alive) return
        setDisplayName(String(setup?.display_name || '').trim())
      } catch {
        if (!alive) return
        setDisplayName('')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <aside className="w-64 bg-kamui-darker/80 backdrop-blur-xl border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5 drag-region">
        <div className="no-drag">
          <SharinganIcon size={36} animated />
        </div>
        <div className="no-drag">
          <h1 className="font-display font-bold text-xl tracking-wider gradient-text">
            KAMUI
          </h1>
          <p className="text-[10px] text-kamui-white-muted tracking-[0.1em]">
            {displayName ? `Olá, ${displayName}` : 'Olá'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const disabled = item.needsYoutube && !youtubeConnected
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : undefined}
                  title={disabled ? 'YouTube desconectado — reconecte em Configurações' : undefined}
                  className={({ isActive }) =>
                    cn(
                      'sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
                      'text-kamui-white-muted hover:text-kamui-white hover:bg-white/5',
                      isActive && !disabled && 'active text-kamui-white',
                      disabled && 'pointer-events-none opacity-40 cursor-not-allowed',
                    )
                  }
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass}`}
                aria-hidden
              />
              <div className="min-w-0">
                <span className="block truncate font-display text-[11px] font-bold tracking-[0.14em] text-kamui-white-muted">
                  KAMUI
                </span>
                <span className="block truncate text-[9px] font-medium uppercase tracking-[0.14em] text-kamui-white-muted/45">
                  1.0 beta
                </span>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
              <span className="text-sm font-semibold tabular-nums tracking-tight text-kamui-white/90">
                {queueCount}
              </span>
              <span className="select-none text-kamui-white-muted/20" aria-hidden>
                ·
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-kamui-white-muted/45">
                fila
              </span>
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
