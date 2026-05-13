import { contextBridge, ipcRenderer } from 'electron'

const api = {
  bible: {
    getTranslations: () => ipcRenderer.invoke('bible:getTranslations'),
    getBooks: (translationId: number) => ipcRenderer.invoke('bible:getBooks', translationId),
    getChapters: (bookId: number) => ipcRenderer.invoke('bible:getChapters', bookId),
    getVerses: (bookId: number, chapter: number) => ipcRenderer.invoke('bible:getVerses', bookId, chapter),
    search: (query: string, translationId?: number) => ipcRenderer.invoke('bible:search', query, translationId),
    searchReference: (query: string, translationId?: number) => ipcRenderer.invoke('bible:searchReference', query, translationId),
    downloadData: (abbreviation: string, nombre: string, source: string, apiKey: string) => ipcRenderer.invoke('bible:downloadData', abbreviation, nombre, source, apiKey),
    hasData: () => ipcRenderer.invoke('bible:hasData'),
    getAvailableSources: () => ipcRenderer.invoke('bible:getAvailableSources'),
    getApiBibleTranslations: (apiKey: string) => ipcRenderer.invoke('bible:getApiBibleTranslations', apiKey)
  },
  projector: {
    getDisplays: () => ipcRenderer.invoke('screen:getAll'),
    projectToDisplay: (displayId: number) => ipcRenderer.invoke('projector:open', displayId),
    projectToAll: () => ipcRenderer.invoke('projector:open'),
    showBlack: () => ipcRenderer.invoke('projector:showBlack'),
    stopAll: () => ipcRenderer.invoke('projector:close'),
    close: () => ipcRenderer.invoke('projector:close')
  },
  medialocal: {
    importFile: () => ipcRenderer.invoke('medialocal:importFile'),
    scanFolder: () => ipcRenderer.invoke('medialocal:importFile'),
    openFolder: () => ipcRenderer.invoke('medialocal:openFolder'),
    getBiblioteca: () => ipcRenderer.invoke('medialocal:getBiblioteca'),
    getAll: () => ipcRenderer.invoke('medialocal:getAll'),
    delete: (id: number) => ipcRenderer.invoke('medialocal:delete', id),
    toggleFavorite: (id: number) => ipcRenderer.invoke('medialocal:toggleFavorite', id),
    getPlaylists: () => ipcRenderer.invoke('medialocal:getPlaylists'),
    createPlaylist: (name: string) => ipcRenderer.invoke('medialocal:createPlaylist', name),
    addToPlaylist: (playlistId: number, mediaId: number) => ipcRenderer.invoke('medialocal:addToPlaylist', playlistId, mediaId)
  },
  screen: {
    getAll: () => ipcRenderer.invoke('screen:getAll'),
    getLayout: () => ipcRenderer.invoke('screen:getLayout')
  },
  video: {
    play: (url: string, title?: string, duration?: number) => ipcRenderer.invoke('video:play', url, title, duration),
    pause: () => ipcRenderer.invoke('video:pause'),
    resume: () => ipcRenderer.invoke('video:resume'),
    setVolume: (volume: number) => ipcRenderer.invoke('video:setVolume', volume),
    setTime: (time: number) => ipcRenderer.invoke('video:setTime', time),
    stop: () => ipcRenderer.invoke('video:stop'),
    reportProgress: (data: { currentTime: number; duration: number; paused: boolean; title: string }) => ipcRenderer.invoke('video:reportProgress', data)
  },
  ytdl: {
    search: (query: string, maxResults?: number) => ipcRenderer.invoke('ytdl:search', query, maxResults),
    getInfo: (videoId: string) => ipcRenderer.invoke('ytdl:getInfo', videoId),
    getStreamUrl: (videoId: string) => ipcRenderer.invoke('ytdl:getStreamUrl', videoId)
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    quit: () => ipcRenderer.invoke('app:quit'),
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    selectAndSaveLogo: () => ipcRenderer.invoke('app:selectAndSaveLogo'),
    getLogo: () => ipcRenderer.invoke('app:getLogo'),
    getConfig: () => ipcRenderer.invoke('app:getConfig'),
    saveConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('app:saveConfig', config)
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = ['projector:content', 'projector:showBlack', 'projector:playVideo', 'projector:pauseVideo', 'projector:resumeVideo', 'projector:stopVideo', 'projector:volumeVideo', 'projector:seekVideo', 'projector:layoutChanged', 'video:progress', 'medialocal:changed', 'bible:downloadProgress']
    if (validChannels.includes(channel)) {
      const handler = (_event: unknown, ...args: unknown[]) => callback(...args)
      ipcRenderer.on(channel, handler)
      return () => ipcRenderer.removeListener(channel, handler)
    }
    return () => {}
  }
}

contextBridge.exposeInMainWorld('api', api)
