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
    sendContent: (content: unknown) => ipcRenderer.invoke('projector:sendContent', content),
    stopAll: () => ipcRenderer.invoke('projector:close'),
    close: () => ipcRenderer.invoke('projector:close'),
    prevVerse: () => ipcRenderer.invoke('projector:prevVerse'),
    nextVerse: () => ipcRenderer.invoke('projector:nextVerse'),
    showAnnouncement: (data: { text: string; animation: string }) => ipcRenderer.invoke('projector:showAnnouncement', data),
    hideAnnouncement: () => ipcRenderer.invoke('projector:hideAnnouncement'),
    updateAnnouncement: (data: Record<string, string>) => ipcRenderer.invoke('projector:updateAnnouncement', data),
    overlay: (data: { type: string; speed?: number; color?: string }) => ipcRenderer.invoke('projector:overlay', data),
    scrollDocument: (direction: 'up' | 'down') => ipcRenderer.invoke('projector:scrollDocument', direction)
  },
  display: {
    setAssignments: (assignments: Record<number, string[]>) => ipcRenderer.invoke('display:setAssignments', assignments),
    sendContent: (displayId: number, content: unknown) => ipcRenderer.invoke('display:sendContent', displayId, content),
    showAnnouncement: (displayId: number, data: any) => ipcRenderer.invoke('display:showAnnouncement', displayId, data),
    hideAnnouncement: (displayId: number) => ipcRenderer.invoke('display:hideAnnouncement', displayId),
    stopVideo: (displayId: number) => ipcRenderer.invoke('display:stopVideo', displayId)
  },
  medialocal: {
    importFile: () => ipcRenderer.invoke('medialocal:importFile'),
    importFiles: () => ipcRenderer.invoke('medialocal:importFiles'),
    deleteFile: (filePath: string) => ipcRenderer.invoke('medialocal:deleteFile', filePath),
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
    reportProgress: (data: { currentTime: number; duration: number; paused: boolean; title: string }) => ipcRenderer.invoke('video:reportProgress', data),
  },
  timer: {
    update: (data: { time: number; running: boolean }) => ipcRenderer.invoke('timer:update', data),
  },
  ytdl: {
    search: (query: string, maxResults?: number) => ipcRenderer.invoke('ytdl:search', query, maxResults),
    getStreamUrl: (videoId: string) => ipcRenderer.invoke('ytdl:getStreamUrl', videoId)
  },
  capture: {
    projector: () => ipcRenderer.invoke('capture:projector'),
    projectorByDisplay: (displayId: number) => ipcRenderer.invoke('capture:projectorByDisplay', displayId)
  },
  anuncios: {
    getAll: () => ipcRenderer.invoke('anuncios:getAll'),
    create: (texto: string, animacion: string) => ipcRenderer.invoke('anuncios:create', texto, animacion),
    delete: (id: number) => ipcRenderer.invoke('anuncios:delete', id),
    saveAnim: (animacion: string) => ipcRenderer.invoke('anuncios:saveAnim', animacion)
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    quit: () => ipcRenderer.invoke('app:quit'),
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    selectAndSaveLogo: () => ipcRenderer.invoke('app:selectAndSaveLogo'),
    getLogo: () => ipcRenderer.invoke('app:getLogo'),

    reloadDatabase: () => ipcRenderer.invoke('database:reload'),
    getConfig: () => ipcRenderer.invoke('app:getConfig'),
    saveConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('app:saveConfig', config),
    pickImage: () => ipcRenderer.invoke('app:pickImage'),
    getFondos: () => ipcRenderer.invoke('app:getFondos'),
    saveEditedImage: (dataUrl: string, name: string) => ipcRenderer.invoke('app:saveEditedImage', dataUrl, name),
    readImageAsDataUrl: (filePath: string) => ipcRenderer.invoke('app:readImageAsDataUrl', filePath),
    readFileAsDataUrl: (filePath: string) => ipcRenderer.invoke('app:readFileAsDataUrl', filePath),
    openDocument: (filePath: string) => ipcRenderer.invoke('app:openDocument', filePath),
    convertDocumentToHtml: (filePath: string) => ipcRenderer.invoke('app:convertDocumentToHtml', filePath)
  },
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    checkNow: () => ipcRenderer.invoke('update:checkNow'),
    checkAndReturn: () => ipcRenderer.invoke('update:checkAndReturn'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install')
  },
  tarea: {
    create: (nombre: string) => ipcRenderer.invoke('tarea:create', nombre),
    getAll: () => ipcRenderer.invoke('tarea:getAll'),
    delete: (id: number) => ipcRenderer.invoke('tarea:delete', id),
    addImage: (tareaId: number) => ipcRenderer.invoke('tarea:addImage', tareaId),
    getImages: (tareaId: number) => ipcRenderer.invoke('tarea:getImages', tareaId),
    deleteImage: (id: number) => ipcRenderer.invoke('tarea:deleteImage', id),
  },



  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    restore: () => ipcRenderer.invoke('backup:restore'),
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = ['projector:content', 'projector:showBlack', 'projector:playVideo', 'projector:pauseVideo', 'projector:resumeVideo', 'projector:stopVideo', 'projector:volumeVideo', 'projector:seekVideo', 'projector:layoutChanged', 'projector:prevVerse', 'projector:nextVerse', 'projector:scrollDocument', 'projector:showAnnouncement', 'projector:hideAnnouncement', 'projector:updateAnnouncement', 'projector:overlay', 'projector:timer', 'video:progress', 'medialocal:changed', 'bible:downloadProgress', 'update:available', 'update:not-available', 'update:download-progress', 'update:downloaded', 'update:error']
    if (validChannels.includes(channel)) {
      const handler = (_event: unknown, ...args: unknown[]) => callback(...args)
      ipcRenderer.on(channel, handler)
      return () => ipcRenderer.removeListener(channel, handler)
    }
    return () => {}
  }
}

contextBridge.exposeInMainWorld('api', api)
