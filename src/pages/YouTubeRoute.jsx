import React from 'react'
import { Navigate } from 'react-router-dom'
import { useBackendStatus } from '@/context/BackendStatusContext'
import YouTube from './YouTube'

function YouTubeRoute() {
  const { youtubeConnected } = useBackendStatus()
  if (!youtubeConnected) {
    return <Navigate to="/" replace />
  }
  return <YouTube />
}

export default YouTubeRoute
