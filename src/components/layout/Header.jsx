import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Bell,
  Terminal as TerminalIcon,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Moon,
} from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import WindowControls from './WindowControls'
import { useEvents } from '@/hooks/useEvents'
import { useBackendStatus } from '@/context/BackendStatusContext'

const titles = {
  '/': 'Dashboard',
  '/youtube': 'YouTube',
  '/local': 'Clipes locais',
  '/settings': 'Configurações',
  '/history': 'Histórico',
}

function Header({ isTerminalOpen, onToggleTerminal }) {
  const location = useLocation()
  const title = titles[location.pathname] || 'Kamui'
  const { backendReachable } = useBackendStatus()
  const { events } = useEvents({ limit: 12, enabled: backendReachable })
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(() => new Set())

  const notifications = events
    .filter((e) => !dismissedNotificationIds.has(e.id))
    .map((e) => ({
      id: e.id,
      text: `${e.title}: ${e.detail || ''}`.trim(),
      time: formatDateTime(e.created_at),
      read: true,
    }))

  const unreadCount = 0

  const clearNotifications = () => {
    if (!notifications.length) return
    setDismissedNotificationIds((prev) => {
      const next = new Set(prev)
      for (const n of notifications) next.add(n.id)
      return next
    })
  }

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-stretch justify-between border-b border-white/5 bg-kamui-darker/60 pl-6 backdrop-blur-xl drag-region">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-kamui-white">{title}</h2>
      </div>

      <div className="flex items-stretch">
        <div className="flex items-center gap-2 border-l border-white/5 px-3 no-drag">
          <button
            type="button"
            onClick={onToggleTerminal}
            className={cn(
              'p-2 rounded-lg transition-all duration-300',
              'hover:bg-white/5 text-kamui-white-muted hover:text-kamui-white',
              isTerminalOpen && 'bg-kamui-red/20 text-kamui-red',
            )}
            title="Terminal"
          >
            <TerminalIcon size={20} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'p-2 rounded-lg transition-all duration-300',
                'hover:bg-white/5 text-kamui-white-muted hover:text-kamui-white',
                unreadCount > 0 && 'notification-dot',
              )}
              title="Atividade recente"
            >
              <Bell size={20} />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl overflow-hidden z-50 animate-fade-in">
                <div className="p-3 border-b border-white/5 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm">Atividade recente</h3>
                  <button
                    type="button"
                    onClick={clearNotifications}
                    disabled={notifications.length === 0}
                    className="text-xs px-2 py-1 rounded border border-white/10 text-kamui-white-muted hover:text-kamui-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Limpar notificações"
                  >
                    Limpar
                  </button>
                </div>
                <div className="max-h-64 overflow-auto">
                  {!backendReachable && (
                    <p className="p-3 text-sm text-kamui-white-muted">Backend offline.</p>
                  )}
                  {backendReachable && notifications.length === 0 && (
                    <p className="p-3 text-sm text-kamui-white-muted">Sem eventos recentes.</p>
                  )}
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                    >
                      <p className="text-sm text-kamui-white line-clamp-2">{notif.text}</p>
                      <p className="text-xs text-kamui-white-muted mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-white/10 mx-2" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-1.5 rounded-lg p-1.5 transition-colors hover:bg-white/5"
              title="Conta"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-kamui-red to-kamui-red-dark">
                <User size={16} />
              </div>
              <ChevronDown size={16} className="text-kamui-white-muted" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl overflow-hidden z-50 animate-fade-in">
                <div className="p-2">
                  <Link
                    to="/settings"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                    onClick={() => setShowProfile(false)}
                  >
                    <Settings size={16} className="text-kamui-white-muted" />
                    <span className="text-sm">Configurações</span>
                  </Link>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <Moon size={16} className="text-kamui-white-muted" />
                    <span className="text-sm">Tema</span>
                  </button>
                  <div className="border-t border-white/5 my-1" />
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-kamui-red/10 transition-colors text-left text-kamui-red"
                  >
                    <LogOut size={16} />
                    <span className="text-sm">Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <WindowControls />
      </div>

      {(showNotifications || showProfile) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false)
            setShowProfile(false)
          }}
        />
      )}
    </header>
  )
}

export default Header
