import { app, BrowserWindow, screen, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, watch } from 'fs'
import { autoUpdater } from 'electron-updater'
import { initDatabase } from './database'
import { registerIpcHandlers } from './ipc-handlers'
import { registerVideoHandlers, setOpenProjector } from './video-handlers'

let mainWindow: BrowserWindow | null = null
const projectorWindows: Map<number, BrowserWindow> = new Map()

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
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    autoOpenProjectors()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
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
      autoplayPolicy: 'no-user-gesture-required'
    }
  })

  win.on('closed', () => projectorWindows.delete(displayId))
  projectorWindows.set(displayId, win)

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/projector`)
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

  ipcMain.handle('projector:sendContent', (_event, content: unknown) => {
    for (const [, win] of projectorWindows) {
      if (!win.isDestroyed()) win.webContents.send('projector:content', content)
    }
  })
}

app.whenReady().then(async () => {
  await initDatabase()
  registerIpcHandlers()
  registerMainIpcHandlers()
  registerVideoHandlers()
  setOpenProjector(() => autoOpenProjectors())

  // Create default media folders in Documents
  const docsPath = app.getPath('documents')
  const appFolder = join(docsPath, 'DesktopAppIPD')
  const musicFolder = join(appFolder, 'Música')
  const videosFolder = join(appFolder, 'Videos')
  const folders = [appFolder, musicFolder, videosFolder]
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
      if (eventType === 'rename') notifyMediaChange()
    })
    watch(videosFolder, (eventType) => {
      if (eventType === 'rename') notifyMediaChange()
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
