import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import YouTube from './pages/YouTube'
import Local from './pages/Local'
import Settings from './pages/Settings'
import History from './pages/History'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/youtube" element={<YouTube />} />
        <Route path="/local" element={<Local />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Layout>
  )
}

export default App
