import { ipcMain, BrowserWindow } from 'electron'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ytSearch = require('yt-search')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const play = require('play-dl')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const youtubedl = require('youtube-dl-exec')

let openProjector: (() => void) | null = null

export function setOpenProjector(fn: () => void): void {
  openProjector = fn
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

    // Obtener stream URL desde youtube-dl-exec (yt-dlp) con la mejor calidad
    try {
      const output = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        format: 'best[height<=1080]'
      })
      if (output?.url) {
        return { success: true, data: { url: output.url, title, duration } }
      }
      const allFormats = output?.formats || []
      const best = allFormats
        .filter((f: any) => f.url && f.vcodec !== 'none' && f.acodec !== 'none')
        .sort((a: any, b: any) => {
          const aScore = (a.ext === 'mp4' ? 1000 : 0) + (a.height || 0)
          const bScore = (b.ext === 'mp4' ? 1000 : 0) + (b.height || 0)
          return bScore - aScore
        })
      if (best.length > 0) {
        return { success: true, data: { url: best[0].url, title, duration } }
      }
      if (output?.url) {
        return { success: true, data: { url: output.url, title, duration } }
      }
    } catch (e: any) {
      console.error('[ytdl] youtube-dl-exec error:', e?.message || e)
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
