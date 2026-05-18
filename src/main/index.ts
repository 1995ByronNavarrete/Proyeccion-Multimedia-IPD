import { app, BrowserWindow, screen, ipcMain } from 'electron'
import { join, extname } from 'path'
import { existsSync, mkdirSync, readFileSync, watch, FSWatcher } from 'fs'
import { createServer } from 'http'
import { autoUpdater } from 'electron-updater'
import { initDatabase, seedBibleIfEmpty, flushDatabase } from './database'


import { registerIpcHandlers } from './ipc-handlers'
import { registerVideoHandlers, setOpenProjector, setOnVideoPlay, setGetDisplayAssignments } from './video-handlers'
import { registerBackupHandlers } from './backup-handler'
import { appDocsPath, getBundledResourcesPath, getMime } from './shared'
let mainWindow: BrowserWindow | null = null
const projectorWindows: Map<number, BrowserWindow> = new Map()
let devServerPort: number | null = null
let lastOverlay: unknown = null
let lastVideoPayload: { url: string; title: string; duration: number } | null = null
let displayAssignments: Record<number, string[]> = {}
const fileWatchers: import('fs').FSWatcher[] = []

function sendContentToDisplay(displayId: number, channel: string, data: unknown): void {
  const win = projectorWindows.get(displayId)
  if (win && !win.isDestroyed()) win.webContents.send(channel, data)
}

// ── Servidor HTTP local para producción ──
const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4'
}

function startLocalServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const rendererDir = join(__dirname, '../renderer')
    const docsDir = join(appDocsPath(), 'Fondos')
    const bundledDocsDir = (() => { try { return getBundledResourcesPath() ? join(getBundledResourcesPath()!, 'Fondos') : null } catch { return null } })()
    const server = createServer(async (req, res) => {
      const urlPath = req.url === '/' ? 'index.html' : req.url!
      let filePath = join(rendererDir, urlPath)
      if (!extname(filePath)) filePath = join(rendererDir, 'index.html')
      try {
        const { readFile } = await import('fs/promises')
        const data = await readFile(filePath)
        const ext = extname(filePath)
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
        res.end(data)
      } catch {
        // Try serving from Fondos directories
        const fileName = urlPath.replace('/fondos/', '')
        if (fileName && fileName !== urlPath) {
          const paths = [join(docsDir, fileName), bundledDocsDir ? join(bundledDocsDir, fileName) : null].filter(Boolean)
          for (const p of paths) {
            try {
              const { readFile } = await import('fs/promises')
              const data = await readFile(p!)
              const ext = extname(p!)
              res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
              res.end(data)
              return
            } catch {}
          }
        }
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
    // Detectar cambios de pantalla en tiempo real
    screen.on('display-added', () => {
      mainWindow?.webContents.send('projector:layoutChanged')
    })
    screen.on('display-removed', () => {
      mainWindow?.webContents.send('projector:layoutChanged')
    })
    screen.on('display-metrics-changed', () => {
      mainWindow?.webContents.send('projector:layoutChanged')
    })
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
  const appDisplayId = getAppDisplayId()
  const isSameDisplay = displayId === appDisplayId

  const win = new BrowserWindow({
    x: isSameDisplay ? x + 50 : x,
    y: isSameDisplay ? y + 50 : y,
    width: isSameDisplay ? Math.min(width - 100, 800) : width,
    height: isSameDisplay ? Math.min(height - 100, 600) : height,
    fullscreen: !isSameDisplay,
    frame: isSameDisplay,
    alwaysOnTop: !isSameDisplay,
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
    if (lastOverlay && (!displayAssignments[displayId] || displayAssignments[displayId].includes('efectos'))) {
      win.webContents.send('projector:overlay', lastOverlay)
    }
    if (lastVideoPayload) win.webContents.send('projector:playVideo', lastVideoPayload)
  })
  projectorWindows.set(displayId, win)

  const hash = `/projector?displayId=${displayId}`
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}#${hash}`)
  } else if (devServerPort) {
    win.loadURL(`http://127.0.0.1:${devServerPort}#${hash}`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

function autoOpenProjectors(): void {
  const appDisplayId = getAppDisplayId()
  let opened = false
  for (const display of screen.getAllDisplays()) {
    if (display.id !== appDisplayId) {
      createProjectorWindow(display.id)
      opened = true
    }
  }
  if (!opened && screen.getAllDisplays().length > 0) {
    // Fallback: crear ventana proyector en la misma pantalla (para pruebas/sin monitor externo)
    createProjectorWindow(screen.getPrimaryDisplay().id)
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
    const primaryId = screen.getPrimaryDisplay().id
    return screen.getAllDisplays().map(d => ({
      id: d.id,
      name: (d as any).label || `Pantalla ${d.id}`,
      bounds: d.bounds,
      primary: d.id === primaryId
    }))
  })

  ipcMain.handle('screen:getLayout', () => {
    const primaryId = screen.getPrimaryDisplay().id
    return {
      displays: screen.getAllDisplays().map(d => ({
        id: d.id,
        name: (d as any).label || `Pantalla ${d.id}`,
        bounds: d.bounds,
        primary: d.id === primaryId
      })),
      appDisplayId: getAppDisplayId()
    }
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
  ipcMain.handle('projector:scrollDocument', (_event, direction: 'up' | 'down') => {
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) {
        win.focus()
        win.webContents.sendInputEvent({ type: 'keyDown', keyCode: direction === 'up' ? 'Up' : 'Down' })
      }
    }
  })

  ipcMain.handle('projector:showAnnouncement', (_event, data: { text: string; animation: string }) => {
    for (const [displayId, win] of projectorWindows) {
      if (win.isDestroyed()) continue
      if (displayAssignments[displayId] && !displayAssignments[displayId].includes('anuncios')) continue
      win.webContents.send('projector:showAnnouncement', data)
    }
  })

  ipcMain.handle('projector:hideAnnouncement', () => {
    for (const [displayId, win] of projectorWindows) {
      if (win.isDestroyed()) continue
      if (displayAssignments[displayId] && !displayAssignments[displayId].includes('anuncios')) continue
      win.webContents.send('projector:hideAnnouncement')
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

  ipcMain.handle('capture:projectorByDisplay', async (_event, displayId: number) => {
    try {
      const win = projectorWindows.get(displayId)
      if (!win || win.isDestroyed()) return { success: false, error: 'Ventana de proyector no encontrada' }
      const image = await win.webContents.capturePage()
      const pngBuffer = image.toPNG()
      return { success: true, data: { base64: pngBuffer.toString('base64'), displayId } }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  function fileUrlToDataUrl(url: string): string | null {
    try {
      let filePath = url.replace(/^file:\/\/\//, '').replace(/^file:\/\//, '')
      filePath = decodeURIComponent(filePath)
      if (!filePath || !existsSync(filePath)) return null
      const ext = extname(filePath).toLowerCase()
      const mime = getMime(ext)
      if (!mime.startsWith('image/')) return null
      const buf = readFileSync(filePath)
      return `data:${mime};base64,${buf.toString('base64')}`
    } catch { return null }
  }

  const moduleTypeToContentType: Record<string, string> = {
    verse: 'biblia', media: 'video', document: 'video'
  }

  ipcMain.handle('projector:sendContent', async (_event, content: any) => {
    if (content?.mediaUrl?.startsWith('file://')) {
      const dataUrl = fileUrlToDataUrl(content.mediaUrl)
      if (dataUrl) content.mediaUrl = dataUrl
    }
    if (content?.backgroundUrl?.startsWith('file://')) {
      const dataUrl = fileUrlToDataUrl(content.backgroundUrl)
      if (dataUrl) content.backgroundUrl = dataUrl
    }
    const moduleType = moduleTypeToContentType[content?.type] || null
    for (const [displayId, win] of projectorWindows) {
      if (win.isDestroyed()) continue
      if (moduleType && displayAssignments[displayId] && !displayAssignments[displayId].includes(moduleType)) continue
      win.webContents.send('projector:content', content)
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('projector:content', content)
    }
  })

  ipcMain.handle('projector:updateConfig', (_event, config: { overlayOpacity?: number; fontSize?: number }) => {
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) win.webContents.send('projector:config', config)
    }
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('projector:config', config)
  })

  ipcMain.handle('projector:overlay', (_event, overlay: { type: string; speed: number; color?: string }) => {
    lastOverlay = overlay
    for (const [displayId, win] of projectorWindows) {
      if (win.isDestroyed()) continue
      if (displayAssignments[displayId] && !displayAssignments[displayId].includes('efectos') && overlay.type !== 'none') continue
      win.webContents.send('projector:overlay', overlay)
    }
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('projector:overlay', overlay)
  })

  ipcMain.handle('projector:imageZoom', (_event, data: { zoom?: number; panX?: number; panY?: number; reset?: boolean }) => {
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) win.webContents.send('projector:imageZoom', data)
    }
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('projector:imageZoom', data)
  })

  // Per-display content control
  ipcMain.handle('display:setAssignments', (_event, assignments: Record<number, string[]>) => {
    displayAssignments = assignments
  })

  ipcMain.handle('display:sendContent', async (_event, displayId: number, content: any) => {
    if (content?.mediaUrl?.startsWith('file://')) {
      const dataUrl = fileUrlToDataUrl(content.mediaUrl)
      if (dataUrl) content.mediaUrl = dataUrl
    }
    if (content?.backgroundUrl?.startsWith('file://')) {
      const dataUrl = fileUrlToDataUrl(content.backgroundUrl)
      if (dataUrl) content.backgroundUrl = dataUrl
    }
    sendContentToDisplay(displayId, 'projector:content', content)
  })

  ipcMain.handle('display:showAnnouncement', (_event, displayId: number, data: any) => {
    sendContentToDisplay(displayId, 'projector:showAnnouncement', data)
  })

  ipcMain.handle('display:hideAnnouncement', (_event, displayId: number) => {
    sendContentToDisplay(displayId, 'projector:hideAnnouncement', null)
  })

  ipcMain.handle('display:stopVideo', (_event, displayId: number) => {
    sendContentToDisplay(displayId, 'projector:stopVideo', null)
  })

  // Timer broadcast filtered by assignments
  ipcMain.handle('timer:update', (_event, data: { time: number; running: boolean }) => {
    for (const [displayId, win] of projectorWindows) {
      if (win.isDestroyed()) continue
      if (displayAssignments[displayId] && !displayAssignments[displayId].includes('cronometro')) continue
      win.webContents.send('projector:timer', data)
    }
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
  setOnVideoPlay((url: string, title: string, duration: number) => {
    lastVideoPayload = { url, title, duration }
  })
  setGetDisplayAssignments(() => displayAssignments)

  // Create default media folders
  const appFolder = appDocsPath()
  const musicFolder = join(appFolder, 'Música')
  const videosFolder = join(appFolder, 'Videos')
  const fondosFolder = join(appFolder, 'Fondos')
  const documentosFolder = join(appFolder, 'Documentos')
  const folders = [appFolder, musicFolder, videosFolder, fondosFolder, documentosFolder]
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

  const foldersToWatch = [
    { name: 'Música', path: musicFolder },
    { name: 'Videos', path: videosFolder },
    { name: 'Fondos', path: fondosFolder },
    { name: 'Documentos', path: documentosFolder }
  ]
  for (const f of foldersToWatch) {
    try {
      const w = watch(f.path, (eventType) => {
        if (eventType === 'rename' || eventType === 'change') notifyMediaChange()
      })
      fileWatchers.push(w)
    } catch {}
  }

  // Auto-updater configuration
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://github.com/1995ByronNavarrete/Proyeccion-Multimedia-IPD/releases/latest/download'
  })

  function compareVersions(a: string, b: string): number {
    const pa = a.replace('v', '').split('.').map(Number)
    const pb = b.replace('v', '').split('.').map(Number)
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) > (pb[i] || 0)) return 1
      if ((pa[i] || 0) < (pb[i] || 0)) return -1
    }
    return 0
  }

  const sendToMain = (channel: string, data?: unknown) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data)
    }
  }

  autoUpdater.on('update-available', (info) => {
    const current = app.getVersion()
    if (info?.version && compareVersions(info.version, current) <= 0) {
      console.log('[auto-updater] Ignoring same/older version:', info.version)
      return
    }
    console.log('[auto-updater] Update available:', info?.version)
    sendToMain('update:available', info)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[auto-updater] No update available')
    sendToMain('update:not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    sendToMain('update:download-progress', progress)
  })

  autoUpdater.on('update-downloaded', () => {
    console.log('[auto-updater] Update downloaded')
    sendToMain('update:downloaded')
  })

  autoUpdater.on('error', (err) => {
    console.error('[auto-updater] Error:', err.message, err.stack)
    sendToMain('update:error', err.message)
  })

  ipcMain.handle('update:check', async () => {
    try {
      await autoUpdater.checkForUpdates()
    } catch (e) {
      console.error('[auto-updater] check error:', e)
    }
  })

  ipcMain.handle('update:checkAndReturn', async () => {
    try {
      console.log('[auto-updater] Checking for updates (checkAndReturn)...')
      const result = await autoUpdater.checkForUpdates()
      const current = app.getVersion()
      if (result && result.versionInfo) {
        const remote = result.versionInfo.version || ''
        const isNewer = compareVersions(remote, current) > 0
        console.log('[auto-updater] checkAndReturn current:', current, 'remote:', remote, 'isNewer:', isNewer)
        if (isNewer) {
          return { success: true, available: true, info: result.versionInfo }
        }
      }
      return { success: true, available: false }
    } catch (e: any) {
      console.error('[auto-updater] checkAndReturn error:', e)
      return { success: false, available: false, error: e?.message || String(e) }
    }
  })

  ipcMain.handle('update:download', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (e: any) {
      console.error('[auto-updater] download error:', e)
      return { success: false, error: e?.message || String(e) }
    }
  })

  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall()
  })

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

app.on('before-quit', () => {
  try { flushDatabase() } catch {}
  for (const w of fileWatchers) { try { w.close() } catch {} }
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})
