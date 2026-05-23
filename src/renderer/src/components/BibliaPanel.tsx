import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Send, BookOpen, Download, Globe, Plus, Check, ArrowRightToLine } from 'lucide-react'
import { useLang } from '../i18n'

interface BibliaPanelProps {
  onProject: (text: string, reference: string) => void
  onLoadChapter?: (verses: { text: string; reference: string; verseNumber: number }[], idx: number) => void
  projectedVerseNumber?: number | null
}

interface DownloadProgress {
  completed: number
  total: number
  bookName: string
  percent: number
}

type View = 'loading' | 'download' | 'ready'

const TRANS_COLORS: Record<string, string> = {
  RVR1960: '#6c5ce7', NTV: '#00d4ff', TLA: '#22c55e',
  NVI: '#f59e0b', PDT: '#ef4444', LBLA: '#a855f7',
  DHH: '#ec4899', NBV: '#14b8a6', BLP: '#f97316',
}

export default function BibliaPanel({ onProject, onLoadChapter, projectedVerseNumber }: BibliaPanelProps) {
  const { t } = useLang()
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
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Verse[]>([])
  const [searching, setSearching] = useState(false)
  const [goRef, setGoRef] = useState('')
  const [goRefError, setGoRefError] = useState('')

  const [sources, setSources] = useState<SourceTrans[]>([])
  const [selectedSource, setSelectedSource] = useState<SourceTrans | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiBibleSources, setApiBibleSources] = useState<SourceTrans[]>([])
  const [projectedRef, setProjectedRef] = useState<string | null>(null)

  const savedBookName = useRef<string | null>(null)
  const savedChapter = useRef<number>(1)
  const savedVerse = useRef<number | null>(null)
  const projectedTimer = useRef<ReturnType<typeof setTimeout>>()
  const goToRefTimer = useRef<ReturnType<typeof setTimeout>>()
  const versesGridRef = useRef<HTMLDivElement>(null)
  const isInitialProject = useRef(true)

  useEffect(() => {
    return () => { if (goToRefTimer.current) clearTimeout(goToRefTimer.current) }
  }, [])

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
      setError(res.error || t('biblia.downloadError'))
    }
    setDownloading(false)
  }

  useEffect(() => {
    if (!selectedTrans || view !== 'ready') return
    let cancelled = false
    const nameToFind = savedBookName.current
    const chapterToLoad = savedChapter.current
    const verseToSelect = savedVerse.current
    window.api.bible.getBooks(selectedTrans).then((res) => { if (cancelled) return
      if (res.success && res.data) {
        setBooks(res.data)
        if (res.data.length) {
          const match = nameToFind ? res.data.find((b: Book) => b.nombre === nameToFind) : null
          const book = match || res.data[0]
          setSelectedBook(book)
          if (match && chapterToLoad) {
            window.api.bible.getChapters(book.id).then((cRes) => {
              if (cancelled) return
              if (cRes.success && cRes.data) setChapters(cRes.data.map((r: { capitulo: number }) => r.capitulo))
            })
            window.api.bible.getVerses(book.id, chapterToLoad).then((vRes) => {
              if (cancelled) return
              if (vRes.success && vRes.data) {
                setVerses(vRes.data)
                setSelectedChapter(chapterToLoad)
                if (verseToSelect != null) {
                  const matchV = vRes.data.find((v: Verse) => v.versiculo === verseToSelect)
                  if (matchV) {
                    const ref = `${book.nombre} ${chapterToLoad}:${verseToSelect}`
                    const text = `${verseToSelect}. ${matchV.texto}`
                    setSelectedVerse(verseToSelect)
                    savedVerse.current = verseToSelect
                    onProject(text, ref)
                    if (onLoadChapter) {
                      const chapterRef = `${book.nombre} ${chapterToLoad}`
                      const allVerses = vRes.data.map((vv: Verse) => ({
                        text: `${vv.versiculo}. ${vv.texto}`,
                        reference: `${chapterRef}:${vv.versiculo}`,
                        verseNumber: vv.versiculo
                      }))
                      const idx = vRes.data.findIndex((vv: Verse) => vv.versiculo === verseToSelect)
                      onLoadChapter(allVerses, idx >= 0 ? idx : 0)
                    }
                  }
                }
              }
            })
          }
        }
      }
    }).catch(() => {})
    return () => { cancelled = true }
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
    }).catch(() => console.error('[BibliaPanel] Error al cargar capítulos'))
  }, [selectedBook])

  useEffect(() => {
    if (!selectedBook) return
    savedChapter.current = selectedChapter
    savedVerse.current = null
    setSelectedVerse(null)
    window.api.bible.getVerses(selectedBook.id, selectedChapter).then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setVerses(res.data)
        const firstV = res.data[0]
        setSelectedVerse(firstV.versiculo)
        savedVerse.current = firstV.versiculo
        if (!isInitialProject.current) {
          const ref = `${selectedBook.nombre} ${selectedChapter}:${firstV.versiculo}`
          const text = `${firstV.versiculo}. ${firstV.texto}`
          onProject(text, ref)
        }
        isInitialProject.current = false
        const chapterRef = `${selectedBook.nombre} ${selectedChapter}`
        const allVerses = res.data.map((vv: Verse) => ({
          text: `${vv.versiculo}. ${vv.texto}`,
          reference: `${chapterRef}:${vv.versiculo}`,
          verseNumber: vv.versiculo
        }))
        onLoadChapter?.(allVerses, 0)
      }
    }).catch(() => console.error('[BibliaPanel] Error al cargar versículos'))
  }, [selectedBook, selectedChapter])

  const goToReference = useCallback(async () => {
    setGoRefError('')
    const match = goRef.trim().match(/^(\d?\s*[a-z\u00E0-\u00FC]+)\s*(\d+)(?:\s*[.:,]\s*(\d+))?$/i)
    if (!match) { setGoRefError(t('biblia.formatError')); return }
    const bookName = match[1].trim()
    const chapter = parseInt(match[2], 10)
    const verse = match[3] ? parseInt(match[3], 10) : null
    const res = await window.api.bible.searchReference(goRef.trim(), selectedTrans || undefined)
    if (!res.success || !res.data?.length) { setGoRefError(t('biblia.referenceNotFound')); return }
    const row = res.data[0]
    const book = books.find(b => b.id === row.libro_id)
    if (!book) { setGoRefError(t('biblia.bookNotFound')); return }
    savedBookName.current = book.nombre
    savedChapter.current = chapter
    savedVerse.current = verse
    setSelectedBook(book)
    setSelectedChapter(chapter)
    if (verse) {
      if (goToRefTimer.current) clearTimeout(goToRefTimer.current)
      goToRefTimer.current = setTimeout(async () => {
        const vRes = await window.api.bible.getVerses(book.id, chapter)
        if (vRes.success && vRes.data) {
          const found = vRes.data.find((v: Verse) => v.versiculo === verse)
          if (found) {
            setSelectedVerse(verse)
            savedVerse.current = verse
            const ref = `${book.nombre} ${chapter}:${verse}`
            const text = `${verse}. ${found.texto}`
            onProject(text, ref)
          }
        }
      }, 200)
    }
    setGoRef('')
  }, [goRef, selectedTrans, books, onProject, t])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const isRef = /^\d?\s*[a-z\u00E0-\u00FC]+\s+\d+(\s*[.:,]\s*\d+)?$/i.test(q)

    const refPromise = isRef ? window.api.bible.searchReference(q) : Promise.resolve(null)
    const textPromise = window.api.bible.search(q)

    const [refRes, textRes] = await Promise.all([refPromise, textPromise])

    let results: Verse[] = []
    if (refRes?.success && refRes.data) results = refRes.data
    if (textRes.success && textRes.data) {
      const existing = new Set(results.map(r => `${r.libro}-${r.capitulo}-${r.versiculo}-${r.traduccion || ''}`))
      for (const v of textRes.data) {
        const key = `${v.libro || ''}-${v.capitulo || ''}-${v.versiculo || ''}-${v.traduccion || ''}`
        if (!existing.has(key)) results.push(v)
      }
    }
    setSearchResults(results)
    setSearching(false)
  }, [])

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const timer = setTimeout(() => doSearch(search.trim()), 400)
    return () => clearTimeout(timer)
  }, [search, doSearch])

  const toggleVerse = useCallback((v: number) => {
    setSelectedVerse((prev) => {
      const next = prev === v ? null : v
      savedVerse.current = next
      return next
    })
  }, [])

  const projectVerse = useCallback((v: Verse) => {
    const ref = `${selectedBook?.nombre} ${selectedChapter}:${v.versiculo}`
    const text = `${v.versiculo}. ${v.texto}`
    onProject(text, ref)
    if (onLoadChapter && verses.length > 0) {
      const chapterRef = `${selectedBook?.nombre} ${selectedChapter}`
      const allVerses = verses.map((vv: any) => ({
        text: `${vv.versiculo}. ${vv.texto}`,
        reference: `${chapterRef}:${vv.versiculo}`,
        verseNumber: vv.versiculo
      }))
      const idx = verses.findIndex((vv: any) => vv.versiculo === v.versiculo)
      onLoadChapter(allVerses, idx >= 0 ? idx : 0)
    }
    setProjectedRef(ref)
    if (projectedTimer.current) clearTimeout(projectedTimer.current)
    projectedTimer.current = setTimeout(() => setProjectedRef(null), 1500)
  }, [selectedBook, selectedChapter, verses, onProject, onLoadChapter])

  const navigateVerse = useCallback((dir: 'prev' | 'next') => {
    if (!verses.length || search.trim()) return
    const idx = verses.findIndex((v) => v.versiculo === selectedVerse)
    const targetIdx = dir === 'next' ? idx + 1 : idx - 1
    if (targetIdx < 0 || targetIdx >= verses.length) return
    const v = verses[targetIdx]
    setSelectedVerse(v.versiculo)
    savedVerse.current = v.versiculo
    projectVerse(v)
  }, [verses, selectedVerse, search, projectVerse])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateVerse('next')
      else if (e.key === 'ArrowLeft') navigateVerse('prev')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigateVerse])

  useEffect(() => {
    if (!selectedVerse || !versesGridRef.current || search.trim()) return
    const el = versesGridRef.current.querySelector(`[data-verse="${selectedVerse}"]`)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedVerse, search])

  const getReference = () => {
    if (!selectedBook || !selectedVerse) return ''
    return `${selectedBook.nombre} ${selectedChapter}:${selectedVerse}`
  }

  const getSelectedText = () => {
    if (!selectedBook || !selectedVerse) return ''
    const v = verses.find((v) => v.versiculo === selectedVerse)
    if (!v) return ''
    return `${v.versiculo}. ${v.texto}`
  }

  const handleProject = () => {
    const text = getSelectedText()
    if (text) {
      const ref = getReference()
      onProject(text, ref)
      if (onLoadChapter && verses.length > 0) {
        const chapterRef = `${selectedBook?.nombre} ${selectedChapter}`
        const allVerses = verses.map((v) => ({
          text: `${v.versiculo}. ${v.texto}`,
          reference: `${chapterRef}:${v.versiculo}`,
          verseNumber: v.versiculo
        }))
        const idx = verses.findIndex((v) => v.versiculo === selectedVerse)
        onLoadChapter(allVerses, idx >= 0 ? idx : 0)
      }
      setProjectedRef(ref)
      if (projectedTimer.current) clearTimeout(projectedTimer.current)
      projectedTimer.current = setTimeout(() => setProjectedRef(null), 1500)
    }
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
          <p className="text-xs text-theme-dim">{t('biblia.loading')}</p>
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
          <h2 className="text-sm font-bold text-theme mb-1">{t('biblia.downloadAvailable')}</h2>
          <p className="text-[10px] text-theme-muted">{t('biblia.selectDownload')}</p>
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
                  {s.abbreviation} · {s.source === 'bible-api' ? t('biblia.freeNoKey') : 'API.Bible'}
                </p>
              </div>
            </div>
          ))}

          {!showApiKeyInput ? (
            <button onClick={() => setShowApiKeyInput(true)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[10px] text-theme-muted hover:text-theme hover:bg-theme-card transition-colors">
              <Plus size={12} /> {t('biblia.addApiKey')}
            </button>
          ) : (
            <div className="bg-theme-card rounded-lg p-3 space-y-2">
              <p className="text-[9px] text-theme-muted">
                {t('biblia.getApiKey')}{' '}
                <a href="https://scripture.api.bible" target="_blank" rel="noreferrer"
                  className="text-[#6c5ce7] underline">scripture.api.bible</a>
              </p>
              <input type="text" value={apiKey} onChange={(e) => saveApiKey(e.target.value)}
                placeholder={t('biblia.enterApiKey')}
                className="w-full px-2 py-1.5 bg-theme rounded-lg text-[10px] text-theme border border-theme outline-none focus:border-[#6c5ce7]" />
            </div>
          )}
        </div>

        <div className="p-3 border-t border-theme space-y-2">
          {downloading ? (
            <div className="w-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-theme">
                  {progress ? `${progress.percent}%` : t('biblia.preparingDownload')}
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
                  {t('biblia.chapterOf')} {progress.completed} de {progress.total} · {progress.percent}% {t('biblia.completed')}
                </p>
              ) : (
                <p className="text-[8px] text-theme-dim mt-1">
                  {t('biblia.startingDownload')} {selectedSource?.name || 'Biblia'}...
                </p>
              )}
            </div>
          ) : (
            <button onClick={startDownload} disabled={!selectedSource}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#6c5ce7] rounded-lg text-xs font-medium hover:bg-[#5a4bd1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Download size={14} />
              {selectedSource ? `${t('biblia.download')} ${selectedSource.name}` : t('biblia.selectTranslation')}
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
            placeholder={t('biblia.search')}
            className="w-full pl-8 pr-3 py-2 bg-theme-card rounded-lg text-xs text-theme placeholder:text-theme-dim border border-theme outline-none focus:border-[#6c5ce7] transition-colors" />
        </div>
        {search.trim() && (
          <p className="text-[9px] text-theme-dim mt-1">
            {searching ? t('biblia.searching') : `${currentVerses.length} ${t('biblia.results')}`}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1.5">
          <ArrowRightToLine size={10} className="text-[#00d4ff] shrink-0" />
          <input type="text" value={goRef} onChange={e => { setGoRef(e.target.value); setGoRefError('') }}
            onKeyDown={e => { if (e.key === 'Enter') goToReference() }}
            placeholder={t('biblia.goto')}
            className="flex-1 px-2 py-1 bg-theme-card rounded text-[10px] text-theme placeholder:text-theme-dim border border-theme outline-none focus:border-[#00d4ff] transition-colors" />
          <button onClick={goToReference} disabled={!goRef.trim()}
            className="px-2 py-1 bg-[#00d4ff]/20 text-[#00d4ff] rounded text-[10px] font-medium hover:bg-[#00d4ff]/30 disabled:opacity-30 transition-colors">{t('biblia.go')}</button>
        </div>
        {goRefError && <p className="text-[9px] text-red-400 mt-0.5">{goRefError}</p>}
      </div>

      <div className="flex-1 grid grid-cols-[30%_70%] gap-2 p-2.5 min-h-0">
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <div className="flex gap-1">
            {translations.map((t) => (
              <button key={t.id} onClick={() => {
                const curBook = selectedBook?.nombre
                const curChapter = selectedChapter
                const curVerse = selectedVerse
                setSelectedTrans(t.id)
                setSelectedBook(null)
                setSelectedChapter(1)
                setSelectedVerse(null)
                setVerses([])
                setChapters([])
                setSearchResults([])
                setSearch('')
                savedBookName.current = curBook || null
                savedChapter.current = curChapter || 1
                savedVerse.current = curVerse
              }}
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
          <div className="flex-[3] grid grid-cols-[1fr_1fr] gap-2 min-h-0 overflow-hidden">
            {/* ─── Capítulos + Versículos ─── */}
            <div className="flex flex-col overflow-hidden min-h-0">
              <span className="text-[10px] text-theme-dim font-bold uppercase tracking-wider mb-1 pt-1">{t('biblia.chapters')}</span>
              <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-1 content-start min-h-0">
                {chapters.map((c) => (
                  <div key={c} onClick={() => setSelectedChapter(c)}
                    className={`text-center py-1.5 rounded cursor-pointer text-[11px] font-medium transition-colors ${
                      selectedChapter === c ? 'bg-[#6c5ce7] text-white shadow-sm' : 'bg-theme-card text-theme-dim hover:text-theme hover:bg-[#6c5ce7]/10'
                    }`}>{c}</div>
                ))}
              </div>
              <div className="border-t border-theme my-3 shrink-0" />
              {selectedChapter > 0 && !search.trim() && (
                <div className="flex flex-col min-h-0 flex-[4]">
                  <span className="text-[10px] text-theme-dim font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <BookOpen size={11} className="text-[#6c5ce7]" /> {t('biblia.verses')}
                  </span>
                  <div ref={versesGridRef} className="flex-[10] overflow-y-auto grid grid-cols-6 gap-1 content-start min-h-0">
                    {currentVerses.map((v: any) => {
                      const isProjected = projectedVerseNumber != null && v.versiculo === projectedVerseNumber
                      const isSel = selectedVerse === v.versiculo
                      let cls = 'bg-theme-card text-theme-dim hover:text-theme hover:bg-[#6c5ce7]/10'
                      if (isSel) cls = 'bg-[#6c5ce7] text-white shadow-sm'
                      else if (isProjected) cls = 'ring-2 ring-[#00d4ff] bg-theme-card text-[#00d4ff]'
                      return (
                        <div key={v.versiculo} data-verse={v.versiculo} onClick={() => {
                          setSelectedVerse(v.versiculo)
                          savedVerse.current = v.versiculo
                          projectVerse(v)
                        }}
                          className={`text-center py-1.5 rounded cursor-pointer text-[12px] font-medium transition-colors ${cls}`}>{v.versiculo}</div>
                      )
                    })}
                  </div>
                </div>
              )}
              {search.trim() && (
                <div className="flex flex-col min-h-0 flex-[4]">
                  <span className="text-[10px] text-theme-dim font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <BookOpen size={11} className="text-[#6c5ce7]" /> {t('biblia.results')}
                  </span>
                  <div className="flex-[10] overflow-y-auto space-y-1">
                    {currentVerses.map((v: any, i: number) => {
                      const isSel = selectedVerse === v.versiculo
                      const transColor = TRANS_COLORS[v.traduccion as string] || '#6c5ce7'
                      return (
                        <div key={i} onClick={async () => {
                          if (v.traduccion) {
                            const matchTrans = translations.find((t: Translation) => t.abreviatura === v.traduccion)
                            if (matchTrans) setSelectedTrans(matchTrans.id)
                          }
                          setSelectedVerse(v.versiculo)
                          savedVerse.current = v.versiculo
                          const ref = `${v.libro || selectedBook?.nombre} ${v.capitulo || selectedChapter}:${v.versiculo}`
                          const text = `${v.versiculo}. ${v.texto}`
                          onProject(text, ref)
                          // Cargar capítulo completo para navegación prev/next
                          if (onLoadChapter && v.libro_id && v.capitulo) {
                            const vRes = await window.api.bible.getVerses(v.libro_id, v.capitulo)
                            if (vRes.success && vRes.data) {
                              const chapterRef = `${v.libro || selectedBook?.nombre} ${v.capitulo}`
                              const allVerses = vRes.data.map((vv: Verse) => ({
                                text: `${vv.versiculo}. ${vv.texto}`,
                                reference: `${chapterRef}:${vv.versiculo}`,
                                verseNumber: vv.versiculo
                              }))
                              const idx = vRes.data.findIndex((vv: Verse) => vv.versiculo === v.versiculo)
                              onLoadChapter(allVerses, idx >= 0 ? idx : 0)
                            }
                          }
                          setSearch('')
                          setSearchResults([])
                        }}
                          className={`p-2 rounded-lg cursor-pointer transition-all ${isSel ? 'bg-[#6c5ce7]/20 ring-1 ring-[#6c5ce7]' : 'bg-theme-card hover:bg-[#6c5ce7]/10 hover:translate-x-0.5'}`}>
                          <p className="text-[9px] text-[#6c5ce7] font-semibold mb-0.5 flex items-center gap-1.5">
                            {v.libro || selectedBook?.nombre} {v.capitulo || selectedChapter}:{v.versiculo}
                            {v.traduccion && (
                              <span className="text-[6px] px-1.5 py-0.5 rounded-full font-normal" style={{ backgroundColor: transColor + '20', color: transColor }}>{v.traduccion}</span>
                            )}
                          </p>
                          <p className="text-[9px] text-theme leading-relaxed line-clamp-2">{v.versiculo}. {v.texto}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Vista previa del texto ─── */}
              <div className="flex-[1] min-h-0 flex flex-col gap-1.5 overflow-hidden">
              <span className="text-[9px] text-theme-dim font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
                <BookOpen size={10} className="text-[#6c5ce7]" /> {t('biblia.preview')}
              </span>
              <div className="flex-1 overflow-y-auto bg-theme-card rounded-lg p-3 min-h-0">
                {selectedVerse != null && getReference() && (
                  <div className="text-[9px] text-[#6c5ce7] font-semibold mb-1.5 pb-1.5 border-b border-theme/50 flex items-center gap-1.5">
                    <span>{getReference()}</span>
                    {translations.find(t => t.id === selectedTrans) && (
                      <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-[#6c5ce7]/10 text-[#6c5ce7]/70">
                        {translations.find(t => t.id === selectedTrans)?.abreviatura}
                      </span>
                    )}
                  </div>
                )}
                {search.trim() ? (
                  selectedVerse != null ? (
                    currentVerses.filter((v: any) => v.versiculo === selectedVerse).map((v: any, i: number) => (
                      <p key={i} className="text-xs leading-relaxed text-theme mb-2">
                        <span className="text-[#6c5ce7] font-semibold">{v.versiculo}.</span> {v.texto}
                      </p>
                    ))
                  ) : (
                    <p className="text-[10px] text-theme-dim">{t('biblia.selectResult')}</p>
                  )
                ) : !selectedChapter ? (
                  <p className="text-[10px] text-theme-dim">{t('biblia.selectChapter')}</p>
                ) : selectedVerse === null ? (
                  <p className="text-[10px] text-theme-dim">{t('biblia.selectVerse')}</p>
                ) : (
                  <>
                    {verses.filter(v => v.versiculo < selectedVerse && v.versiculo >= selectedVerse - 2).map((v) => (
                      <p key={v.versiculo} className="text-xs leading-relaxed text-theme-dim/50 mb-1">
                        <span className="text-theme-dim/30 font-semibold">{v.versiculo}.</span> {v.texto}
                      </p>
                    ))}
                    {verses.filter((v) => v.versiculo === selectedVerse).map((v) => (
                      <p key={v.versiculo} className="text-xs leading-relaxed text-theme mb-1 border-l-2 border-[#6c5ce7] pl-2 -ml-2">
                        <span className="text-[#6c5ce7] font-semibold">{v.versiculo}.</span> {v.texto}
                      </p>
                    ))}
                    {verses.filter(v => v.versiculo > selectedVerse && v.versiculo <= selectedVerse + 2).map((v) => (
                      <p key={v.versiculo} className="text-xs leading-relaxed text-theme-dim/50 mt-1">
                        <span className="text-theme-dim/30 font-semibold">{v.versiculo}.</span> {v.texto}
                      </p>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ─── Proyectar ─── */}
          <div className="flex gap-2">
            <button onClick={handleProject}
              disabled={!selectedVerse}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-[0.98] ${
                projectedRef
                  ? 'bg-green-600 text-white'
                  : 'bg-[#6c5ce7] hover:bg-[#5a4bd1] disabled:opacity-40 disabled:cursor-not-allowed'
              }`}>
              {projectedRef ? <><Check size={11} /> {t('biblia.projected')}</> : <><Send size={11} /> {t('biblia.project')}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
