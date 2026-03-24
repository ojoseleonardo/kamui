const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const readline = require('readline')

const isDev = process.env.NODE_ENV !== 'production'

let mainWindow = null
let backendChild = null
/** @type {string | null} */
let backendBaseUrl = null

function getCoreDir() {
  return path.join(__dirname, '..', 'core')
}

function buildPythonLaunch() {
  const coreDir = getCoreDir()
  const userData = app.getPath('userData')
  const env = { ...process.env, KAMUI_USER_DATA: userData }
  const args = ['-u', '-m', 'backend']

  if (process.env.KAMUI_PYTHON) {
    return { exe: process.env.KAMUI_PYTHON, args, cwd: coreDir, env }
  }
  if (process.platform === 'win32') {
    return { exe: 'python', args, cwd: coreDir, env }
  }
  return { exe: 'python3', args, cwd: coreDir, env }
}

function waitForBackendPort() {
  return new Promise((resolve, reject) => {
    const { exe, args, cwd, env } = buildPythonLaunch()
    let settled = false

    backendChild = spawn(exe, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        try {
          backendChild.kill()
        } catch (_) {}
        reject(new Error('Tempo esgotado ao iniciar o backend Python (20 s).'))
      }
    }, 20000)

    const rl = readline.createInterface({ input: backendChild.stdout })

    rl.on('line', (line) => {
      const trimmed = line.trim()
      const m = /^KAMUI_PORT=(\d+)$/.exec(trimmed)
      if (m && !settled) {
        settled = true
        clearTimeout(timer)
        rl.close()
        resolve(parseInt(m[1], 10))
      }
    })

    backendChild.stderr.on('data', (chunk) => {
      console.error('[backend]', chunk.toString())
    })

    backendChild.on('error', (err) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        reject(
          new Error(
            `Falha ao iniciar Python (${exe}). Em core/, rode uv sync (ou pip install -e .) e, se precisar, defina KAMUI_PYTHON para o Python do .venv. ${err.message}`,
          ),
        )
      }
    })

    backendChild.on('exit', (code) => {
      if (!settled && code !== 0 && code !== null) {
        settled = true
        clearTimeout(timer)
        reject(new Error(`Backend Python terminou com código ${code}.`))
      }
    })
  })
}

function killBackend() {
  if (backendChild && !backendChild.killed) {
    try {
      backendChild.kill()
    } catch (_) {}
    backendChild = null
  }
  backendBaseUrl = null
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, '../public/kamui-icon.png'),
  })

  mainWindow = win

  const broadcastWindowState = () => {
    win.webContents.send('window-state', {
      maximized: win.isMaximized(),
    })
  }

  win.on('maximize', broadcastWindowState)
  win.on('unmaximize', broadcastWindowState)

  win.webContents.once('did-finish-load', () => {
    broadcastWindowState()
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  ipcMain.handle('get-window-maximized', () => mainWindow?.isMaximized() ?? false)

  ipcMain.on('minimize-window', () => mainWindow?.minimize())
  ipcMain.on('maximize-window', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('close-window', () => mainWindow?.close())

  ipcMain.handle('get-backend-url', () => backendBaseUrl)

  ipcMain.handle('select-watch-folder', async () => {
    if (!mainWindow) return null
    const r = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Pasta de monitoramento de vídeos',
    })
    if (r.canceled || !r.filePaths.length) return null
    return r.filePaths[0]
  })

  ipcMain.handle('select-video-file', async () => {
    if (!mainWindow) return null
    const r = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      title: 'Selecionar vídeo para upload',
      filters: [
        { name: 'Vídeo', extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'm4v', 'wmv', 'flv'] },
        { name: 'Todos', extensions: ['*'] },
      ],
    })
    if (r.canceled || !r.filePaths.length) return null
    return r.filePaths[0]
  })

  ipcMain.handle('open-path', async (_event, targetPath) => {
    const p = typeof targetPath === 'string' ? targetPath.trim() : ''
    if (!p) return { ok: false, error: 'Caminho inválido.' }
    const err = await shell.openPath(p)
    if (err) return { ok: false, error: err }
    return { ok: true }
  })

  ipcMain.handle('show-item-in-folder', async (_event, targetPath) => {
    const p = typeof targetPath === 'string' ? targetPath.trim() : ''
    if (!p) return { ok: false, error: 'Caminho inválido.' }
    try {
      shell.showItemInFolder(p)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  })

  try {
    const port = await waitForBackendPort()
    backendBaseUrl = `http://127.0.0.1:${port}`
  } catch (e) {
    console.error(e)
    backendBaseUrl = null
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  killBackend()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
