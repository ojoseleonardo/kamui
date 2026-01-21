import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Youtube, 
  FolderOpen, 
  Settings, 
  History,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import SharinganIcon from '../ui/SharinganIcon'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/youtube', icon: Youtube, label: 'YouTube' },
  { to: '/local', icon: FolderOpen, label: 'Local' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/history', icon: History, label: 'History' },
]

function Sidebar() {
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
          <p className="text-[10px] text-kamui-white-muted tracking-[0.2em] font-japanese">
            神威
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
                    'text-kamui-white-muted hover:text-kamui-white hover:bg-white/5',
                    isActive && 'active text-kamui-white'
                  )
                }
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="glass-card rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-kamui-white-muted">Monitoramento Ativo</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Zap size={12} className="text-kamui-red" />
            <span className="text-kamui-white-muted">3 clipes na fila</span>
          </div>
        </div>
      </div>

      {/* Uchiha Crest Watermark */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 opacity-[0.03] pointer-events-none">
        <svg width="120" height="140" viewBox="0 0 100 120" fill="currentColor">
          <path d="M50 10 C20 30 10 70 50 110 C90 70 80 30 50 10 Z" />
          <circle cx="50" cy="60" r="20" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      </div>
    </aside>
  )
}

export default Sidebar
