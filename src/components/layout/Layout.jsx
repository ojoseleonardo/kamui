import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Terminal from './Terminal'

function Layout({ children }) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)

  return (
    <div className="flex h-screen bg-kamui-black overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 uchiha-pattern opacity-30 pointer-events-none" />
      
      {/* Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-kamui-red/5 blur-[150px] rounded-full pointer-events-none" />
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header 
          isTerminalOpen={isTerminalOpen}
          onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        />
        
        {/* Content */}
        <main className="flex-1 overflow-auto p-6 relative">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
        
        {/* Terminal */}
        <Terminal 
          isOpen={isTerminalOpen} 
          onClose={() => setIsTerminalOpen(false)} 
        />
      </div>
    </div>
  )
}

export default Layout
