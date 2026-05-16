import { ipcMain, BrowserWindow } from 'electron'
import { execFile } from 'child_process'
import { join } from 'path'
import { promisify } from 'util'
const execFileAsync = promisify(execFile)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ytSearch = require('yt-search')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const play = require('play-dl')

function findYtDlpPath(): string {
  const paths = [
    join(__dirname, '..', '..', 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe'),
    join(__dirname, '..', '..', '..', 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe'),
    join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe'),
    join(process.resourcesPath, 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe')
  ]
  for (const p of paths) {
    try { if (require('fs').existsSync(p)) return p } catch {}
  }
  return 'yt-dlp'
}

async function ytDlpGetUrl(videoId: string, format: string): Promise<string | null> {
  try {
    const binaryPath = findYtDlpPath()
    const { stdout } = await execFileAsync(binaryPath, [
      '--no-warnings',
      '--get-url',
      '-f', format,
      `https://www.youtube.com/watch?v=${videoId}`
    ], { timeout: 30000 })
    const url = stdout?.toString().trim()
    return url?.startsWith('http') ? url : null
  } catch {
    return null
  }
}

let openProjector: (() => void) | null = null
let onVideoPlay: ((url: string, title: string, duration: number) => void) | null = null

export function setOpenProjector(fn: () => void): void {
  openProjector = fn
}

export function setOnVideoPlay(fn: (url: string, title: string, duration: number) => void): void {
  onVideoPlay = fn
}

const WINS = () => BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
const MAIN = () => WINS().find((w) => w.webContents?.getURL() && !w.webContents.getURL().includes('projector'))
const ALL = (channel: string, data?: unknown) => WINS().forEach((w) => w.webContents?.send(channel, data))

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
          thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/default.jpg`,
          description: (v.description || '').substring(0, 200)
        }))
      return { success: true, data: videos }
    } catch (err) {
      return { success: false, error: String(err), data: [] }
    }
  })

  ipcMain.handle('ytdl:getStreamUrl', async (_event, videoId: string) => {
    let duration = 0
    let title = ''

    // Obtener metadatos desde yt-search
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
      const result = await ytSearch(videoUrl)
      if (result && typeof result === 'object') {
        if (result.seconds != null) duration = Number(result.seconds) || 0
        if (result.title) title = result.title
        if (!duration && result.videos && result.videos.length > 0) {
          const v = result.videos[0]
          duration = v.duration ? (v.duration.seconds || Number(v.duration) || 0) : 0
          if (!title) title = v.title || ''
        }
      }
    } catch (e: any) {
      console.error('[ytdl] yt-search error:', e?.message || e)
    }

    // Intentar obtener metadatos desde play-dl
    try {
      const info = await play.video_basic_info(`https://www.youtube.com/watch?v=${videoId}`)
      if (!title) title = info.video_details?.title || ''
      if (!duration) duration = info.video_details?.durationInSec || 0
    } catch (e: any) {
      console.error('[ytdl] play-dl error:', e?.message || e)
    }

    // ── INTENTO: yt-dlp directo (child_process) con múltiples formatos ──
    const formats = ['best[ext=mp4]', 'best[height<=1080]', 'worst[ext=mp4]', 'best[height<=720]']
    for (const fmt of formats) {
      const url = await ytDlpGetUrl(videoId, fmt)
      if (url) {
        return { success: true, data: { url, title, duration } }
      }
    }

    // ── ÚLTIMO RECURSO: YouTube IFrame embed ──
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=https://www.youtube.com`
    return { success: true, data: { url: embedUrl, title, duration } }
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

      ALL('projector:playVideo', { url, title: title || 'Video', duration: duration || 0 })

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
