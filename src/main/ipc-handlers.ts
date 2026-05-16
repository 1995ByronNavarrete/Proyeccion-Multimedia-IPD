import { ipcMain, dialog, app, BrowserWindow, shell } from 'electron'
import { statSync, readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { extname, parse, join, basename } from 'path'
import mammoth from 'mammoth'
import pdfjs from 'pdfjs-dist'
import { queryAll, queryOne, execute, noAccent } from './database'
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

const IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml'
}

function getMime(ext: string): string {
  return IMAGE_MIME[ext.toLowerCase()] || 'image/png'
}

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'])

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.opus'])
const VIDEO_EXTENSIONS = new Set(['.mp4', '.avi', '.mkv', '.mov', '.webm', '.m4v'])
const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.rtf', '.odt', '.odp', '.ods', '.csv'])

function getMediaType(ext: string): 'audio' | 'video' | 'document' | null {
  const lower = ext.toLowerCase()
  if (AUDIO_EXTENSIONS.has(lower)) return 'audio'
  if (VIDEO_EXTENSIONS.has(lower)) return 'video'
  if (DOCUMENT_EXTENSIONS.has(lower)) return 'document'
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

      const bookClean = `%${noAccent(match[1].trim())}%`

      let sql, params
      if (verse) {
        sql = `SELECT v.*, l.nombre as libro, t.abreviatura as traduccion
               FROM versiculos v
               JOIN libros l ON v.libro_id = l.id
               JOIN traducciones t ON l.traduccion_id = t.id
               WHERE noacct(l.nombre) LIKE ? AND v.capitulo = ? AND v.versiculo = ? ${translationId ? 'AND l.traduccion_id = ?' : ''}
               LIMIT 5`
        params = translationId ? [bookClean, chapter, verse, translationId] : [bookClean, chapter, verse]
      } else {
        sql = `SELECT v.*, l.nombre as libro, t.abreviatura as traduccion
               FROM versiculos v
               JOIN libros l ON v.libro_id = l.id
               JOIN traducciones t ON l.traduccion_id = t.id
               WHERE noacct(l.nombre) LIKE ? AND v.capitulo = ? ${translationId ? 'AND l.traduccion_id = ?' : ''}
               LIMIT 50`
        params = translationId ? [bookClean, chapter, translationId] : [bookClean, chapter]
      }
      const rows = queryAll(sql, params)
      return ok(rows)
    } catch (err) {
      return fail(`Error al buscar referencia: ${err}`)
    }
  })

  ipcMain.handle('bible:search', (_event, query: string, translationId?: number) => {
    try {
      const clean = noAccent(query)
      const sql = `SELECT v.*, l.nombre as libro, l.traduccion_id, t.abreviatura as traduccion
         FROM versiculos v
         JOIN libros l ON v.libro_id = l.id
         JOIN traducciones t ON l.traduccion_id = t.id
         WHERE noacct(v.texto) LIKE ? ${translationId ? 'AND l.traduccion_id = ?' : ''} LIMIT 50`
      const params = translationId ? [`%${clean}%`, translationId] : [`%${clean}%`]
      const rows = queryAll(sql, params)
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

  ipcMain.handle('medialocal:deleteFile', async (_event, filePath: string) => {
    try {
      if (existsSync(filePath)) unlinkSync(filePath)
      return ok(null)
    } catch (err) {
      return fail(`Error al eliminar: ${err}`)
    }
  })

  ipcMain.handle('medialocal:importFiles', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus'] },
          { name: 'Video', extensions: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'm4v'] },
          { name: 'Documentos', extensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf', 'odt', 'odp', 'ods', 'csv'] },
          { name: 'Todos', extensions: ['*'] }
        ]
      })
      if (result.canceled || !result.filePaths.length) return ok({ imported: 0 })

      const docsPath = appDocsPath()
      const musicFolder = join(docsPath, 'Música')
      const videosFolder = join(docsPath, 'Videos')
      const documentosFolder = join(docsPath, 'Documentos')
      if (!existsSync(musicFolder)) mkdirSync(musicFolder, { recursive: true })
      if (!existsSync(videosFolder)) mkdirSync(videosFolder, { recursive: true })
      if (!existsSync(documentosFolder)) mkdirSync(documentosFolder, { recursive: true })

      let imported = 0
      for (const fp of result.filePaths) {
        try {
          const ext = extname(fp).toLowerCase()
          const isAudio = AUDIO_EXTENSIONS.has(ext)
          const isVideo = VIDEO_EXTENSIONS.has(ext)
          const isDoc = DOCUMENT_EXTENSIONS.has(ext)
          if (!isAudio && !isVideo && !isDoc) continue
          const destFolder = isAudio ? musicFolder : isVideo ? videosFolder : documentosFolder
          const destPath = join(destFolder, basename(fp))
          writeFileSync(destPath, readFileSync(fp))
          imported++
        } catch {}
      }
      return ok({ imported })
    } catch (err) {
      return fail(`Error al importar: ${err}`)
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
      const documentosFolder = join(appFolder, 'Documentos')

      const result: { musica: { nombre: string; ruta: string; tamano: number }[]; videos: { nombre: string; ruta: string; tamano: number }[]; documentos: { nombre: string; ruta: string; tamano: number }[] } = { musica: [], videos: [], documentos: [] }

      const AUDIO_EXTS = new Set(['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.opus', '.wma'])
      const VIDEO_EXTS = new Set(['.mp4', '.avi', '.mkv', '.mov', '.webm', '.m4v', '.wmv', '.flv'])
      const DOC_EXTS = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.rtf', '.odt', '.odp', '.ods', '.csv'])

      const scanFolder = (folderPath: string, target: 'musica' | 'videos' | 'documentos') => {
        if (!existsSync(folderPath)) return
        const files = readdirSync(folderPath)
        for (const file of files) {
          const fullPath = join(folderPath, file)
          try {
            const stats = statSync(fullPath)
            if (!stats.isFile()) continue
            const ext = extname(file).toLowerCase()
            if (target === 'musica' && AUDIO_EXTS.has(ext)) result.musica.push({ nombre: parse(file).name, ruta: fullPath, tamano: stats.size })
            else if (target === 'videos' && VIDEO_EXTS.has(ext)) result.videos.push({ nombre: parse(file).name, ruta: fullPath, tamano: stats.size })
            else if (target === 'documentos' && DOC_EXTS.has(ext)) result.documentos.push({ nombre: parse(file).name, ruta: fullPath, tamano: stats.size })
          } catch { continue }
        }
      }

      scanFolder(musicFolder, 'musica')
      scanFolder(videosFolder, 'videos')
      scanFolder(documentosFolder, 'documentos')

      return ok({ ruta: appFolder, musica: result.musica, videos: result.videos, documentos: result.documentos })
    } catch (err) {
      return fail(`Error al leer biblioteca: ${err}`)
    }
  })

  ipcMain.handle('medialocal:getAll', () => {
    try {
      let rows = queryAll('SELECT * FROM medios_locales ORDER BY fecha_agregado DESC')
      rows = rows.filter((r: any) => {
        if (!r.ruta_archivo) return false
        try { return existsSync(r.ruta_archivo as string) } catch { return false }
      })
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

  // ── Anuncios IPC ──
  ipcMain.handle('anuncios:getAll', () => {
    try {
      const rows = queryAll('SELECT * FROM anuncios ORDER BY fecha_creacion DESC')
      return ok(rows)
    } catch (err) {
      return fail(`Error al obtener anuncios: ${err}`)
    }
  })

  ipcMain.handle('anuncios:create', (_event, texto: string, animacion: string) => {
    try {
      const result = execute('INSERT INTO anuncios (texto, animacion) VALUES (?, ?)', [texto, animacion])
      return ok({ id: result.lastInsertRowid, texto, animacion })
    } catch (err) {
      return fail(`Error al crear anuncio: ${err}`)
    }
  })

  ipcMain.handle('anuncios:delete', (_event, id: number) => {
    try {
      execute('DELETE FROM anuncios WHERE id = ?', [id])
      return ok(null)
    } catch (err) {
      return fail(`Error al eliminar anuncio: ${err}`)
    }
  })

  ipcMain.handle('anuncios:saveAnim', (_event, animacion: string) => {
    try {
      const docsPath = appDocsPath()
      if (!existsSync(docsPath)) mkdirSync(docsPath, { recursive: true })
      const configPath = join(docsPath, 'config.json')
      let cfg: Record<string, unknown> = {}
      if (existsSync(configPath)) {
        cfg = JSON.parse(readFileSync(configPath, 'utf-8'))
      }
      cfg.animAnuncios = animacion
      writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8')
      return ok(null)
    } catch (err) {
      return fail(`Error al guardar animación: ${err}`)
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
      const buffer = readFileSync(filePath)
      const docsPath = appDocsPath()
      if (!existsSync(docsPath)) mkdirSync(docsPath, { recursive: true })
      const logoPath = join(docsPath, 'logo.png')

      writeFileSync(logoPath, buffer)

      const ext = extname(filePath).toLowerCase()
      if (ext !== '.png') {
        const extPath = join(docsPath, `logo${ext}`)
        writeFileSync(extPath, buffer)
      }

      return ok({ filePath: logoPath, nombre: basename(filePath) })
    } catch (err) {
      return fail(`Error al guardar logo: ${err}`)
    }
  })

  ipcMain.handle('app:getLogo', () => {
    try {
      const logoPath = join(appDocsPath(), 'logo.png')
      if (!existsSync(logoPath)) return ok(null)
      return ok({ filePath: logoPath, nombre: 'logo.png' })
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

  ipcMain.handle('app:getFondos', () => {
    try {
      const fondosPath = join(app.getPath('documents'), 'DesktopAppIPD', 'Fondos')
      if (!existsSync(fondosPath)) return ok([])
      const files = readdirSync(fondosPath)
      const images: { id: string; name: string; filePath: string }[] = []
      for (const file of files) {
        const ext = extname(file).toLowerCase()
        if (!IMAGE_EXTS.has(ext)) continue
        const fullPath = join(fondosPath, file)
        try {
          const stats = statSync(fullPath)
          if (!stats.isFile()) continue
          images.push({
            id: file,
            name: parse(file).name,
            filePath: fullPath
          })
        } catch { continue }
      }
      return ok(images)
    } catch (err) {
      return fail(`Error al leer Fondos: ${err}`)
    }
  })

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:quit', () => {
    app.quit()
  })

  // ── Video Logo (logoEnVideo) ──
  ipcMain.handle('app:selectAndSaveVideoLogo', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] }]
      })
      if (result.canceled || !result.filePaths.length) return ok(null)
      const filePath = result.filePaths[0]
      const buffer = readFileSync(filePath)
      const ext = extname(filePath).toLowerCase()
      const logoFolder = join(appDocsPath(), 'logoEnVideo')
      if (!existsSync(logoFolder)) mkdirSync(logoFolder, { recursive: true })
      const logoPath = join(logoFolder, `logo${ext}`)
      writeFileSync(logoPath, buffer)
      return ok({ filePath: logoPath, nombre: basename(filePath) })
    } catch (err) {
      return fail(`Error al guardar logo de video: ${err}`)
    }
  })

  ipcMain.handle('app:getVideoLogo', () => {
    try {
      const logoFolder = join(appDocsPath(), 'logoEnVideo')
      if (!existsSync(logoFolder)) return ok(null)
      const files = readdirSync(logoFolder).filter((f) => /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(f))
      if (!files.length) return ok(null)
      const logoPath = join(logoFolder, files[0])
      return ok({ filePath: logoPath, nombre: files[0] })
    } catch {
      return ok(null)
    }
  })

  // ── Tareas de imágenes ──
  ipcMain.handle('tarea:create', (_event, nombre: string) => {
    try {
      const result = execute('INSERT INTO tareas_imagenes (nombre) VALUES (?)', [nombre])
      return ok({ id: result.lastInsertRowid, nombre })
    } catch (err) {
      return fail(`Error al crear tarea: ${err}`)
    }
  })

  ipcMain.handle('tarea:getAll', () => {
    try {
      const rows = queryAll(`SELECT t.*, (SELECT COUNT(*) FROM tarea_imagenes WHERE tarea_id = t.id) as imagen_count FROM tareas_imagenes t ORDER BY t.fecha_creacion DESC`)
      return ok(rows)
    } catch (err) {
      return fail(`Error al obtener tareas: ${err}`)
    }
  })

  ipcMain.handle('tarea:delete', (_event, id: number) => {
    try {
      execute('DELETE FROM tarea_imagenes WHERE tarea_id = ?', [id])
      execute('DELETE FROM tareas_imagenes WHERE id = ?', [id])
      return ok(null)
    } catch (err) {
      return fail(`Error al eliminar tarea: ${err}`)
    }
  })

  ipcMain.handle('tarea:addImage', async (_event, tareaId: number) => {
    try {
      const tareasFolder = join(appDocsPath(), 'Tareas')
      if (!existsSync(tareasFolder)) mkdirSync(tareasFolder, { recursive: true })

      const result = await dialog.showOpenDialog({
        defaultPath: tareasFolder,
        properties: ['openFile'],
        filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }]
      })
      if (result.canceled || !result.filePaths.length) return ok(null)

      const filePath = result.filePaths[0]
      const name = parse(filePath).name
      const destName = `${Date.now()}_${basename(filePath)}`
      const destPath = join(tareasFolder, destName)
      writeFileSync(destPath, readFileSync(filePath))

      const dbResult = execute('INSERT INTO tarea_imagenes (tarea_id, ruta_archivo, nombre) VALUES (?, ?, ?)', [tareaId, destPath, name])

      return ok({ id: dbResult.lastInsertRowid, nombre: name, filePath: destPath })
    } catch (err) {
      return fail(`Error al agregar imagen: ${err}`)
    }
  })

  ipcMain.handle('tarea:getImages', (_event, tareaId: number) => {
    try {
      const rows = queryAll('SELECT * FROM tarea_imagenes WHERE tarea_id = ? ORDER BY fecha_agregado DESC', [tareaId])
      const images: { id: number; nombre: string; filePath: string }[] = []
      for (const row of rows) {
        const ruta = row.ruta_archivo as string
        if (!ruta || !existsSync(ruta)) continue
        const ext = extname(ruta).toLowerCase()
        if (!IMAGE_EXTS.has(ext)) continue
        try {
          images.push({ id: row.id as number, nombre: row.nombre as string, filePath: ruta })
        } catch { continue }
      }
      return ok(images)
    } catch (err) {
      return fail(`Error al obtener imágenes: ${err}`)
    }
  })

  ipcMain.handle('tarea:deleteImage', (_event, id: number) => {
    try {
      const row = queryOne('SELECT ruta_archivo FROM tarea_imagenes WHERE id = ?', [id])
      execute('DELETE FROM tarea_imagenes WHERE id = ?', [id])
      if (row?.ruta_archivo) {
        try { unlinkSync(row.ruta_archivo as string) } catch {}
      }
      return ok(null)
    } catch (err) {
      return fail(`Error al eliminar imagen: ${err}`)
    }
  })

  // Seleccionar una imagen y devolver data URL (abre en la carpeta Fondos)
  ipcMain.handle('app:openDocument', async (_event, filePath: string) => {
    try {
      let decodedPath = decodeURIComponent(filePath.replace(/^file:\/\//, ''))
      if (process.platform === 'win32' && decodedPath.startsWith('/')) {
        decodedPath = decodedPath.slice(1)
      }
      await shell.openPath(decodedPath)
      return ok(null)
    } catch (err) {
      return fail(`Error al abrir documento: ${err}`)
    }
  })

  const DOC_CSS = `* { margin: 0; padding: 0; box-sizing: border-box; }
.doc-content {
  font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  color: #111;
  line-height: 1.5;
  padding: 5% 0;
  width: 80%;
  max-width: 1200px;
  margin: 0 auto;
}
.doc-content p {
  margin-bottom: 1.4em;
  font-size: clamp(1.6rem, 2.5vw, 3rem);
  text-align: left;
  letter-spacing: 0.01em;
  font-weight: 400;
  color: #1a1a1a;
}
.doc-content h1, .doc-content h2, .doc-content h3, .doc-content h4 {
  font-weight: 700;
  margin-top: 2em;
  margin-bottom: 0.8em;
  line-height: 1.15;
  color: #000;
}
.doc-content h1 { font-size: clamp(2.4rem, 4vw, 4.5rem); text-align: center; letter-spacing: -0.02em; }
.doc-content h2 { font-size: clamp(1.8rem, 3vw, 3.2rem); }
.doc-content h3 { font-size: clamp(1.5rem, 2.4vw, 2.6rem); }
.doc-content img {
  display: block;
  max-width: 85%;
  height: auto;
  margin: 2.5em auto;
  border-radius: 12px;
  box-shadow: 0 6px 32px rgba(0,0,0,0.12);
}
.doc-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 2em 0;
  font-size: clamp(1.2rem, 1.8vw, 2.2rem);
}
.doc-content td, .doc-content th {
  border: 1px solid #d0d0d0;
  padding: 0.8em 1.2em;
  text-align: left;
}
.doc-content th { background: #f0f0f0; font-weight: 600; }
.doc-content ul, .doc-content ol {
  margin: 1em 0 1.5em 2.5em;
  font-size: clamp(1.6rem, 2.5vw, 3.2rem);
  line-height: 1.6;
}
.doc-content li { margin-bottom: 0.4em; }
.doc-content pre {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: clamp(1rem, 1.5vw, 1.8rem);
  background: #f5f5f5;
  padding: 1.5em;
  border-radius: 10px;
  overflow-x: auto;
  margin: 1.5em 0;
  white-space: pre-wrap;
  border: 1px solid #e8e8e8;
}
.doc-content blockquote {
  border-left: 4px solid #2563eb;
  padding: 1.2em 2em;
  margin: 1.8em 0;
  background: #f8faff;
  font-style: italic;
  color: #2a2a2a;
  font-size: clamp(1.4rem, 2.2vw, 2.8rem);
  border-radius: 0 8px 8px 0;
}
.doc-content hr {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, #ccc, transparent);
  margin: 3em 0;
}
.pdf-toc {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 2.5em 3em;
  margin-bottom: 3em;
}
.pdf-toc h2 {
  text-align: center;
  font-size: clamp(1.6rem, 2.5vw, 3rem);
  color: #1e40af;
  letter-spacing: 0.02em;
  margin-top: 0;
  margin-bottom: 1.5em;
  font-weight: 600;
}
.pdf-toc ol { list-style: none; margin: 0; padding: 0; }
.pdf-toc li {
  border-bottom: 1px solid #e8ecf0;
  padding: 0.7em 0;
  margin: 0;
}
.pdf-toc li:last-child { border-bottom: none; }
.pdf-toc a {
  display: flex;
  align-items: center;
  gap: 1em;
  text-decoration: none;
  color: #1a1a1a;
  padding: 0.4em 0.6em;
  border-radius: 8px;
  transition: background 0.2s;
}
.pdf-toc a:hover { background: #eef2ff; }
.pdf-toc .page-num {
  font-weight: 700;
  font-size: clamp(1.1rem, 1.6vw, 2rem);
  color: #2563eb;
  min-width: 2.5em;
  text-align: center;
  background: #eef2ff;
  border-radius: 8px;
  padding: 0.2em 0.5em;
}
.pdf-toc .page-title {
  font-size: clamp(1.1rem, 1.6vw, 2rem);
  color: #333;
}
.pdf-pages { margin-top: 1.5em; }
.pdf-page {
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 16px;
  padding: 3em 3.5em;
  margin-bottom: 2.5em;
  box-shadow: 0 2px 16px rgba(0,0,0,0.05);
  position: relative;
}
.pdf-page .page-header {
  position: absolute;
  top: 1.5em;
  right: 2em;
  font-weight: 600;
  font-size: clamp(0.9rem, 1.2vw, 1.5rem);
  color: #2563eb;
  background: #eef2ff;
  padding: 0.3em 0.9em;
  border-radius: 20px;
}
.pdf-page p {
  font-size: clamp(1.4rem, 2.2vw, 2.8rem);
  line-height: 1.6;
  margin-bottom: 0.8em;
}
.pdf-page p:last-child { margin-bottom: 0; }`

  ipcMain.handle('app:convertDocumentToHtml', async (_event, filePath: string) => {
    try {
      let decodedPath = decodeURIComponent(filePath.replace(/^file:\/\//, ''))
      if (process.platform === 'win32' && decodedPath.startsWith('/')) {
        decodedPath = decodedPath.slice(1)
      }
      const ext = extname(decodedPath).toLowerCase()
      let bodyHtml = ''
      if (ext === '.pdf') {
        pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.js')
        const data = new Uint8Array(readFileSync(decodedPath))
        const doc = await pdfjs.getDocument({ data }).promise
        const totalPages = doc.numPages
        const toc: string[] = []
        const pages: string[] = []
        for (let i = 1; i <= totalPages; i++) {
          const page = await doc.getPage(i)
          const content = await page.getTextContent()
          const items = content.items.filter((item: any) => 'str' in item).map((item: any) => item.str)
          const text = items.join(' ').replace(/\s+/g, ' ').trim()
          if (text) {
            const firstLine = text.split(/[.:!?]/)[0].slice(0, 80).trim()
            toc.push(`<li><a href="#page-${i}"><span class="page-num">${i}</span><span class="page-title">${firstLine.replace(/</g, '&lt;')}</span></a></li>`)
            const paragraphs = text.split(/\n{2,}/).map((p: string) => p.replace(/\n/g, ' ').trim()).filter(Boolean)
            const body = paragraphs.map((p: string) => `<p>${p.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('')
            pages.push(`<div id="page-${i}" class="pdf-page"><div class="page-header">${i}</div>${body}</div>`)
          }
        }
        const tocHtml = `<div class="pdf-toc"><h2>Índice</h2><ol>${toc.join('')}</ol></div>`
        bodyHtml = tocHtml + '<div class="pdf-pages">' + pages.join('') + '</div>'
        if (!bodyHtml) bodyHtml = '<p>No se pudo extraer texto de este PDF</p>'
      } else if (ext === '.docx') {
        const result = await mammoth.convertToHtml({ path: decodedPath })
        bodyHtml = result.value
      } else if (ext === '.doc') {
        const result = await mammoth.extractRawText({ path: decodedPath })
        const escaped = result.value.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '</p><p>')
        bodyHtml = `<p>${escaped}</p>`
      } else if (ext === '.txt' || ext === '.rtf') {
        const content = readFileSync(decodedPath, 'utf-8')
        const escaped = content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '</p><p>')
        bodyHtml = `<p>${escaped}</p>`
      } else {
        return fail('Formato no soportado para vista previa')
      }
      return ok({ html: bodyHtml, css: DOC_CSS })
    } catch (err) {
      return fail(`Error al convertir documento: ${err}`)
    }
  })

  ipcMain.handle('app:readImageAsDataUrl', async (_event, filePath: string) => {
    try {
      const buffer = readFileSync(filePath)
      const ext = extname(filePath).toLowerCase()
      const mime = getMime(ext)
      return ok({ dataUrl: `data:${mime};base64,${buffer.toString('base64')}` })
    } catch { return ok(null) }
  })

  ipcMain.handle('app:readFileAsDataUrl', async (_event, filePath: string) => {
    try {
      const buffer = readFileSync(filePath)
      const ext = extname(filePath).toLowerCase()
      const mime: Record<string, string> = {
        '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac',
        '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
        '.opus': 'audio/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm'
      }
      return ok({ dataUrl: `data:${mime[ext] || 'audio/mpeg'};base64,${buffer.toString('base64')}` })
    } catch { return ok(null) }
  })

  ipcMain.handle('app:saveEditedImage', async (_event, dataUrl: string, name: string) => {
    try {
      const fondosPath = join(appDocsPath(), 'Fondos')
      if (!existsSync(fondosPath)) mkdirSync(fondosPath, { recursive: true })
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64, 'base64')
      const fileName = `${name.replace(/\.[^.]+$/, '')}-edit-${Date.now()}.png`
      const filePath = join(fondosPath, fileName)
      writeFileSync(filePath, buffer)
      return ok({ filePath, nombre: fileName })
    } catch (err) {
      return fail(`Error al guardar imagen: ${err}`)
    }
  })

  ipcMain.handle('app:pickImage', async () => {
    try {
      const fondosPath = join(appDocsPath(), 'Fondos')
      if (!existsSync(fondosPath)) mkdirSync(fondosPath, { recursive: true })
      const result = await dialog.showOpenDialog({
        defaultPath: fondosPath,
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }]
      })
      if (result.canceled || !result.filePaths.length) return ok(null)
      const files = result.filePaths.map(fp => ({ filePath: fp, nombre: basename(fp) }))
      return ok(files)
    } catch {
      return ok(null)
    }
  })
}
