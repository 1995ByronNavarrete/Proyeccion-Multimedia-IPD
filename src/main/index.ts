import { app, BrowserWindow, screen, ipcMain } from 'electron'
import { join, extname } from 'path'
import { existsSync, mkdirSync, readFileSync, watch } from 'fs'
import { createServer } from 'http'
import { autoUpdater } from 'electron-updater'
import { initDatabase, seedBibleIfEmpty } from './database'


import { registerIpcHandlers } from './ipc-handlers'
import { registerVideoHandlers, setOpenProjector } from './video-handlers'
import { registerBackupHandlers } from './backup-handler'
let mainWindow: BrowserWindow | null = null
const projectorWindows: Map<number, BrowserWindow> = new Map()
let devServerPort: number | null = null
let lastOverlay: unknown = null

// ── Servidor HTTP local para producción ──
const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2'
}

function startLocalServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const rendererDir = join(__dirname, '../renderer')
    const server = createServer(async (req, res) => {
      let filePath = join(rendererDir, req.url === '/' ? 'index.html' : req.url!)
      if (!extname(filePath)) filePath = join(rendererDir, 'index.html')
      try {
        const { readFile } = await import('fs/promises')
        const data = await readFile(filePath)
        const ext = extname(filePath)
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
        res.end(data)
      } catch {
        try {
          const { readFile } = await import('fs/promises')
          const data = await readFile(join(rendererDir, 'index.html'))
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(data)
        } catch {
          res.writeHead(404)
          res.end('Not found')
        }
      }
    })
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (addr && typeof addr === 'object') {
        resolve(addr.port)
      } else {
        reject(new Error('Failed to get server port'))
      }
    })
    server.on('error', reject)
  })
}

function getAppDisplayId(): number {
  if (!mainWindow) return screen.getPrimaryDisplay().id
  const bounds = mainWindow.getBounds()
  return screen.getDisplayMatching(bounds).id
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    fullscreen: true,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      autoplayPolicy: 'no-user-gesture-required'
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.webContents.setZoomLevel(0)
    autoOpenProjectors()
  })

  mainWindow.webContents.on('did-finish-load', () => {
    if (lastOverlay) {
      for (const [, win] of projectorWindows) {
        if (!win.isDestroyed()) win.webContents.send('projector:overlay', lastOverlay)
      }
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) win.close()
    }
    projectorWindows.clear()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else if (devServerPort) {
    mainWindow.loadURL(`http://127.0.0.1:${devServerPort}`)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createProjectorWindow(displayId: number): void {
  const existing = projectorWindows.get(displayId)
  if (existing && !existing.isDestroyed()) return

  const display = screen.getAllDisplays().find((d) => d.id === displayId)
  if (!display) return

  const { x, y, width, height } = display.bounds
  const win = new BrowserWindow({
    x, y, width, height,
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      autoplayPolicy: 'no-user-gesture-required'
    }
  })

  win.on('closed', () => projectorWindows.delete(displayId))
  win.webContents.on('did-finish-load', () => {
    win.webContents.setZoomLevel(0)
    if (lastOverlay) win.webContents.send('projector:overlay', lastOverlay)
  })
  projectorWindows.set(displayId, win)

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/projector`)
  } else if (devServerPort) {
    win.loadURL(`http://127.0.0.1:${devServerPort}#/projector`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/projector' })
  }
}

function autoOpenProjectors(): void {
  const appDisplayId = getAppDisplayId()
  for (const display of screen.getAllDisplays()) {
    if (display.id !== appDisplayId) {
      createProjectorWindow(display.id)
    }
  }
  mainWindow?.webContents.send('projector:layoutChanged')
}

function registerMainIpcHandlers(): void {
  ipcMain.handle('app:minimize', () => mainWindow?.minimize())
  ipcMain.handle('app:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.handle('screen:getAll', () => {
    return screen.getAllDisplays()
  })

  ipcMain.handle('screen:getLayout', () => {
    return { displays: screen.getAllDisplays(), appDisplayId: getAppDisplayId() }
  })

  ipcMain.handle('projector:open', (_event, displayId?: number) => {
    if (displayId != null) {
      createProjectorWindow(displayId)
    } else {
      autoOpenProjectors()
    }
  })

  ipcMain.handle('projector:close', () => {
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) win.close()
    }
    projectorWindows.clear()
  })

  ipcMain.handle('projector:showBlack', () => {
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) win.webContents.send('projector:showBlack')
    }
  })

  ipcMain.handle('projector:prevVerse', () => {
    mainWindow?.webContents.send('projector:prevVerse')
  })
  ipcMain.handle('projector:nextVerse', () => {
    mainWindow?.webContents.send('projector:nextVerse')
  })

  ipcMain.handle('projector:showAnnouncement', (_event, data: { text: string; animation: string }) => {
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) win.webContents.send('projector:showAnnouncement', data)
    }
  })

  ipcMain.handle('projector:hideAnnouncement', () => {
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) win.webContents.send('projector:hideAnnouncement')
    }
  })

  ipcMain.handle('projector:updateAnnouncement', (_event, data: Record<string, string>) => {
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) win.webContents.send('projector:updateAnnouncement', data)
    }
  })

  ipcMain.handle('capture:projector', async () => {
    try {
      const projWins = Array.from(projectorWindows.values()).filter((w) => !w.isDestroyed())
      if (projWins.length === 0) return { success: false, error: 'No hay ventanas de proyector' }
      const image = await projWins[0].webContents.capturePage()
      const pngBuffer = image.toPNG()
      return { success: true, data: { base64: pngBuffer.toString('base64') } }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('projector:sendContent', (_event, content: unknown) => {
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) win.webContents.send('projector:content', content)
    }
  })

  ipcMain.handle('projector:overlay', (_event, overlay: { type: string; speed: number; color?: string }) => {
    lastOverlay = overlay
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) win.webContents.send('projector:overlay', overlay)
    }
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('projector:overlay', overlay)
  })
}

// Video/GPU compatibility for production builds
app.commandLine.appendSwitch('ignore-gpu-blacklist')
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

app.whenReady().then(async () => {
  await initDatabase()
  await seedBibleIfEmpty()
  registerIpcHandlers()
  registerMainIpcHandlers()
  registerVideoHandlers()
  registerBackupHandlers()
  setOpenProjector(() => autoOpenProjectors())

  // Create default media folders in Documents
  const docsPath = app.getPath('documents')
  const appFolder = join(docsPath, 'DesktopAppIPD')
  const musicFolder = join(appFolder, 'Música')
  const videosFolder = join(appFolder, 'Videos')
  const fondosFolder = join(appFolder, 'Fondos')
  const logoEnVideoFolder = join(appFolder, 'logoEnVideo')
  const folders = [appFolder, musicFolder, videosFolder, fondosFolder, logoEnVideoFolder]
  for (const folder of folders) {
    if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
  }

  // Watch media folders for changes and notify renderer
  let watchTimeout: ReturnType<typeof setTimeout> | null = null
  const notifyMediaChange = () => {
    if (watchTimeout) clearTimeout(watchTimeout)
    watchTimeout = setTimeout(() => {
      mainWindow?.webContents.send('medialocal:changed')
    }, 500)
  }

  try {
    watch(musicFolder, (eventType) => {
      if (eventType === 'rename' || eventType === 'change') notifyMediaChange()
    })
    watch(videosFolder, (eventType) => {
      if (eventType === 'rename' || eventType === 'change') notifyMediaChange()
    })
    watch(fondosFolder, (eventType) => {
      if (eventType === 'rename' || eventType === 'change') notifyMediaChange()
    })
  } catch {
    // watcher not critical
  }

  // Auto-updater configuration
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update:available', info)
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update:not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update:download-progress', progress)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update:downloaded')
  })

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update:error', err.message)
  })

  ipcMain.handle('update:check', () => {
    autoUpdater.checkForUpdates()
  })

  ipcMain.handle('update:download', () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall()
  })

  // Check for updates after a short delay (don't block startup)
  setTimeout(() => {
    try {
      autoUpdater.checkForUpdates()
    } catch {}
  }, 5000)

  // En producción, iniciar servidor HTTP local (evita errores con file://)
  if (!process.env.ELECTRON_RENDERER_URL) {
    try {
      devServerPort = await startLocalServer()
      console.log('[server] Local HTTP server running on port', devServerPort)
    } catch (err) {
      console.error('[server] Failed to start local server:', err)
    }
  }

  createMainWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})
