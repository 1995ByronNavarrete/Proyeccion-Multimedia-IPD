import { ipcMain, BrowserWindow } from 'electron'
import { execFile } from 'child_process'
import { join } from 'path'
import { promisify } from 'util'
const execFileAsync = promisify(execFile)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ytSearch = require('yt-search')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const play = require('play-dl')

let ytDlpPath: string | null = null

function getYtDlpPath(): string {
  if (ytDlpPath) return ytDlpPath
  const fs = require('fs')
  const { dirname } = require('path')
  const modPath = (() => {
    try { return dirname(require.resolve('youtube-dl-exec/bin/yt-dlp')) } catch {}
    try { return dirname(require.resolve('youtube-dl-exec')) } catch {}
    return ''
  })()
  const paths = [
    join(modPath, 'bin', 'yt-dlp.exe'),
    join(__dirname, '..', '..', 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe'),
    join(__dirname, '..', '..', '..', 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe'),
    join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe'),
    join(process.resourcesPath, 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe')
  ]
  for (const p of paths) {
    try { if (fs.existsSync(p)) { ytDlpPath = p; return p } } catch {}
  }
  const fallback = join(__dirname, '..', '..', 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe')
  console.log('[yt-dlp] Binary not found, trying fallback:', fallback)
  ytDlpPath = fallback
  return fallback
}

async function ytDlpGetUrl(videoId: string, format: string, timeout = 10000): Promise<string | null> {
  const binaryPath = getYtDlpPath()
  const baseArgs = [
    '--no-warnings', '--get-url', '-f', format,
    '--extractor-args', 'youtube:player_client=android',
    `https://www.youtube.com/watch?v=${videoId}`
  ]
  const withoutCookies = execFileAsync(binaryPath, baseArgs, { timeout })
    .then(r => r.stdout?.toString().trim()).catch(() => null)
  const withCookies = execFileAsync(binaryPath, [
    ...baseArgs, '--cookies-from-browser', 'chrome'
  ], { timeout }).then(r => r.stdout?.toString().trim()).catch(() => null)

  const result = await Promise.race([withoutCookies, withCookies])
  if (result?.startsWith('http')) return result

  const all = await Promise.allSettled([withoutCookies, withCookies])
  for (const r of all) {
    if (r.status === 'fulfilled' && r.value?.startsWith('http')) return r.value
  }
  return null
}

// Fallback using play-dl when yt-dlp fails
async function playDlGetUrl(videoId: string): Promise<string | null> {
  try {
    const info = await play.video_info(`https://www.youtube.com/watch?v=${videoId}`)
    const formats = info.format
    // Buscar formato con video y audio, priorizar 720p
    const sorted = (formats as any[]).sort((a: any, b: any) => {
      const aScore = a.quality === 'medium' ? 2 : a.quality === 'hd720' ? 3 : 1
      const bScore = b.quality === 'medium' ? 2 : b.quality === 'hd720' ? 3 : 1
      return bScore - aScore
    })
    for (const f of sorted) {
      if (f.url && f.hasVideo && f.hasAudio) return f.url
    }
    return null
  } catch {
    return null
  }
}

const streamCache = new Map<string, { url: string; expires: number }>()
const CACHE_TTL = 30 * 60 * 1000

function getCachedStream(videoId: string): string | null {
  const entry = streamCache.get(videoId)
  if (entry && Date.now() < entry.expires) return entry.url
  streamCache.delete(videoId)
  return null
}

function setCachedStream(videoId: string, url: string): void {
  if (streamCache.size > 100) {
    const first = streamCache.keys().next().value
    if (first) streamCache.delete(first)
  }
  streamCache.set(videoId, { url, expires: Date.now() + CACHE_TTL })
}

let openProjector: (() => void) | null = null
let onVideoPlay: ((url: string, title: string, duration: number) => void) | null = null
let getDisplayAssignments: (() => Record<number, string[]>) | null = null

export function setOpenProjector(fn: () => void): void {
  openProjector = fn
}

export function setOnVideoPlay(fn: (url: string, title: string, duration: number) => void): void {
  onVideoPlay = fn
}

export function setGetDisplayAssignments(fn: () => Record<number, string[]>): void {
  getDisplayAssignments = fn
}

const WINS = () => BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
const MAIN = () => WINS().find((w) => w.webContents?.getURL() && !w.webContents.getURL().includes('projector'))
const ALL = (channel: string, data?: unknown) => WINS().forEach((w) => w.webContents?.send(channel, data))
const PROJECTOR_WINS = () => WINS().filter((w) => w.webContents?.getURL()?.includes('projector'))

export function registerVideoHandlers(): void {
  ipcMain.handle('ytdl:search', async (_event, query: string, maxResults = 10) => {
    try {
      const result = await ytSearch({ query, pages: 1 })
      const videos = result.videos.slice(0, maxResults)
        .filter((v: any) => v.videoId && v.title)
        .map((v: any) => ({
          id: v.videoId,
          title: v.title || '',
          channel: v.author?.name || '',
          thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
          description: (v.description || '').substring(0, 200)
        }))
      // Pre-calentar cache de los primeros 5 resultados
      const toCache = videos.slice(0, 5)
      for (const v of toCache) {
        if (!getCachedStream(v.id)) {
          resolveStreamUrl(v.id).then(url => { if (url) setCachedStream(v.id, url) }).catch(() => {})
          await new Promise(r => setTimeout(r, 50))
        }
      }
      return { success: true, data: videos }
    } catch (err) {
      return { success: false, error: String(err), data: [] }
    }
  })

  async function resolveStreamUrl(videoId: string): Promise<string | null> {
    // Probar todos los formatos en paralelo, usar el primero que responda
    const formats = ['best[height<=720]', 'best[height<=1080]', 'best[ext=mp4]', 'best', 'worst[ext=mp4]']
    const promises = formats.map(fmt =>
      ytDlpGetUrl(videoId, fmt).then(url => {
        if (url) return url
        throw url
      })
    )
    try {
      return await Promise.any(promises)
    } catch {}
    // Fallback a play-dl si yt-dlp falla
    const playUrl = await playDlGetUrl(videoId)
    return playUrl
  }

  async function getMeta(videoId: string): Promise<{ title: string; duration: number }> {
    let duration = 0
    let title = ''
    try {
      const result = await ytSearch(`https://www.youtube.com/watch?v=${videoId}`)
      if (result && typeof result === 'object') {
        if (result.seconds != null) duration = Number(result.seconds) || 0
        if (result.title) title = result.title
        if (!duration && result.videos?.length) {
          const v = result.videos[0]
          duration = v.duration ? (v.duration.seconds || Number(v.duration) || 0) : 0
          if (!title) title = v.title || ''
        }
      }
    } catch {}
    if (!title || !duration) {
      try {
        const info = await play.video_basic_info(`https://www.youtube.com/watch?v=${videoId}`)
        if (!title) title = info.video_details?.title || ''
        if (!duration) duration = info.video_details?.durationInSec || 0
      } catch {}
    }
    return { title, duration }
  }

  ipcMain.handle('ytdl:getStreamUrl', async (_event, videoId: string) => {
    const cached = getCachedStream(videoId)
    if (cached) {
      return { success: true, data: { url: cached } }
    }

    // Intentar obtener stream real con todos los formatos disponibles
    const streamUrl = await resolveStreamUrl(videoId)
    if (streamUrl) {
      setCachedStream(videoId, streamUrl)
      return { success: true, data: { url: streamUrl } }
    }

    // Fallback a embed URL solo si el stream falla completamente
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&controls=0&rel=0&showinfo=0`
    return { success: true, data: { url: embedUrl } }
  })

  ipcMain.handle('video:play', async (_event, url: string, title?: string, duration?: number) => {
    try {
      let projWins = WINS().filter((w) => w.webContents?.getURL()?.includes('projector'))

      if (projWins.length === 0 && openProjector) {
        openProjector()
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 200))
          projWins = WINS().filter((w) => w.webContents?.getURL()?.includes('projector'))
          if (projWins.length > 0) break
        }
      }

      if (onVideoPlay) onVideoPlay(url, title || 'Video', duration || 0)

      const assignments = getDisplayAssignments?.() || {}
      const allProjWins = PROJECTOR_WINS()
      for (const win of allProjWins) {
        const url2 = win.webContents?.getURL() || ''
        const match = url2.match(/displayId=(\d+)/)
        const displayId = match ? Number(match[1]) : null
        if (displayId && assignments[displayId] && !assignments[displayId].includes('video')) continue
        win.webContents.send('projector:playVideo', { url, title: title || 'Video', duration: duration || 0 })
      }

      const mw = MAIN()
      if (mw) {
        mw.webContents.send('video:progress', { currentTime: 0, duration: duration || 0, paused: false, title: title || 'Video' })
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('video:stop', () => {
    ALL('projector:stopVideo')
    const mw = MAIN()
    if (mw) mw.webContents.send('video:progress', { currentTime: 0, duration: 0, paused: true, title: '' })
  })

  ipcMain.handle('video:pause', () => {
    ALL('projector:pauseVideo')
  })

  ipcMain.handle('video:resume', () => {
    ALL('projector:resumeVideo')
  })

  ipcMain.handle('video:setVolume', (_event, volume: number) => {
    ALL('projector:volumeVideo', volume)
    const mw = MAIN()
    if (mw) mw.webContents.send('projector:volumeVideo', volume)
  })

  ipcMain.handle('video:setTime', (_event, time: number) => {
    ALL('projector:seekVideo', time)
  })

  ipcMain.handle('video:reportProgress', (_event, data) => {
    const mw = MAIN()
    if (mw) mw.webContents.send('video:progress', data)
  })

}
