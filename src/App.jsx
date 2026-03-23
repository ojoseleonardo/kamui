import React, { useCallback, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import YouTubeRoute from './pages/YouTubeRoute'
import Local from './pages/Local'
import Settings from './pages/Settings'
import History from './pages/History'
import SetupWizard from './pages/SetupWizard'
import { BackendStatusProvider } from './context/BackendStatusContext'
import { apiGet } from './lib/api'
import KamuiLoader from './components/ui/KamuiLoader'

function App() {
  const [phase, setPhase] = useState('loading')

  const loadStatus = useCallback(async () => {
    try {
      const s = await apiGet('/setup/status')
      setPhase(s.setup_complete ? 'app' : 'setup')
    } catch {
      setPhase('setup')
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  if (phase === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-kamui-black">
        <KamuiLoader />
      </div>
    )
  }

  if (phase === 'setup') {
    return <SetupWizard onComplete={() => setPhase('app')} />
  }

  return (
    <BackendStatusProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/youtube" element={<YouTubeRoute />} />
          <Route path="/local" element={<Local />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Layout>
    </BackendStatusProvider>
  )
}

export default App
