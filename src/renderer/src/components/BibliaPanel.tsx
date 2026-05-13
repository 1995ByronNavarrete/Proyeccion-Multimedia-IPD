import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Send, BookOpen, Download, Globe, Plus } from 'lucide-react'

interface BibliaPanelProps {
  onProject: (text: string, reference: string) => void
}

interface DownloadProgress {
  completed: number
  total: number
  bookName: string
  percent: number
}

type View = 'loading' | 'download' | 'ready'

export default function BibliaPanel({ onProject }: BibliaPanelProps) {
  const [view, setView] = useState<View>('loading')
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const [translations, setTranslations] = useState<Translation[]>([])
  const [selectedTrans, setSelectedTrans] = useState<number>(0)
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<number[]>([])
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [verses, setVerses] = useState<Verse[]>([])
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Verse[]>([])
  const [searching, setSearching] = useState(false)

  const [sources, setSources] = useState<SourceTrans[]>([])
  const [selectedSource, setSelectedSource] = useState<SourceTrans | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiBibleSources, setApiBibleSources] = useState<SourceTrans[]>([])

  const savedBookName = useRef<string | null>(null)
  const savedChapter = useRef<number>(1)
  const savedVerses = useRef<Set<number>>(new Set())

  useEffect(() => {
    checkData()
    loadSources()
    loadApiKey()
  }, [])

  useEffect(() => {
    const unsub = window.api.on('bible:downloadProgress', (...args) => {
      const p = args[0] as DownloadProgress
      setProgress(p)
    })
    return () => unsub?.()
  }, [])

  const loadSources = async () => {
    const res = await window.api.bible.getAvailableSources()
    if (res.success && res.data) setSources(res.data)
  }

  const loadApiKey = async () => {
    const res = await window.api.app.getConfig()
    if (res.success && res.data) {
      const cfg = res.data as Record<string, string>
      if (cfg.apiBibleKey) {
        setApiKey(cfg.apiBibleKey)
        const r = await window.api.bible.getApiBibleTranslations(cfg.apiBibleKey)
        if (r.success && r.data) setApiBibleSources(r.data)
      }
    }
  }

  const saveApiKey = async (key: string) => {
    setApiKey(key)
    const existing = await window.api.app.getConfig()
    const cfg = (existing.success && existing.data) ? (existing.data as Record<string, string>) : {}
    cfg.apiBibleKey = key
    await window.api.app.saveConfig(cfg)
    if (key) {
      const r = await window.api.bible.getApiBibleTranslations(key)
      if (r.success && r.data) setApiBibleSources(r.data)
    } else {
      setApiBibleSources([])
    }
  }

  const checkData = async () => {
    setView('loading')
    const res = await window.api.bible.hasData()
    if (res.success && res.data?.hasData) {
      await loadTranslations()
      setView('ready')
    } else {
      setView('download')
    }
  }

  const loadTranslations = async () => {
    const res = await window.api.bible.getTranslations()
    if (res.success && res.data?.length) {
      setTranslations(res.data)
      setSelectedTrans(res.data[0].id)
    }
  }

  const startDownload = async () => {
    if (!selectedSource) return
    setDownloading(true)
    setError('')
    setProgress(null)
    const key = selectedSource.source === 'api-bible' ? apiKey : ''
    const res = await window.api.bible.downloadData(
      selectedSource.abbreviation,
      selectedSource.name,
      selectedSource.source,
      key
    )
    if (res.success) {
      setSources([])
      setApiBibleSources([])
      await loadTranslations()
      setView('ready')
    } else {
      setError(res.error || 'Error al descargar')
    }
    setDownloading(false)
  }

  useEffect(() => {
    if (!selectedTrans || view !== 'ready') return
    const nameToFind = savedBookName.current
    window.api.bible.getBooks(selectedTrans).then((res) => {
      if (res.success && res.data) {
        setBooks(res.data)
        if (res.data.length) {
          const match = nameToFind ? res.data.find((b: Book) => b.nombre === nameToFind) : null
          setSelectedBook(match || res.data[0])
        }
      }
    })
  }, [selectedTrans, view])

  useEffect(() => {
    if (!selectedBook) return
    savedBookName.current = selectedBook.nombre
    window.api.bible.getChapters(selectedBook.id).then((res) => {
      if (res.success && res.data) {
        const caps = res.data.map((r: { capitulo: number }) => r.capitulo)
        setChapters(caps)
        const ch = savedChapter.current
        setSelectedChapter(caps.includes(ch) ? ch : caps[0] || 1)
      }
    })
  }, [selectedBook])

  useEffect(() => {
    if (!selectedBook) return
    savedChapter.current = selectedChapter
    window.api.bible.getVerses(selectedBook.id, selectedChapter).then((res) => {
      if (res.success && res.data) {
        setVerses(res.data)
        if (savedVerses.current.size) {
          setSelectedVerses(new Set(savedVerses.current))
          savedVerses.current = new Set()
        } else {
          setSelectedVerses(new Set())
        }
      }
    })
  }, [selectedBook, selectedChapter])

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      const q = search.trim()
      const transId = selectedTrans || undefined
      const isRef = /^\d?\s*[a-z\u00E0-\u00FC]+\s+\d+(\s*[.:,]\s*\d+)?$/i.test(q)

      let results: Verse[] = []
      if (isRef) {
        const refRes = await window.api.bible.searchReference(q, transId)
        if (refRes.success && refRes.data) results = refRes.data
      }
      if (!results.length) {
        const textRes = await window.api.bible.search(q, transId)
        if (textRes.success && textRes.data) results = textRes.data
      }
      setSearchResults(results)
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, selectedTrans])

  const toggleVerse = useCallback((v: number) => {
    setSelectedVerses((prev) => {
      const next = new Set(prev)
      if (next.has(v)) next.delete(v)
      else next.add(v)
      savedVerses.current = new Set(next)
      return next
    })
  }, [])

  const getReference = () => {
    if (!selectedBook) return ''
    const sorted = [...selectedVerses].sort((a, b) => a - b)
    return `${selectedBook.nombre} ${selectedChapter}:${sorted.join(',')}`
  }

  const getSelectedText = () => {
    if (!selectedBook || !selectedVerses.size) return ''
    const reference = getReference()
    const text = verses
      .filter((v) => selectedVerses.has(v.versiculo))
      .map((v) => `${v.versiculo}. ${v.texto}`)
      .join(' ')
    return `${text}\n\n— ${reference}`
  }

  const handleProject = () => {
    const text = getSelectedText()
    if (text) onProject(text, getReference())
  }

  const handleProjectResult = (v: Verse) => {
    const ref = `${v.libro} ${v.capitulo}:${v.versiculo}`
    const text = `${v.versiculo}. ${v.texto}\n\n— ${ref}`
    onProject(text, ref)
  }

  if (view === 'loading') {
    return (
      <div className="h-full bg-theme-panel rounded-xl flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={32} className="text-[#6c5ce7] mx-auto mb-3 animate-pulse" />
          <p className="text-xs text-theme-dim">Cargando...</p>
        </div>
      </div>
    )
  }

  if (view === 'download') {
    const allSources = [
      ...sources.filter((s) => s.language === 'es'),
      ...apiBibleSources
    ]

    return (
      <div className="h-full bg-theme-panel rounded-xl flex flex-col">
        <div className="p-4 border-b border-theme">
          <h2 className="text-sm font-bold text-theme mb-1">Biblias disponibles</h2>
          <p className="text-[10px] text-theme-muted">Selecciona una traducción para descargar</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {allSources.map((s) => (
            <div key={`${s.source}-${s.id}`} onClick={() => setSelectedSource(s)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                selectedSource?.id === s.id && selectedSource?.source === s.source
                  ? 'bg-[#6c5ce7]/20 border border-[#6c5ce7]/40'
                  : 'bg-theme-card hover:bg-theme-card/80 border border-transparent'
              }`}>
              <Globe size={14} className="text-[#00d4ff] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-theme truncate">{s.name}</p>
                <p className="text-[8px] text-theme-dim">
                  {s.abbreviation} · {s.source === 'bible-api' ? 'Gratuita sin clave' : 'API.Bible'}
                </p>
              </div>
            </div>
          ))}

          {!showApiKeyInput ? (
            <button onClick={() => setShowApiKeyInput(true)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[10px] text-theme-muted hover:text-theme hover:bg-theme-card transition-colors">
              <Plus size={12} /> Agregar API key de API.Bible (NTV, TLA, NVI...)
            </button>
          ) : (
            <div className="bg-theme-card rounded-lg p-3 space-y-2">
              <p className="text-[9px] text-theme-muted">
                Obtén tu API key gratis en{' '}
                <a href="https://scripture.api.bible" target="_blank" rel="noreferrer"
                  className="text-[#6c5ce7] underline">scripture.api.bible</a>
              </p>
              <input type="text" value={apiKey} onChange={(e) => saveApiKey(e.target.value)}
                placeholder="Ingresa tu API key..."
                className="w-full px-2 py-1.5 bg-theme rounded-lg text-[10px] text-theme border border-theme outline-none focus:border-[#6c5ce7]" />
            </div>
          )}
        </div>

        <div className="p-3 border-t border-theme space-y-2">
          {downloading ? (
            <div className="w-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-theme">
                  {progress ? `${progress.percent}%` : 'Preparando descarga...'}
                </span>
                {progress && (
                  <span className="text-[8px] text-theme-muted truncate max-w-[120px]">
                    {progress.bookName}
                  </span>
                )}
              </div>
              <div className="w-full h-2.5 bg-theme-card rounded-full overflow-hidden">
                {progress ? (
                  <div className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#00d4ff] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress.percent}%` }} />
                ) : (
                  <div className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#00d4ff] rounded-full animate-pulse"
                    style={{ width: '30%' }} />
                )}
              </div>
              {progress ? (
                <p className="text-[8px] text-theme-dim mt-1">
                  Capítulo {progress.completed} de {progress.total} · {progress.percent}% completado
                </p>
              ) : (
                <p className="text-[8px] text-theme-dim mt-1">
                  Iniciando descarga de {selectedSource?.name || 'Biblia'}...
                </p>
              )}
            </div>
          ) : (
            <button onClick={startDownload} disabled={!selectedSource}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#6c5ce7] rounded-lg text-xs font-medium hover:bg-[#5a4bd1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Download size={14} />
              {selectedSource ? `Descargar ${selectedSource.name}` : 'Selecciona una traducción'}
            </button>
          )}
          {error && <p className="text-[10px] text-red-400 text-center">{error}</p>}
        </div>
      </div>
    )
  }

  const currentVerses = search.trim()
    ? searchResults
    : verses

  return (
    <div className="h-full bg-theme-panel rounded-xl overflow-hidden flex flex-col">
      <div className="p-2.5 border-b border-theme">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-dim" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por palabra clave..."
            className="w-full pl-8 pr-3 py-2 bg-theme-card rounded-lg text-xs text-theme placeholder:text-theme-dim border border-theme outline-none focus:border-[#6c5ce7] transition-colors" />
        </div>
        {search.trim() && (
          <p className="text-[9px] text-theme-dim mt-1">
            {searching ? 'Buscando...' : `${currentVerses.length} resultados`}
          </p>
        )}
      </div>

      <div className="flex-1 grid grid-cols-[30%_70%] gap-2 p-2.5 min-h-0">
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <div className="flex gap-1">
            {translations.map((t) => (
              <button key={t.id} onClick={() => setSelectedTrans(t.id)}
                className={`text-[9px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  selectedTrans === t.id ? 'bg-[#6c5ce7] text-white' : 'bg-theme-card text-theme-dim hover:text-theme'
                }`}>{t.abreviatura}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {books.map((b) => (
              <div key={b.id} onClick={() => setSelectedBook(b)}
                className={`px-2 py-1 rounded cursor-pointer text-[11px] transition-colors ${
                  selectedBook?.id === b.id ? 'bg-[#6c5ce7]/20 text-[#6c5ce7]' : 'text-theme-muted hover:text-theme hover:bg-theme-card'
                }`}>{b.nombre}</div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 overflow-hidden">
          <div className="flex-1 grid grid-cols-[1fr_1fr] gap-2 min-h-0 overflow-hidden">
            <div className="flex flex-col gap-1.5 overflow-hidden">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-theme-dim font-semibold uppercase tracking-wider">Cap</span>
                <select value={selectedChapter} onChange={(e) => setSelectedChapter(Number(e.target.value))}
                  className="w-16 px-1 py-0.5 bg-theme-card rounded text-xs text-theme border border-theme outline-none">
                  {chapters.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-0.5 content-start">
                {verses.map((v) => (
                  <div key={v.versiculo} onClick={() => toggleVerse(v.versiculo)}
                    className={`text-center py-1 rounded cursor-pointer text-[11px] transition-colors ${
                      selectedVerses.has(v.versiculo) ? 'bg-[#6c5ce7] text-white' : 'text-theme-dim hover:text-theme hover:bg-theme-card'
                    }`}>{v.versiculo}</div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 overflow-hidden">
              <span className="text-[9px] text-theme-dim font-semibold uppercase tracking-wider flex items-center gap-1">
                <BookOpen size={10} className="text-[#6c5ce7]" /> Versículo
              </span>
              <div className="flex-1 overflow-y-auto bg-theme-card rounded-lg p-3">
                {search.trim() ? (
                  <div className="space-y-1">
                    {searchResults.map((v, i) => (
                      <div key={i} onClick={() => handleProjectResult(v)}
                        className="group flex items-start gap-1 cursor-pointer rounded px-1 py-0.5 hover:bg-[#6c5ce7]/10 transition-colors">
                        <Send size={10} className="text-[#6c5ce7] mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-[#6c5ce7] font-semibold">{v.libro} {v.capitulo}:{v.versiculo}</p>
                          <p className="text-[10px] leading-relaxed text-theme">{v.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : verses.length === 0 ? (
                  <p className="text-[10px] text-theme-dim">Selecciona un libro y capítulo</p>
                ) : (
                  currentVerses.map((v) => (
                    <p key={v.versiculo} onClick={() => toggleVerse(v.versiculo)}
                      className={`text-xs leading-relaxed mb-1 cursor-pointer rounded px-0.5 transition-colors ${
                        selectedVerses.has(v.versiculo) ? 'text-white bg-[#6c5ce7]/20 -mx-0.5 px-1' : 'text-theme hover:text-theme'
                      }`}>
                      <span className="text-[#6c5ce7] font-semibold">{v.versiculo}.</span>{' '}
                      {v.texto}
                    </p>
                  ))
                )}
                {selectedVerses.size > 1 && (
                  <p className="text-[9px] text-theme-dim mt-2">
                    Seleccionados: {[...selectedVerses].sort((a, b) => a - b).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleProject}
              disabled={!selectedVerses.size}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#6c5ce7] rounded-lg text-[10px] font-medium hover:bg-[#5a4bd1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Send size={11} /> Proyectar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
