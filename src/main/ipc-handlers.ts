import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import { queryAll, queryOne, execute } from './database'
import { statSync, readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { extname, parse, join, basename } from 'path'
import { downloadAndSeedBible } from './bible-seed'
import { getBibleApiTranslations, getApiBibleTranslations } from './bible-source'

interface IpcResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

function ok<T>(data: T): IpcResponse<T> {
  return { success: true, data }
}

function fail(error: string): IpcResponse {
  return { success: false, error }
}

function appDocsPath(): string {
  return join(app.getPath('documents'), 'DesktopAppIPD')
}

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.opus'])
const VIDEO_EXTENSIONS = new Set(['.mp4', '.avi', '.mkv', '.mov', '.webm', '.m4v'])

function getMediaType(ext: string): 'audio' | 'video' | null {
  const lower = ext.toLowerCase()
  if (AUDIO_EXTENSIONS.has(lower)) return 'audio'
  if (VIDEO_EXTENSIONS.has(lower)) return 'video'
  return null
}

export function registerIpcHandlers(): void {
  // ── Bible IPC ──
  ipcMain.handle('bible:getTranslations', () => {
    try {
      const rows = queryAll('SELECT * FROM traducciones WHERE activa = 1')
      return ok(rows)
    } catch (err) {
      return fail(`Error al obtener traducciones: ${err}`)
    }
  })

  ipcMain.handle('bible:getBooks', (_event, translationId: number) => {
    try {
      const rows = queryAll('SELECT * FROM libros WHERE traduccion_id = ? ORDER BY orden', [translationId])
      return ok(rows)
    } catch (err) {
      return fail(`Error al obtener libros: ${err}`)
    }
  })

  ipcMain.handle('bible:getChapters', (_event, bookId: number) => {
    try {
      const rows = queryAll('SELECT DISTINCT capitulo FROM versiculos WHERE libro_id = ? ORDER BY capitulo', [bookId])
      return ok(rows)
    } catch (err) {
      return fail(`Error al obtener capítulos: ${err}`)
    }
  })

  ipcMain.handle('bible:getVerses', (_event, bookId: number, chapter: number) => {
    try {
      const rows = queryAll('SELECT * FROM versiculos WHERE libro_id = ? AND capitulo = ? ORDER BY versiculo', [bookId, chapter])
      return ok(rows)
    } catch (err) {
      return fail(`Error al obtener versículos: ${err}`)
    }
  })

  ipcMain.handle('bible:searchReference', (_event, query: string, translationId?: number) => {
    try {
      const match = query.match(/^(\d?\s*[a-z\u00E0-\u00FC]+)\s*(\d+)(?:\s*[.:,]\s*(\d+))?$/i)
      if (!match) return ok([])

      const bookPattern = `%${match[1].trim()}%`
      const chapter = parseInt(match[2], 10)
      const verse = match[3] ? parseInt(match[3], 10) : null
      const transFilter = translationId ? `AND l.traduccion_id = ${translationId}` : ''

      let sql, params
      if (verse) {
        sql = `SELECT v.*, l.nombre as libro, t.abreviatura as traduccion
               FROM versiculos v
               JOIN libros l ON v.libro_id = l.id
               JOIN traducciones t ON l.traduccion_id = t.id
               WHERE l.nombre LIKE ? AND v.capitulo = ? AND v.versiculo = ? ${transFilter}
               LIMIT 5`
        params = [bookPattern, chapter, verse]
      } else {
        sql = `SELECT v.*, l.nombre as libro, t.abreviatura as traduccion
               FROM versiculos v
               JOIN libros l ON v.libro_id = l.id
               JOIN traducciones t ON l.traduccion_id = t.id
               WHERE l.nombre LIKE ? AND v.capitulo = ? ${transFilter}
               LIMIT 50`
        params = [bookPattern, chapter]
      }
      const rows = queryAll(sql, params)
      return ok(rows)
    } catch (err) {
      return fail(`Error al buscar referencia: ${err}`)
    }
  })

  ipcMain.handle('bible:search', (_event, query: string, translationId?: number) => {
    try {
      const transFilter = translationId ? `AND l.traduccion_id = ${translationId}` : ''
      const rows = queryAll(
        `SELECT v.*, l.nombre as libro, l.traduccion_id, t.abreviatura as traduccion
         FROM versiculos v
         JOIN libros l ON v.libro_id = l.id
         JOIN traducciones t ON l.traduccion_id = t.id
         WHERE v.texto LIKE ? ${transFilter} LIMIT 50`,
        [`%${query}%`]
      )
      return ok(rows)
    } catch (err) {
      return fail(`Error al buscar: ${err}`)
    }
  })

  ipcMain.handle('bible:downloadData', async (event, abbreviation: string, nombre: string, source: 'bible-api' | 'api-bible', apiKey: string) => {
    try {
      await downloadAndSeedBible(abbreviation, nombre, source, apiKey, (completed, total, bookName) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win && !win.isDestroyed()) {
          win.webContents.send('bible:downloadProgress', {
            completed,
            total,
            bookName: bookName || '',
            percent: Math.round((completed / total) * 100)
          })
        }
      })
      return ok(null)
    } catch (err) {
      return fail(`Error al descargar biblia: ${err}`)
    }
  })

  ipcMain.handle('bible:hasData', () => {
    try {
      const row = queryOne('SELECT COUNT(*) as count FROM traducciones')
      return ok({ hasData: (row?.count as number) > 0 })
    } catch {
      return ok({ hasData: false })
    }
  })

  ipcMain.handle('bible:getAvailableSources', async () => {
    try {
      const sources = await getBibleApiTranslations()
      return ok(sources)
    } catch (err) {
      return fail(`Error al obtener fuentes: ${err}`)
    }
  })

  ipcMain.handle('bible:getApiBibleTranslations', async (_event, apiKey: string) => {
    try {
      const sources = await getApiBibleTranslations(apiKey)
      return ok(sources)
    } catch (err) {
      return fail(`Error al obtener traducciones de API.Bible: ${err}`)
    }
  })

  // ── Local Media IPC ──
  ipcMain.handle('medialocal:importFile', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Multimedia', extensions: ['mp3', 'wav', 'flac', 'aac', 'mp4', 'avi', 'mkv', 'mov', 'webm'] },
          { name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus'] },
          { name: 'Video', extensions: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'm4v'] }
        ]
      })

      if (result.canceled || !result.filePaths.length) return ok([])

      const imported: unknown[] = []

      for (const filePath of result.filePaths) {
        const ext = extname(filePath)
        const type = getMediaType(ext)
        if (!type) continue

        const stats = statSync(filePath)
        const name = parse(filePath).name

        try {
          execute(
            'INSERT INTO medios_locales (nombre, ruta_archivo, tipo, formato, tamano_bytes) VALUES (?, ?, ?, ?, ?)',
            [name, filePath, type, ext.slice(1), stats.size]
          )
          imported.push({ nombre: name, ruta_archivo: filePath, tipo: type, formato: ext.slice(1) })
        } catch {
          // Skip duplicates (UNIQUE constraint on ruta_archivo)
        }
      }

      return ok(imported)
    } catch (err) {
      return fail(`Error al importar archivos: ${err}`)
    }
  })

  ipcMain.handle('medialocal:openFolder', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      })

      if (result.canceled || !result.filePaths.length) return ok(null)

      const folderPath = result.filePaths[0]
      const { readdirSync } = await import('fs')
      const { join } = await import('path')

      const files = readdirSync(folderPath)
      const mediaFiles: { nombre: string; ruta: string; tipo: string; tamano: number }[] = []

      for (const file of files) {
        const fullPath = join(folderPath, file)
        try {
          const stats = statSync(fullPath)
          if (!stats.isFile()) continue
          const ext = extname(file)
          const type = getMediaType(ext)
          if (!type) continue
          mediaFiles.push({
            nombre: parse(file).name,
            ruta: fullPath,
            tipo: type,
            tamano: stats.size
          })
        } catch {
          continue
        }
      }

      return ok({ ruta: folderPath, archivos: mediaFiles })
    } catch (err) {
      return fail(`Error al abrir carpeta: ${err}`)
    }
  })

  ipcMain.handle('medialocal:getBiblioteca', () => {
    try {
      const docsPath = app.getPath('documents')
      const appFolder = join(docsPath, 'DesktopAppIPD')
      const musicFolder = join(appFolder, 'Música')
      const videosFolder = join(appFolder, 'Videos')

      const result: { musica: { nombre: string; ruta: string; tamano: number }[]; videos: { nombre: string; ruta: string; tamano: number }[] } = { musica: [], videos: [] }

      const AUDIO_EXTS = new Set(['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.opus', '.wma'])
      const VIDEO_EXTS = new Set(['.mp4', '.avi', '.mkv', '.mov', '.webm', '.m4v', '.wmv', '.flv'])

      const scanFolder = (folderPath: string, target: 'musica' | 'videos') => {
        if (!existsSync(folderPath)) return
        const files = readdirSync(folderPath)
        for (const file of files) {
          const fullPath = join(folderPath, file)
          try {
            const stats = statSync(fullPath)
            if (!stats.isFile()) continue
            const ext = extname(file).toLowerCase()
            if ((target === 'musica' && AUDIO_EXTS.has(ext)) || (target === 'videos' && VIDEO_EXTS.has(ext))) {
              result[target].push({ nombre: parse(file).name, ruta: fullPath, tamano: stats.size })
            }
          } catch { continue }
        }
      }

      scanFolder(musicFolder, 'musica')
      scanFolder(videosFolder, 'videos')

      return ok({ ruta: appFolder, musica: result.musica, videos: result.videos })
    } catch (err) {
      return fail(`Error al leer biblioteca: ${err}`)
    }
  })

  ipcMain.handle('medialocal:getAll', () => {
    try {
      const rows = queryAll('SELECT * FROM medios_locales ORDER BY fecha_agregado DESC')
      return ok(rows)
    } catch (err) {
      return fail(`Error al obtener medios: ${err}`)
    }
  })

  ipcMain.handle('medialocal:delete', (_event, id: number) => {
    try {
      execute('DELETE FROM medios_locales WHERE id = ?', [id])
      return ok(null)
    } catch (err) {
      return fail(`Error al eliminar medio: ${err}`)
    }
  })

  ipcMain.handle('medialocal:toggleFavorite', (_event, id: number) => {
    try {
      execute('UPDATE medios_locales SET favorito = NOT favorito WHERE id = ?', [id])
      return ok(null)
    } catch (err) {
      return fail(`Error al cambiar favorito: ${err}`)
    }
  })

  ipcMain.handle('medialocal:createPlaylist', (_event, name: string) => {
    try {
      const result = execute('INSERT INTO listas_reproduccion (nombre) VALUES (?)', [name])
      return ok({ id: result.lastInsertRowid, nombre: name })
    } catch (err) {
      return fail(`Error al crear lista: ${err}`)
    }
  })

  ipcMain.handle('medialocal:getPlaylists', () => {
    try {
      const rows = queryAll('SELECT * FROM listas_reproduccion ORDER BY fecha_creacion DESC')
      return ok(rows)
    } catch (err) {
      return fail(`Error al obtener listas: ${err}`)
    }
  })

  ipcMain.handle('medialocal:addToPlaylist', (_event, playlistId: number, mediaId: number) => {
    try {
      const maxOrder = queryOne('SELECT COALESCE(MAX(orden), 0) + 1 as next FROM lista_medios WHERE lista_id = ?', [playlistId])
      const nextOrder = (maxOrder?.next as number) ?? 1
      execute('INSERT INTO lista_medios (lista_id, medio_id, orden) VALUES (?, ?, ?)', [playlistId, mediaId, nextOrder])
      return ok(null)
    } catch (err) {
      return fail(`Error al agregar a lista: ${err}`)
    }
  })

  // ── App IPC ──
  ipcMain.handle('app:selectAndSaveLogo', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] }
        ]
      })

      if (result.canceled || !result.filePaths.length) return ok(null)

      const filePath = result.filePaths[0]
      const ext = extname(filePath).toLowerCase()
      const buffer = readFileSync(filePath)
      const docsPath = appDocsPath()
      if (!existsSync(docsPath)) mkdirSync(docsPath, { recursive: true })
      const logoPath = join(docsPath, 'logo.png')

      // Save as PNG
      writeFileSync(logoPath, buffer)

      // If it's not PNG, save with original extension too
      const extPath = join(docsPath, `logo${ext}`)
      if (ext !== '.png') writeFileSync(extPath, buffer)

      const base64 = buffer.toString('base64')
      const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : ext === '.bmp' ? 'image/bmp' : 'image/png'
      const dataUrl = `data:${mime};base64,${base64}`

      return ok({ dataUrl, nombre: basename(filePath) })
    } catch (err) {
      return fail(`Error al guardar logo: ${err}`)
    }
  })

  ipcMain.handle('app:getLogo', () => {
    try {
      const logoPath = join(appDocsPath(), 'logo.png')
      if (!existsSync(logoPath)) return ok(null)

      const ext = extname(logoPath).toLowerCase()
      const buffer = readFileSync(logoPath)
      const base64 = buffer.toString('base64')
      const mime = 'image/png'
      const dataUrl = `data:${mime};base64,${base64}`

      return ok({ dataUrl, nombre: 'logo.png' })
    } catch {
      return ok(null)
    }
  })

  ipcMain.handle('app:getConfig', () => {
    try {
      const configPath = join(appDocsPath(), 'config.json')
      if (!existsSync(configPath)) return ok({})
      const raw = readFileSync(configPath, 'utf-8')
      return ok(JSON.parse(raw))
    } catch {
      return ok({})
    }
  })

  ipcMain.handle('app:saveConfig', (_event, config: Record<string, unknown>) => {
    try {
      const docsPath = appDocsPath()
      if (!existsSync(docsPath)) mkdirSync(docsPath, { recursive: true })
      const configPath = join(docsPath, 'config.json')
      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
      return ok(null)
    } catch (err) {
      return fail(`Error al guardar configuración: ${err}`)
    }
  })
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:quit', () => {
    app.quit()
  })
}
