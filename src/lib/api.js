/**
 * Cliente HTTP para o backend Kamui (FastAPI em localhost).
 */

async function resolveBaseUrl() {
  try {
    if (typeof window !== 'undefined' && typeof window.require === 'function') {
      const { ipcRenderer } = window.require('electron')
      const u = await ipcRenderer.invoke('get-backend-url')
      if (u) return u
    }
  } catch (_) {
    /* sem Electron */
  }
  return import.meta.env.VITE_KAMUI_BACKEND_URL || 'http://127.0.0.1:17420'
}

export async function apiUrl(path) {
  let base = await resolveBaseUrl()
  if (base == null || base === '') {
    base = import.meta.env.VITE_KAMUI_BACKEND_URL || 'http://127.0.0.1:17420'
  }
  base = String(base).trim().replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export async function apiGet(path, params) {
  let url = await apiUrl(path)
  if (params && typeof params === 'object') {
    const u = new URL(url)
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v))
    }
    url = u.toString()
  }
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json()
}

export async function apiPut(path, body) {
  const url = await apiUrl(path)
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let detail = await res.text()
    try {
      const j = JSON.parse(detail)
      detail = j.detail || detail
    } catch (_) {
      /* texto */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return res.json()
}

export async function apiPost(path) {
  const url = await apiUrl(path)
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) {
    let detail = await res.text()
    try {
      const j = JSON.parse(detail)
      detail = j.detail || detail
    } catch (_) {
      /* texto */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return res.json()
}

export async function apiPostFormData(path, formData) {
  const url = await apiUrl(path)
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    let detail = await res.text()
    try {
      const j = JSON.parse(detail)
      detail = j.detail || detail
    } catch (_) {
      /* texto */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return res.json()
}

export async function apiPostJson(path, body) {
  const url = await apiUrl(path)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) {
    let detail = await res.text()
    try {
      const j = JSON.parse(detail)
      detail = j.detail || detail
    } catch (_) {
      /* texto */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return res.json()
}

export async function apiDelete(path) {
  const url = await apiUrl(path)
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json()
}

export async function selectWatchFolderElectron() {
  try {
    if (typeof window.require === 'function') {
      const { ipcRenderer } = window.require('electron')
      return await ipcRenderer.invoke('select-watch-folder')
    }
  } catch (_) {
    /* ignore */
  }
  return null
}

export async function selectVideoFileElectron() {
  try {
    if (typeof window.require === 'function') {
      const { ipcRenderer } = window.require('electron')
      return await ipcRenderer.invoke('select-video-file')
    }
  } catch (_) {
    /* ignore */
  }
  return null
}

export async function openPathElectron(targetPath) {
  try {
    if (typeof window.require === 'function') {
      const { ipcRenderer } = window.require('electron')
      return await ipcRenderer.invoke('open-path', targetPath)
    }
  } catch (_) {
    /* ignore */
  }
  return { ok: false, error: 'Abertura de arquivo local requer app desktop (Electron).' }
}

export async function showItemInFolderElectron(targetPath) {
  try {
    if (typeof window.require === 'function') {
      const { ipcRenderer } = window.require('electron')
      return await ipcRenderer.invoke('show-item-in-folder', targetPath)
    }
  } catch (_) {
    /* ignore */
  }
  return { ok: false, error: 'Revelar arquivo requer app desktop (Electron).' }
}

