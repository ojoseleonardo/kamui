import React, { useState } from 'react'
import { 
  Bell, 
  Terminal as TerminalIcon, 
  User,
  ChevronDown,
  Settings,
  LogOut,
  Moon,
  Sun
} from 'lucide-react'
import { cn } from '@/lib/utils'

function Header({ isTerminalOpen, onToggleTerminal }) {
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Upload concluído: Epic_Clutch_2024.mp4', time: '2 min atrás', read: false },
    { id: 2, text: 'Novo clipe detectado na pasta monitorada', time: '15 min atrás', read: false },
    { id: 3, text: 'Atualização disponível v2.1.0', time: '1 hora atrás', read: true },
  ])
  const [showNotifications, setShowNotifications] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="h-14 bg-kamui-darker/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 drag-region">
      {/* Search / Title Area */}
      <div className="flex items-center gap-4 no-drag">
        <h2 className="text-lg font-semibold text-kamui-white">
          Dashboard
        </h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 no-drag">
        {/* Terminal Toggle */}
        <button
          onClick={onToggleTerminal}
          className={cn(
            'p-2 rounded-lg transition-all duration-300',
            'hover:bg-white/5 text-kamui-white-muted hover:text-kamui-white',
            isTerminalOpen && 'bg-kamui-red/20 text-kamui-red'
          )}
          title="Toggle Terminal"
        >
          <TerminalIcon size={20} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              'p-2 rounded-lg transition-all duration-300',
              'hover:bg-white/5 text-kamui-white-muted hover:text-kamui-white',
              unreadCount > 0 && 'notification-dot'
            )}
            title="Notificações"
          >
            <Bell size={20} />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl overflow-hidden z-50 animate-fade-in">
              <div className="p-3 border-b border-white/5">
                <h3 className="font-semibold text-sm">Notificações</h3>
              </div>
              <div className="max-h-64 overflow-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'p-3 border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors',
                      !notif.read && 'bg-kamui-red/5'
                    )}
                  >
                    <p className="text-sm text-kamui-white">{notif.text}</p>
                    <p className="text-xs text-kamui-white-muted mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 mx-2" />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-kamui-red to-kamui-red-dark flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-kamui-white">Jogador</p>
              <p className="text-xs text-kamui-white-muted">Pro Account</p>
            </div>
            <ChevronDown size={16} className="text-kamui-white-muted" />
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl overflow-hidden z-50 animate-fade-in">
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                  <Settings size={16} className="text-kamui-white-muted" />
                  <span className="text-sm">Configurações</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                  <Moon size={16} className="text-kamui-white-muted" />
                  <span className="text-sm">Tema</span>
                </button>
                <div className="border-t border-white/5 my-1" />
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-kamui-red/10 transition-colors text-left text-kamui-red">
                  <LogOut size={16} />
                  <span className="text-sm">Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handler */}
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
