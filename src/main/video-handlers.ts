import { ipcMain, BrowserWindow } from 'electron'

let openProjector: (() => void) | null = null

export function setOpenProjector(fn: () => void): void {
  openProjector = fn
}

const WINS = () => BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
const MAIN = () => WINS().find((w) => w.webContents?.getURL() && !w.webContents.getURL().includes('projector'))
const ALL = (channel: string, data?: unknown) => WINS().forEach((w) => w.webContents?.send(channel, data))

export function registerVideoHandlers(): void {
  const ytSearch = require('yt-search')

  ipcMain.handle('ytdl:search', async (_event, query: string, maxResults = 10) => {
    try {
      const result = await ytSearch({ query, pages: 1 })
      const videos = result.videos.slice(0, maxResults).map((v: any) => ({
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
      // yt-search devuelve VideoMetadataResult cuando se le pasa una URL
      if (result && typeof result === 'object') {
        if (result.seconds != null) {
          duration = Number(result.seconds) || 0
        }
        if (result.title) title = result.title
        // Si tiene estructura de SearchResult (videos array)
        if (!duration && result.videos && result.videos.length > 0) {
          const v = result.videos[0]
          duration = v.duration ? (v.duration.seconds || Number(v.duration) || 0) : 0
          if (!title) title = v.title || ''
        }
      }
    } catch (e: any) {
      console.error('[ytdl] yt-search error:', e?.message || e)
    }

    // Intentar obtener stream URL desde play-dl
    try {
      const play = require('play-dl')
      const info = await play.video_basic_info(`https://www.youtube.com/watch?v=${videoId}`)
      const formats = info.format

      if (!title) title = info.video_details?.title || ''
      if (!duration) duration = info.video_details?.durationInSec || 0

      let bestUrl = ''
      for (const key of Object.keys(formats)) {
        const f = formats[key]
        if (f.url && f.hasVideo && f.hasAudio) {
          bestUrl = f.url
          break
        }
      }

      if (!bestUrl) {
        for (const key of Object.keys(formats)) {
          const f = formats[key]
          if (f.url && f.hasVideo) {
            bestUrl = f.url
            break
          }
        }
      }

      if (bestUrl) {
        return { success: true, data: { url: bestUrl, title, duration } }
      }
    } catch (e: any) {
      console.error('[ytdl] play-dl error:', e?.message || e)
    }

    // Fallback: embed de YouTube
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`
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

      // Small delay to ensure projector window is ready
      await new Promise((r) => setTimeout(r, 300))

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
  })

  ipcMain.handle('video:setTime', (_event, time: number) => {
    ALL('projector:seekVideo', time)
  })

  ipcMain.handle('video:reportProgress', (_event, data) => {
    const mw = MAIN()
    if (mw) mw.webContents.send('video:progress', data)
  })
}
