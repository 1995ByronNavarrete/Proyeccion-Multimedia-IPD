/// <reference types="vite/client" />

interface IpcResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

interface MediaItem {
  id: number
  nombre: string
  ruta_archivo: string
  tipo: 'audio' | 'video'
  formato: string
  duracion_segundos: number | null
  resolucion: string | null
  tamano_bytes: number | null
  favorito: boolean
  fecha_agregado: string
}

interface Playlist {
  id: number
  nombre: string
  descripcion: string | null
  fecha_creacion: string
}

interface Display {
  id: number
  name: string
  bounds: { x: number; y: number; width: number; height: number }
  primary: boolean
}

interface SourceTrans {
  id: string
  name: string
  abbreviation: string
  language: string
  source: string
}

interface BibleDownloadProgress {
  completed: number
  total: number
  bookName: string
  percent: number
}

interface Translation {
  id: number
  nombre: string
  abreviatura: string
  activa: boolean
}

interface Book {
  id: number
  traduccion_id: number
  nombre: string
  orden: number
  testamento: string
}

interface Verse {
  id: number
  libro_id: number
  capitulo: number
  versiculo: number
  texto: string
  libro?: string
  traduccion?: string
}

interface Window {
  api: {
    bible: {
      getTranslations: () => Promise<IpcResponse<Translation[]>>
      getBooks: (translationId: number) => Promise<IpcResponse<Book[]>>
      getChapters: (bookId: number) => Promise<IpcResponse<{ capitulo: number }[]>>
      getVerses: (bookId: number, chapter: number) => Promise<IpcResponse<Verse[]>>
      search: (query: string, translationId?: number) => Promise<IpcResponse<Verse[]>>
      searchReference: (query: string, translationId?: number) => Promise<IpcResponse<Verse[]>>
      downloadData: (abbreviation: string, nombre: string, source: string, apiKey: string) => Promise<IpcResponse<null>>
      hasData: () => Promise<IpcResponse<{ hasData: boolean }>>
      getAvailableSources: () => Promise<IpcResponse<SourceTrans[]>>
      getApiBibleTranslations: (apiKey: string) => Promise<IpcResponse<SourceTrans[]>>
    }
    projector: {
      getDisplays: () => Promise<Display[]>
      projectToDisplay: (displayId?: number) => Promise<void>
      projectToAll: () => Promise<void>
      showBlack: () => Promise<void>
      stopAll: () => Promise<void>
      close: () => Promise<void>
    }
    medialocal: {
      importFile: () => Promise<IpcResponse<unknown[]>>
      scanFolder: () => Promise<IpcResponse<unknown[]>>
      openFolder: () => Promise<IpcResponse<{ ruta: string; archivos: { nombre: string; ruta: string; tipo: string; tamano: number }[] } | null>>
      getBiblioteca: () => Promise<IpcResponse<{ ruta: string; musica: { nombre: string; ruta: string; tamano: number }[]; videos: { nombre: string; ruta: string; tamano: number }[] }>>
      getAll: () => Promise<IpcResponse<MediaItem[]>>
      delete: (id: number) => Promise<IpcResponse<null>>
      toggleFavorite: (id: number) => Promise<IpcResponse<null>>
      getPlaylists: () => Promise<IpcResponse<Playlist[]>>
      createPlaylist: (name: string) => Promise<IpcResponse<{ id: number; nombre: string }>>
      addToPlaylist: (playlistId: number, mediaId: number) => Promise<IpcResponse<null>>
    }
    screen: {
      getAll: () => Promise<Display[]>,
      getLayout: () => Promise<{ displays: Display[]; appDisplayId: number }>
    }
    video: {
      play: (url: string, title?: string, duration?: number) => Promise<{ success: boolean; error?: string }>
      pause: () => Promise<void>
      resume: () => Promise<void>
      setVolume: (volume: number) => Promise<void>
      setTime: (time: number) => Promise<void>
      stop: () => Promise<void>
      reportProgress: (data: { currentTime: number; duration: number; paused: boolean; title: string }) => Promise<void>
    }
    ytdl: {
      search: (query: string, maxResults?: number) => Promise<{ success: boolean; data: { id: string; title: string; channel: string; thumbnail: string; description: string }[]; error?: string }>
      getInfo: (videoId: string) => Promise<{ success: boolean; data?: { title: string; duration: number; streamUrl: string; author: string }; error?: string }>
      getStreamUrl: (videoId: string) => Promise<{ success: boolean; data?: { url: string; title: string; duration: number }; error?: string }>
    }
    app: {
      getVersion: () => Promise<string>
      quit: () => Promise<void>
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      selectAndSaveLogo: () => Promise<IpcResponse<{ dataUrl: string; nombre: string } | null>>
      getLogo: () => Promise<IpcResponse<{ dataUrl: string; nombre: string } | null>>
      getConfig: () => Promise<IpcResponse<Record<string, unknown>>>
      saveConfig: (config: Record<string, unknown>) => Promise<IpcResponse<null>>
    }
    update: {
      check: () => Promise<void>
      download: () => Promise<void>
      install: () => Promise<void>
    }
    on: (channel: string, callback: (...args: unknown[]) => void) => () => void
  }
}

interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

interface UpdateDownloadProgress {
  percent: number
  bytesPerSecond: number
  total: number
  transferred: number
}
